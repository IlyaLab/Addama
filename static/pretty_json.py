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
            root_url = options.service_root.strip("/")
            path_url = root_url + "/" + self.request.uri.strip("/")
            self.redirect("/%s/static/pretty.html?root=/%s&url=/%s" % (root_url, root_url, path_url));
            return True
        return False

