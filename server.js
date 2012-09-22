var express = require('express'),
    httpProxy = require('http-proxy');

exports.startServer = function(port, path) {

console.log(port + ':' + path);

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

url= {
  '/svc': {
    host: 'glados1',
    port: 8000
  },
  'default': {
    host: 'localhost',
    port: proxiedPort
  }
};

httpProxy.createServer(function (req, res, proxy) {
  var target = {host:'localhost', port:proxiedPort};

if (req.url.match(/^\/svc/)) {
	target = { host:'glados1', port:8000};
	req.url = req.url.slice('/svc'.length);
}  

	console.log(target);

  proxy.proxyRequest(req, res, target);
}).listen(port);

};
