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

    if (req.url.match(new RegExp('^'+proxy_config.url,'i'))) {
      target = { host:proxy_config.host, port:proxy_config.port};
      req.url = req.url.slice('/svc'.length);
    }  

      proxy.proxyRequest(req, res, target);
  }).listen(port);

};
