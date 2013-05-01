var express = require("express");
var httpProxy = require("http-proxy");
var configuration = require("./proxy");

exports.startServer = function(port, path) {

    var app = express();

    // Configuration
    app.configure(function() {
        app.use(express.static(__dirname + "/_public"));
    });

    app.configure("development", function() {
        app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
    });

    app.configure("production", function() {
        app.use(express.errorHandler());
    });

    var proxiedPort = port + 1;

    app.listen(proxiedPort);

    var proxyConfigurations = configuration.proxy;

    var getMatchingConfig = function(req) {
        for (var i = 0; i < proxyConfigurations.length; i++) {
            var config = proxyConfigurations[i];
            if (req.url.match(new RegExp("^" + config.url, "i"))) {
                return config;
            }
        }
        return null;
    };

    httpProxy.createServer(
        function (req, res, proxy) {
            var target = {
                "host":"localhost",
                "port":proxiedPort
            };

            var proxyConfig = getMatchingConfig(req);
            if (proxyConfig) {
                target["host"] = proxyConfig.host;
                target["port"] = proxyConfig.port;

                if (proxyConfig.rewrite_url) {
                    if (!proxyConfig.keep_url) {
                        req.url = req.url.slice(proxyConfig.url.length);
                    }
                    req.url = proxyConfig.rewrite_url + req.url;
                    proxy.proxyRequest(req, res, target);
                    return;
                }

                if (!proxyConfig.keep_url) {
                    req.url = req.url.slice(proxyConfig.url.length);
                }
            }

            proxy.proxyRequest(req, res, target);
        }
    ).listen(port);
};
