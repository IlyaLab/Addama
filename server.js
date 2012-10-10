var express = require('express'),
    httpProxy = require('http-proxy');

exports.startServer = function(port, path) {

  var app = express();

  // Configuration

  app.configure(function(){
    app.use(express.static(__dirname + '/_public'));
  });

  app.configure('development', function(){
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
  });

  app.configure('production', function(){
    app.use(express.errorHandler());
  });

  var proxiedPort = port+1;

  app.listen(proxiedPort);

  var proxy_config = require('./proxy').proxy;

  var default_proxy =  { host: 'localhost', port: proxiedPort };

  httpProxy.createServer(function (req, res, proxy) {
    var target = {host:'localhost', port:proxiedPort};
    var i = proxy_config.length,
    config = {};

    while(i--){
        config = proxy_config[i];
        if (req.url.match(new RegExp('^'+config.url,'i'))) {
          target = { host:config.host, port:config.port};
          req.url = req.url.slice(config.url.length);
          console.log(req.url);
          break;
        }
    }

      proxy.proxyRequest(req, res, target);
  }).listen(port);

};
