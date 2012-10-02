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
import tornado.httpclient
import qedconf
import os
import json

from oauth2client.client import AccessTokenRefreshError
from oauth2client.client import OAuth2WebServerFlow
from oauth2client.file import Storage

import urlparse

define("port", default=8000, help="run on the given port", type=int)
define("client_host", default="http://localhost:8000", help="Client URL for Google OAuth2")
define("client_id", help="Client ID for Google OAuth2")
define("client_secret", help="Client Secrets for Google OAuth2")

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

class GoogleOAuth2Handler(tornado.web.RequestHandler):
    def get(self):
        if "oauth2_callback" in self.request.uri:
            redirect = "%s/svc/auth/signin/google_plus/oauth2_callback" % (options.client_host)
            scope = "https://www.googleapis.com/auth/devstorage.read_write https://www.google.com/m8/feeds https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/compute https://www.googleapis.com/auth/plus.me https://www.googleapis.com/auth/urlshortener https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile"
            flow = OAuth2WebServerFlow(options.client_id, options.client_secret, scope, redirect_uri=redirect)

            parsed = urlparse.urlparse(self.request.uri)
            code = urlparse.parse_qs(parsed.query)["code"][0]
            credentials = flow.step2_exchange(code)

            cred_json = json.loads(credentials.to_json())
            user_email = cred_json["id_token"]["email"]
            access_token = cred_json["access_token"]
            storage = Storage('credentials-%s.dat' % (user_email))
            storage.put(credentials)

            http_client = tornado.httpclient.HTTPClient()
            response = http_client.fetch("https://www.googleapis.com/oauth2/v1/userinfo?access_token=%s"%(access_token))
            f = open('userinfo-%s.dat' % (user_email), 'w+')
            f.write(response.body)

            self.set_cookie("whoami", user_email)
            self.redirect("/")
        else:
            userkey = self.get_cookie("whoami")
            storage = Storage('credentials-%s.dat' % (userkey))
            credentials = storage.get()

            if credentials is None or credentials.invalid:
                self.respond_redirect_to_auth_server()

    def respond_redirect_to_auth_server(self):
        redirect = "%s/svc/auth/signin/google_plus/oauth2_callback" % (options.client_host)
        scope = "https://www.googleapis.com/auth/devstorage.read_write https://www.google.com/m8/feeds https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/compute https://www.googleapis.com/auth/plus.me https://www.googleapis.com/auth/urlshortener https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile"
        flow = OAuth2WebServerFlow(options.client_id, options.client_secret, scope, redirect_uri=redirect)

        self.set_status(301)
        self.set_header('Cache-Control', 'no-cache')
        self.set_header('Location', flow.step1_get_authorize_url())

class WhoamiHandler(tornado.web.RequestHandler):
    def get(self):
        userkey = self.get_cookie("whoami")
        user = None
        if not userkey is None:
            user = json.load(open('userinfo-%s.dat' % (userkey)))

        providers = []

        if not user is None:
            providers.append({
                "id": "google_plus",
                "label": "Google+",
                "user": {
                    "pic": user["picture"],
                    "fullname": user["name"],
                    "email": user["email"],
                    "profileLink": user["link"]
                },
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

def main():
    tornado.options.parse_command_line()
    logging.info("Starting Tornado web server on http://localhost:%s" % options.port)
    application = tornado.web.Application([
        (r"/", MainHandler),
        (r"/data?(.*)", FilterHandler),
        (r"/auth/signin/google_plus", GoogleOAuth2Handler),
        (r"/auth/signin/google_plus/oauth2_callback", GoogleOAuth2Handler),
        (r"/auth/signout/google_plus", GoogleSignoutHandler),
        (r"/auth/whoami", WhoamiHandler)
    ], **settings)
    application.listen(options.port, **server_settings)
    tornado.ioloop.IOLoop.instance().start()

if __name__ == "__main__":
    main()