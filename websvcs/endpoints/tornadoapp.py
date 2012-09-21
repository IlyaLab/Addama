#!/usr/bin/env python
"""
Simple tornado app to list and read files.

Start server:
python tornado.py -port=8881

(Default port is 8888)

Using service

/svc
/svc/list/path/to/dir
/svc/read/path/to/file
/svc/filter/path/to/file?ids=1,2

I'm not really sure what filter is supposed to do so i may have gotten the matching wrong.

All services return -1 if there is any error.

"""
import tornado.ioloop
from tornado.options import define, options, logging
import tornado.web
import qedconf
import os


define("port", default=8888, help="run on the given port", type=int)

settings = {
    "debug": True,
}

server_settings = {
    "xheaders" : True,
}

class MainHandler(tornado.web.RequestHandler):
    def get(self):
        self.write("Service Root")

class ReadHandler(tornado.web.RequestHandler):
    def get(self,filepath):
        try:
            rfile = open(qedconf.BASE_PATH + filepath)
            self.write(rfile.read())
            rfile.close()
        except:
            self.write("-1")

class FilterHandler(tornado.web.RequestHandler):
    def get(self,filepath):
        try:
            ids=self.get_argument("ids")
           
            if not ids is None: 
                ids = ids.split(",")

            rfile = open(qedconf.BASE_PATH + filepath)
            for idx, line in enumerate(rfile):
                if idx == 0:
                    self.write(line.rstrip())
                else:
                    for id in ids:
                        if id in line:
                            self.write(line.rstrip())
                            break
        except:
            self.write("-1")

class ListHandler(tornado.web.RequestHandler):
    def get(self,filepath):
        try:
            dirs=[]
            files=[]
            for f in os.listdir(qedconf.BASE_PATH + filepath):
                if not f.startswith("."):
                    label = os.path.basename(f)
                    item = '{"label":"%s", "uri":"%s"}' % (label, os.path.join(filepath,f))

                    if os.path.isdir(qedconf.BASE_PATH + filepath + f):
                        dirs.append(item)
                    else:
                        files.append(item)

            self.write('{ "directories": [' + ",".join(dirs) + '], "files": [' + ",".join(files) + '] }')
        except:
            self.write("-1")



def main():
    tornado.options.parse_command_line()
    logging.info("Starting Tornado web server on http://localhost:%s" % options.port)
    application = tornado.web.Application([
        (r"/", MainHandler),
        (r"/list/(.*)", ListHandler),
        (r"/filter/(.*)", FilterHandler),
        (r"/read/(.*)", ReadHandler),
    ], **settings)
    application.listen(options.port, **server_settings)
    tornado.ioloop.IOLoop.instance().start()

if __name__ == "__main__":
    main()