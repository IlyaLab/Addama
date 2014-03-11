import logging

from tornado.options import options
import tornado.web
import tornado.httpclient
import json
import urlparse

from oauth.decorator import OAuthenticated

from oauth2client.client import OAuth2WebServerFlow

from storage.mongo import GetUserinfo, SaveUserinfo

class GoogleOAuth2Handler(tornado.web.RequestHandler):
    def get(self):
        if "oauth2_callback" in self.request.uri:
            redirect = "%s/svc/auth/signin/google/oauth2_callback" % options.client_host
            scope = "https://www.googleapis.com/auth/devstorage.read_write https://www.google.com/m8/feeds https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/compute https://www.googleapis.com/auth/plus.me https://www.googleapis.com/auth/urlshortener https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile"
            flow = OAuth2WebServerFlow(options.client_id, options.client_secret, scope, redirect_uri=redirect)

            parsed = urlparse.urlparse(self.request.uri)
            code = urlparse.parse_qs(parsed.query)["code"][0]
            credentials = flow.step2_exchange(code)

            cred_json = json.loads(credentials.to_json())
            user_email = cred_json["id_token"]["email"]

            http_client = tornado.httpclient.HTTPClient()
            http_request = tornado.httpclient.HTTPRequest(url="https://www.googleapis.com/oauth2/v1/userinfo",
                headers={"Authorization": ("Bearer %s" % cred_json["access_token"])})
            response = http_client.fetch(http_request)

            cred_json["profile"] = json.loads(response.body)
            SaveUserinfo(user_email, cred_json)

            self.set_secure_cookie("whoami", user_email, expires_days=None)
            self.redirect(options.client_host)
        else:
            userkey = self.get_secure_cookie("whoami")
            credentials = GetUserinfo(userkey)

            if credentials is None or credentials.invalid:
                self.respond_redirect_to_auth_server()

    def respond_redirect_to_auth_server(self):
        redirect = "%s/svc/auth/signin/google/oauth2_callback" % options.client_host
        scope = "https://www.googleapis.com/auth/devstorage.read_write https://www.google.com/m8/feeds https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/compute https://www.googleapis.com/auth/plus.me https://www.googleapis.com/auth/urlshortener https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile"
        flow = OAuth2WebServerFlow(options.client_id, options.client_secret, scope, redirect_uri=redirect)

        self.set_status(301)
        self.set_header("Cache-Control", "no-cache")
        self.set_header("Location", flow.step1_get_authorize_url())

class GoogleSignoutHandler(tornado.web.RequestHandler):
    def get(self):
        self.clear_all_cookies()
        self.set_status(200)

class GoogleDriveProvidersHandler(tornado.web.RequestHandler):
    @OAuthenticated
    def get(self, *uri_path):
        logging.info("get:%s" % self.request.path)
        if self.request.path.endswith("/drive/about"):
            try:
                userkey = self.get_secure_cookie("whoami")
                credentials = GetUserinfo(userkey)

                http_request = tornado.httpclient.HTTPRequest(url="https://www.googleapis.com/drive/v2/about",
                    headers={"Authorization": ("Bearer %s" % credentials["access_token"] )})
                http_client = tornado.httpclient.HTTPClient()
                response = http_client.fetch(http_request)
                about = json.loads(response.body)

                logging.info("get:%s:%s:%s" % (self.request.path, about["name"], about["rootFolderId"]))
            except Exception, e:
                logging.error("An error occurred: %s" % e)
            self.set_status(200)
