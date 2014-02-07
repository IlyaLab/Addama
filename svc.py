#!/usr/bin/env python

"""
Simple tornado app to list and read files.

Start server:
python svc.py -port=8001

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
import logging

import tornado.ioloop
from tornado.options import define, options
import tornado.web
import json

from oauth.google import GoogleOAuth2Handler, GoogleSignoutHandler
from oauth.decorator import OAuthenticated
from datastores.mongo import MongoDbQueryHandler
from datastores.localfiles import LocalFileHandler
from storage.mongo import MongoDbStorageHandler, GetUserinfo
from storage.collections import MongoDbCollectionsHandler
from scc.github import GitWebHookHandler

define("data_path", default="../..", help="Path to data files")
define("port", default=8000, help="run on the given port", type=int)
define("client_host", default="http://localhost:8000", help="Client URL for Google OAuth2")
define("client_id", help="Client ID for Google OAuth2")
define("client_secret", help="Client Secrets for Google OAuth2")
define("config_file", help="Path to config file")
define("config_file_json", help="Path to JSON config file")
define("authorized_users", default=[], help="List of authorized user emails")
define("mongo_storage_uri", default="mongodb://localhost:27017", help="MongoDB URI in the form mongodb://username:password@hostname:port")
define("mongo_storage_db", default="storage_db", help="MongoDB database name")

define("mongo_datastores", default=[("ds", "mongodb://localhost:27017")], help="Lookup MongoDB configurations")
define("mongo_rows_limit", default=1000, type=int, help="Lookup MongoDB limit on rows returned from query")
define("case_sensitive_lookups", default=[], help="List of database names to apply case sensitive lookups")
define("github_repo_api_url", help="Link to repository api url (see examples/svc.config)")
define("github_project_root", help="Local path to main repository branch")
define("github_branches_root", help="Local path to top-level branches directory")
define("github_postproc_cmd", help="Command-line to execute after checkout")
define("github_git_cmd", help="Path to git executable", default="git")
define("github_branches_json_path", help="Path to publish branches json", default=".")

define("verbose", default=False, type=bool, help="Enable verbose printouts")

settings = {
    "debug": True,
    "cookie_secret": "not_a_big_secret"
}

server_settings = {
    "xheaders" : True,
    "address" : "0.0.0.0"
}

class DataStoreConfiguration(object):
    def __init__(self, uri, case_sensitive_databases):
        self.set_uri(uri)
        self.case_sensitive_databases = frozenset(case_sensitive_databases)

    def get_uri(self):
        return self._uri

    def set_uri(self, uri):
        self._uri = uri

    def is_case_sensitive_database(self, database_name):
        return database_name in self.case_sensitive_databases

    uri = property(get_uri, set_uri)


class MainHandler(tornado.web.RequestHandler):
    def get(self):
        items = []
        items.append({ "id": "data", "uri": self.request.path + "data" })
        items.append({ "id": "datastores", "uri": self.request.path + "datastores" })
        self.write({"items": items})
        self.set_status(200)

class WhoamiHandler(tornado.web.RequestHandler):
    @OAuthenticated
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

        self.write({"providers":[ google_provider ]})
        self.set_status(200)

class AuthProvidersHandler(tornado.web.RequestHandler):
    def get(self):
        google_provider = { "id": "google", "label": "Google+", "active": False, "logo": "https://www.google.com/images/icons/ui/gprofile_button-64.png" }
        self.write({"providers": [ google_provider ] })
        self.set_status(200)


def parse_datastore_configuration():
    datastore_map = {}
    for datastore_config in options.mongo_datastores:
        if (len(datastore_config) == 2):
            datastore_id, uri = datastore_config
            datastore_map[datastore_id] = DataStoreConfiguration(uri, [])
        elif (len(datastore_config) == 3):
            datastore_id, uri, case_sensitive_databases = datastore_config
            datastore_map[datastore_id] = DataStoreConfiguration(uri, case_sensitive_databases)
        else:
            logging.error("Invalid datastore config: " + repr(datastore_config))

    return datastore_map

def main():
    options.parse_command_line()
    if not options.config_file is None:
        options.parse_config_file(options.config_file)
        options.parse_command_line()

    if options.client_secret:
        settings["cookie_secret"] = options.client_secret

    logging.info("Starting Tornado web server on http://localhost:%s" % options.port)
    logging.info("--data_path=%s" % options.data_path)
    logging.info("--client_host=%s" % options.client_host)
    logging.info("--authorized_users=%s" % options.authorized_users)
    logging.info("--mongo_storage_uri=%s" % options.mongo_storage_uri)
    logging.info("--mongo_storage_db=%s" % options.mongo_storage_db)
    logging.info("--mongo_rows_limit=%s" % options.mongo_rows_limit)

    if not options.config_file is None:
        logging.info("--config_file=%s" % options.config_file)

    if not options.config_file_json is None:
        logging.info("--config_file_json=%s" % options.config_file_json)

    if not options.github_repo_api_url is None:
        logging.info("--github_repo_api_url=%s" % options.github_repo_api_url)
        logging.info("--github_project_root=%s" % options.github_project_root)
        logging.info("--github_branches_root=%s" % options.github_branches_root)
        logging.info("--github_postproc_cmd=%s" % options.github_postproc_cmd)
        logging.info("--github_git_cmd=%s" % options.github_git_cmd)
        logging.info("--github_branches_json_path=%s" % options.github_branches_json_path)
        logging.info("Starting GitHub Web Hook at http://localhost:%s/gitWebHook" % options.port)

    MongoDbQueryHandler.datastores = parse_datastore_configuration()

    if not options.config_file_json is None:
        MongoDbQueryHandler.datastores_config = json.load(open(options.config_file_json))

    application = tornado.web.Application([
        (r"/", MainHandler),
        (r"/auth/signin/google", GoogleOAuth2Handler),
        (r"/auth/signin/google/oauth2_callback", GoogleOAuth2Handler),
        (r"/auth/signout/google", GoogleSignoutHandler),
        (r"/auth/whoami", WhoamiHandler),
        (r"/auth/providers", AuthProvidersHandler),
        (r"/datastores", MongoDbQueryHandler),
        (r"/datastores/(.*)", MongoDbQueryHandler),
        (r"/data?(.*)", LocalFileHandler),
        (r"/storage/(.*)", MongoDbStorageHandler),
        (r"/collections/(.*)", MongoDbCollectionsHandler),
        (r"/gitWebHook?(.*)", GitWebHookHandler)
    ], **settings)
    application.listen(options.port, **server_settings)
    tornado.ioloop.IOLoop.instance().start()

if __name__ == "__main__":
    main()
