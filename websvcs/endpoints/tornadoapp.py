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
import sys
import uuid

from auth_decorator import authenticated
from data import LocalFileHandler
from storage import MongoDbStorageHandler
from oauth import GoogleOAuth2Handler, GoogleSignoutHandler

define("data_path", default="../..", help="Path to data files")
define("port", default=8000, help="run on the given port", type=int)
define("client_host", default="http://localhost:8000", help="Client URL for Google OAuth2")
define("client_id", help="Client ID for Google OAuth2")
define("client_secret", help="Client Secrets for Google OAuth2")
define("config_file", help="Path to config file")
define("authorized_users", default=[], help="List of authorized user emails")
define("mongo_uri", default="mongodb://localhost:27017", help="MongoDB URI in the form mongodb://username:password@hostname:port")

settings = {
    "debug": True,
    "cookie_secret": uuid.uuid4()
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
    @authenticated
    def get(self):
        userkey = self.get_secure_cookie("whoami")
        user = None
        if not userkey is None:
            user = json.load(open('userinfo-%s.dat' % (userkey)))

        providers = []

        google_provider = { "id": "google", "label": "Google+", "active": False, "logo": "https://www.google.com/images/icons/ui/gprofile_button-64.png" }
        if not user is None:
            google_provider["active"] = True
            google_provider["user"] = {
                "fullname": user["name"],
                "email": user["email"]
            }
            if "picture" in user: google_provider["user"]["pic"] = user["picture"]
            if "link" in user: google_provider["user"]["profileLink"] = user["link"]

        providers.append(google_provider)
        providers.append({ "id": "facebook", "label": "Facebook", "active": False, "logo": "img/facebook_logo.jpg" })
        providers.append({ "id": "twitter", "label": "Twitter", "active": False, "logo":"https://twitter.com/images/resources/twitter-bird-white-on-blue.png" })

        self.write({"providers":providers});
        self.set_status(200)

class AuthProvidersHandler(tornado.web.RequestHandler):
    def get(self):
        providers = []
        providers.append({ "id": "google", "label": "Google+", "active": False, "logo": "https://www.google.com/images/icons/ui/gprofile_button-64.png" })

        self.write({"providers":providers});
        self.set_status(200)

def main():
    tornado.options.parse_command_line()
    if not options.config_file is None:
        tornado.options.parse_config_file(options.config_file)
        tornado.options.parse_command_line()

    settings["cookie_secret"] = options.client_secret

    logging.info("Starting Tornado web server on http://localhost:%s" % options.port)
    logging.info("--data_path=%s" % options.data_path)
    logging.info("--client_host=%s" % options.client_host)
    logging.info("--authorized_users=%s" % options.authorized_users)
    logging.info("--mongo_uri=%s" % options.mongo_uri)

    if not options.config_file is None:
        logging.info("--config_file=%s" % options.config_file)

    application = tornado.web.Application([
        (r"/", MainHandler),
        (r"/data?(.*)", LocalFileHandler),
        (r"/auth/signin/google", GoogleOAuth2Handler),
        (r"/auth/signin/google/oauth2_callback", GoogleOAuth2Handler),
        (r"/auth/signout/google", GoogleSignoutHandler),
        (r"/auth/whoami", WhoamiHandler),
        (r"/auth/providers", AuthProvidersHandler),
        (r"/storage/(.*)", MongoDbStorageHandler)
    ], **settings)
    application.listen(options.port, **server_settings)
    tornado.ioloop.IOLoop.instance().start()

if __name__ == "__main__":
    main()