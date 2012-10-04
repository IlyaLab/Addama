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

All services return status_code 500 if there is any error.

"""
import tornado.ioloop
from tornado.options import define, options, logging
import tornado.web
import tornado.auth
import tornado.httpclient
import os
import json
import uuid
import glob

from data import FilterHandler
from oauth import GoogleOAuth2Handler, GoogleSignoutHandler

define("data_path", default="../..", help="Path to data files")
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

class WhoamiHandler(tornado.web.RequestHandler):
    def get(self):
        userkey = self.get_cookie("whoami")
        user = None
        if not userkey is None:
            user = json.load(open('userinfo-%s.dat' % (userkey)))

        providers = []

        google_provider = { "id": "google", "label": "Google+", "active": False, "logo": "https://www.google.com/images/icons/ui/gprofile_button-64.png" }
        if not user is None:
            google_provider["active"] = True
            google_provider["user"] = {
                "pic": user["picture"],
                "fullname": user["name"],
                "email": user["email"],
                "profileLink": user["link"]
            }

        providers.append(google_provider)
        providers.append({ "id": "facebook", "label": "Facebook", "active": False, "logo": "/img/facebook_logo.jpg" })
        providers.append({ "id": "twitter", "label": "Twitter", "active": False, "logo":"https://twitter.com/images/resources/twitter-bird-white-on-blue.png" })

        self.write({"providers":providers});
        self.set_status(200)

class StorageHandler(tornado.web.RequestHandler):
    def get(self, identity):
        ids = identity.split("/")
        if len(ids) == 1:
            json_items = []
            for item in glob.glob("STORAGE/%s/*.dat" % ids[0]):
                item_id = item.replace("STORAGE/%s/" % ids[0], "").replace(".dat", "")
                json_items.append({
                    "id": item_id,
                    "uri": self.request.uri + "/" + item_id
                })
            self.write({ "items": json_items })
            self.set_status(200)
            return
        elif len(ids) == 2:
            file_path = "STORAGE/%s/%s.dat" % (ids[0],ids[1])
            if os.path.exists(file_path):
                json_data=open(file_path).read()
                self.write(json.loads(json_data))
                self.set_status(200)
                return
            else:
                self.set_status(404)
                return

        self.set_status(404)

    def post(self, identity):
        ids = identity.split("/")

        item_id = None
        if len(ids) == 1: item_id = uuid.uuid4()
        elif len(ids) == 2: item_id = ids[1]
        else: return

        if not os.path.exists("STORAGE"): os.makedirs("STORAGE")
        if not os.path.exists("STORAGE/" + ids[0]): os.makedirs("STORAGE/" + ids[0])

        f = open('STORAGE/%s/%s.dat' % (ids[0], item_id), 'w+')
        f.write(json.dumps(self.request.arguments))

        self.write({ "id": str(item_id) })
        self.set_status(200)

def main():
    tornado.options.parse_command_line()
    logging.info("Starting Tornado web server on http://localhost:%s" % options.port)
    application = tornado.web.Application([
        (r"/", MainHandler),
        (r"/data?(.*)", FilterHandler),
        (r"/auth/signin/google", GoogleOAuth2Handler),
        (r"/auth/signin/google/oauth2_callback", GoogleOAuth2Handler),
        (r"/auth/signout/google", GoogleSignoutHandler),
        (r"/auth/whoami", WhoamiHandler),
        (r"/storage/(.*)", StorageHandler)
    ], **settings)
    application.listen(options.port, **server_settings)
    tornado.ioloop.IOLoop.instance().start()

if __name__ == "__main__":
    main()