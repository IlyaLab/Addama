from tornado.options import options
import tornado.web
import os
import sys

class ConfigurationsFileHandler(tornado.web.RequestHandler):
    def get(self,filepath):
        try:
            fullpath = os.path.join(options.configurations_path, filepath)

            if os.path.isdir(fullpath):
                dirs=[]
                files=[]

                for f in os.listdir(fullpath):
                    if not f.startswith("."):
                        item = { "label": os.path.basename(f), "uri": os.path.join(self.request.uri, f) }
                        if os.path.isdir(os.path.join(fullpath, f)):
                            dirs.append(item)
                        else:
                            files.append(item)

                self.write({ "directories": dirs, "files": files })
            else:
                rfile = open(fullpath)
                try:
                    self.write(rfile.read())
                finally:
                    rfile.close()
        except:
            raise tornado.web.HTTPError(404, str(sys.exc_info()[1]))
