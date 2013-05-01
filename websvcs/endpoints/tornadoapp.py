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
from storage import MongoDbLookupHandler, MongoDbPairwiseLookupHandler, MongoDbMutSigHandler, MongoDbFeaturesByLocationHandler, MongoDbStorageHandler, GetUserinfo
from analysis import RegulomeExplorerDbQueryHandler
from oauth import GoogleOAuth2Handler, GoogleSignoutHandler

define("data_path", default="../..", help="Path to data files")
define("port", default=8000, help="run on the given port", type=int)
define("client_host", default="http://localhost:8000", help="Client URL for Google OAuth2")
define("client_id", help="Client ID for Google OAuth2")
define("client_secret", help="Client Secrets for Google OAuth2")
define("config_file", help="Path to config file")
define("authorized_users", default=[], help="List of authorized user emails")
define("mongo_uri", default="mongodb://localhost:27017", help="MongoDB URI in the form mongodb://username:password@hostname:port")
define("mongo_lookup_uri", default="mongodb://localhost:27018", help="Lookup MongoDB URI in the form mongodb://username:password@hostname:port")
define("mongo_lookup_query_limit", default=1000, type=int, help="Lookup MongoDB limit on rows returned from query")
define("mongo_pairwise_lookup_uri", default="mongodb://localhost:27018", help="Lookup MongoDB URI in the form mongodb://username:password@hostname:port")
define("case_sensitive_lookups", default=[], help="List of MongoDB lookup database names for which field names will not be lowercased in queries")


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

        google_provider = { "id": "google", "label": "Google+", "active": False, "logo": "https://www.google.com/images/icons/ui/gprofile_button-64.png" }
        if not userkey is None:
            user = GetUserinfo(userkey)
            if not user is None:
                google_provider["active"] = True
                google_provider["user"] = {}
                if "id_token" in user and "email" in user["id_token"]: google_provider["user"]["email"] = user["id_token"]["email"]
                if "profile" in user:
                    user_profile = user["profile"]
                    if "name" in user_profile: google_provider["user"]["fullname"] = user_profile["name"]
                    if "picture" in user_profile: google_provider["user"]["pic"] = user_profile["picture"]
                    if "link" in user_profile: google_provider["user"]["profileLink"] = user_profile["link"]

        providers = []
        providers.append(google_provider)
        # providers.append({ "id": "facebook", "label": "Facebook", "active": False, "logo": "img/facebook_logo.jpg" })
        # providers.append({ "id": "twitter", "label": "Twitter", "active": False, "logo":"https://twitter.com/images/resources/twitter-bird-white-on-blue.png" })

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
    logging.info("--mongo_lookup_uri=%s" % options.mongo_lookup_uri)
    logging.info("--mongo_lookup_query_limit=%s" % options.mongo_lookup_query_limit)

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
        (r"/storage/(.*)", MongoDbStorageHandler),
        (r"/lookups?(.*)", MongoDbLookupHandler),
        (r"/mutsig_rankings?(.*)", MongoDbMutSigHandler),
        (r"/pw_lookups?(.*)", MongoDbMutSigHandler),
        (r"/features_by_location?(.*)", MongoDbFeaturesByLocationHandler),
        (r"/RE/query/?(.*)", RegulomeExplorerDbQueryHandler)
    ], **settings)
    application.listen(options.port, **server_settings)
    tornado.ioloop.IOLoop.instance().start()

if __name__ == "__main__":
    main()