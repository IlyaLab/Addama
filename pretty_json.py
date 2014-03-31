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
        self.annotate_service_root(arg)

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
            path_url = self.request.uri
            root_url = ""
            if options.service_root != "/":
                root_url = "/" + options.service_root.strip("/")
                path_url = root_url + self.request.uri

            html = self.template_loader.load("apis.html").generate(url=path_url, root_path=root_url)
            super(PrettyJsonRequestHandler, self).write(html)
            return True
        return False

    def annotate_service_root(self, arg):
        if isinstance(arg, (list)):
            for item in arg:
                self.annotate_service_root(item)

        elif type(arg) is dict:
            if "uri" in arg:
                if options.service_root != "/":
                    arg["uri"] = "/" + options.service_root.strip("/") + arg["uri"]

            for key in ["items", "files", "directories"]:
                if key in arg:
                    for item in arg[key]:
                        self.annotate_service_root(item)