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
import json

from data import LocalFileHandler
from storage import StorageHandler
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

class MainHandler(tornado.web.RequestHandler):
    def get(self):
        items = []
        items.append({ "id": "data", "uri": self.request.uri + "data" })
        self.write({"items":items});
        self.set_status(200)

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

def main():
    tornado.options.parse_command_line()
    logging.info("Starting Tornado web server on http://localhost:%s" % options.port)
    application = tornado.web.Application([
        (r"/", MainHandler),
        (r"/data?(.*)", LocalFileHandler),
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