import logging

from tornado.options import options
import tornado.web
import tornado.template

import json
import os

class PrettyJsonRequestHandler(tornado.web.RequestHandler):
    def prepare(self):
        path_to_file = os.path.abspath(__file__)
        path_to_project = path_to_file[:path_to_file.rfind("Addama")]
        template_path = "/%s/Addama/templates" % path_to_project.strip("/")
        self.template_loader = tornado.template.Loader(template_path)

    def write(self, arg):
        if isinstance(arg, (list)):
            if self.show_api(): return
            return super(PrettyJsonRequestHandler, self).write(json.dumps(arg))

        elif type(arg) is dict:
            if self.show_api(): return
            return super(PrettyJsonRequestHandler, self).write(json.dumps(arg, indent=4))

        return super(PrettyJsonRequestHandler, self).write(arg)

    def show_api(self):
        h_accept = self.request.headers["Accept"]
        if options.verbose: logging.info("h_accept=%s" % str(h_accept))

        if "text/html" in h_accept.split(","):
            root_url = options.service_root
            if root_url != "/": root_url = root_url + "/"
            path_url = root_url + self.request.uri.strip("/")
            html = self.template_loader.load("apis.html").generate(root=root_url, url=path_url)
            super(PrettyJsonRequestHandler, self).write(html)
            return True
        return False

