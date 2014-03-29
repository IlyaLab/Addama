import logging

from tornado.options import options
import tornado.web

import json

class PrettyJsonRequestHandler(tornado.web.RequestHandler):
    def write(self, arg):
        if isinstance(arg, (list)):
            if self.redirects(): return
            return super(PrettyJsonRequestHandler, self).write(json.dumps(arg))

        elif type(arg) is dict:
            if self.redirects(): return
            return super(PrettyJsonRequestHandler, self).write(json.dumps(arg, indent=4))

        return super(PrettyJsonRequestHandler, self).write(arg)

    def redirects(self):
        h_accept = self.request.headers["Accept"]
        if "text/html" in h_accept.split(","):
            self.redirect("/static/pretty.html?url=" + self.request.uri);
            return True
        return False

