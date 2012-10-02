#!/usr/bin/env python
"""
Simple tornado app to list and read files.

Start server:
python tornado.py -port=8001

(Default port is 8000)

Using service

/
List:
/data/path/to/dir
Read:
/data/path/to/file
Filter:
/data/path/to/file?rows=id1,id2&cols=colid1,colid2

All services return -1 if there is any error.

"""
import tornado.ioloop
from tornado.options import define, options, logging
import tornado.web
import tornado.auth
import qedconf
import os


define("port", default=8000, help="run on the given port", type=int)

settings = {
    "debug": True,
}

server_settings = {
    "xheaders" : True,
    "address" : "0.0.0.0"
}

def _writeFilteredRow(self,line,cols):
    if len(cols)==1:
        self.write(line)
    else:
        vs=line.rstrip("\n\r").split("\t")

        self.write("\t".join([vs[i] for i in cols]))
        self.write("\n")

class MainHandler(tornado.web.RequestHandler):
    def get(self):
        self.write("Service Root")


class FilterHandler(tornado.web.RequestHandler):
   

    def get(self,filepath):
        self.content_type = "text/plain"
        try:
            rows=self.get_arguments("rows")
            if len(rows) > 0: 
                rows = rows[0].split(",")
            cols=self.get_arguments("cols")
            if len(cols) > 0: 
                cols = frozenset(cols[0].split(","))
            
            goodcols=[0]
            
            if len(rows) > 0 or len(cols)>0: 
                

                rfile = open(qedconf.BASE_PATH + filepath)
                for idx, line in enumerate(rfile):
                    if idx == 0:
                        colhead = line.rstrip("\n\r").split()
                        if len(cols) > 0:
                            for i,h in enumerate(colhead):
                                if h in cols:
                                    goodcols.append(i)
                        goodcols=frozenset(goodcols)
                        _writeFilteredRow(self,line,goodcols)

                        
                    elif len(rows)==0:
                        _writeFilteredRow(self,line,goodcols)
                    else:
                        rheaader = line[:line.rfind("\t")]
                        for id in rows:
                            if id in rheaader:
                                _writeFilteredRow(self, line, goodcols)
                                break
            elif os.path.isdir(qedconf.BASE_PATH + filepath):
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
            else:
                rfile = open(qedconf.BASE_PATH + filepath)
                self.write(rfile.read())
                rfile.close()

        except:
            self.write("-1")

class GoogleHandler(tornado.web.RequestHandler, tornado.auth.GoogleMixin):
    @tornado.web.asynchronous
    def get(self):
        print "GoogleHandler.get"
        if self.get_argument("openid.mode", None):
            self.get_authenticated_user(self.async_callback(self._on_auth))
            return
        self.authenticate_redirect(callback_uri="/svc/auth/signin/google_plus")

    def _on_auth(self, user):
        print "GoogleHandler._on_auth(%s)" % user
        if not user:
            raise tornado.web.HTTPError(500, "Google auth failed")
        # Save the user with, e.g., set_secure_cookie()
        self.set_cookie("whoami", user["email"])
        self.redirect("/")

class WhoamiHandler(tornado.web.RequestHandler):
    def get(self):
        userkey = self.get_cookie("whoami")

        providers = []

        if not userkey is None:
            user = {
                "pic": "https://plus.google.com/u/0/me",
                "fullname": "Example User",
                "email": userkey
            }

            providers.append({
                "id": "google_plus",
                "label": "Google+",
                "user": user,
                "active": True
            })
        else:
            providers.append({
                "id": "google_plus",
                "label": "Google+",
                "active": False
            })

        providers.append({ "id": "facebook", "label": "Facebook", "active": False })

        self.write({"providers":providers});
        self.set_status(200)

class GoogleSignoutHandler(tornado.web.RequestHandler):
    def get(self):
        self.clear_all_cookies()
        self.set_status(200)

class SignoutHandler(tornado.web.RequestHandler):
    def get(self):
        self.clear_all_cookies()
        self.set_status(200)

def main():
    tornado.options.parse_command_line()
    logging.info("Starting Tornado web server on http://localhost:%s" % options.port)
    application = tornado.web.Application([
        (r"/", MainHandler),
        (r"/data?(.*)", FilterHandler),
        (r"/auth/signin/google_plus", GoogleHandler),
        (r"/auth/signout/google_plus", GoogleSignoutHandler),
        (r"/auth/whoami", WhoamiHandler)
    ], **settings)
    application.listen(options.port, **server_settings)
    tornado.ioloop.IOLoop.instance().start()

if __name__ == "__main__":
    main()