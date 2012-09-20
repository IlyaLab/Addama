#!/usr/bin/env python

import BaseHTTPServer
import CGIHTTPServer
import cgitb;

cgitb.enable()

server = BaseHTTPServer.HTTPServer
handler = CGIHTTPServer.CGIHTTPRequestHandler
server_address = ("", 8000)
handler.cgi_directories = ["/endpoints"]

httpd = server(server_address, handler)
httpd.serve_forever()
