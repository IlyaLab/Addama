import logging

from tornado.options import options
import tornado.web
import tornado.httpclient
import json
import urlparse
import urllib

from oauth.decorator import OAuthenticated

from oauth2client.client import OAuth2WebServerFlow

from storage.mongo import GetUserinfo, SaveUserinfo

# "https://www.googleapis.com/auth/devstorage.read_write",
# "https://www.google.com/m8/feeds",
# "https://www.googleapis.com/auth/compute",
# "https://www.googleapis.com/auth/urlshortener",
# "https://www.googleapis.com/auth/drive",
#    "https://www.googleapis.com/auth/userinfo.email",
#    "https://www.googleapis.com/auth/userinfo.profile",

SCOPES = [
    "email", "profile",
    "https://www.googleapis.com/auth/drive.file",
    "https://www.googleapis.com/auth/drive.appdata",
    "https://www.googleapis.com/auth/plus.me",
    "https://spreadsheets.google.com/feeds"
]

GOOGLE_APIS = "https://www.googleapis.com"
GOOGLE_SPREADSHEET_APIS = "https://spreadsheets.google.com"

class GoogleOAuth2Handler(tornado.web.RequestHandler):
    def get(self):
        if "oauth2_callback" in self.request.uri:
            redirect = "%s/svc/auth/signin/google/oauth2_callback" % options.client_host

            flow = OAuth2WebServerFlow(options.client_id, options.client_secret, " ".join(SCOPES), redirect_uri=redirect)

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
        flow = OAuth2WebServerFlow(options.client_id, options.client_secret, " ".join(SCOPES), redirect_uri=redirect)

        self.set_status(301)
        self.set_header("Cache-Control", "no-cache")
        self.set_header("Location", flow.step1_get_authorize_url())

class GoogleSignoutHandler(tornado.web.RequestHandler):
    def get(self):
        self.clear_all_cookies()
        self.set_status(200)

class GoogleApisOAuthProxyHandler(tornado.web.RequestHandler):
    def initialize(self, url_base):
        self.URL_BASE = url_base.strip("/")

    def get(self, *uri_path):
        if options.verbose: logging.info("driveAPI.get:%s" % self.request.path)

        response = self.oauth_http("GET", "/".join(map(str,uri_path)))
        if not response:
            self.set_status(400)
            return

        self.write(response.body)
        self.set_status(response.code)

    def post(self, *uri_path):
        if options.verbose: logging.info("driveAPI.post:%s" % self.request.path)

        response = self.oauth_http("POST", "/".join(map(str,uri_path)))
        if not response:
            self.set_status(400)
            return

        self.write(response.body)
        self.set_status(response.code)

    def put(self, *uri_path):
        if options.verbose: logging.info("driveAPI.put:%s" % self.request.path)

        response = self.oauth_http("PUT", "/".join(map(str,uri_path)))
        if not response:
            self.set_status(400)
            return

        self.write(response.body)
        self.set_status(response.code)

    @OAuthenticated
    def oauth_http(self, method, uri):
        try:
            if options.verbose: logging.info("driveAPI: %s %s/%s" % (method, self.URL_BASE, uri.strip("/")))

            userkey = self.get_secure_cookie("whoami")
            if not userkey: raise tornado.httpclient.HTTPError(401, message="User is not logged-in")

            credentials = GetUserinfo(userkey)
            if not credentials: raise tornado.httpclient.HTTPError(401, message="User has not authorized OAUTH access")

            headers = { "Authorization": ( "Bearer %s" % credentials["access_token"] ) }

            if method == "GET":
                query_parameters = urllib.urlencode(self.request.arguments)
                url = "%s/%s?%s" % (self.URL_BASE, uri.strip("/"), query_parameters)
                http_request = tornado.httpclient.HTTPRequest(url=url, method=method, headers=headers)
            else:
                url = "%s/%s" % (self.URL_BASE, uri.strip("/"))
                headers["Content-Type"] = self.request.headers["Content-Type"]
                if "If-Match" in self.request.headers: headers["If-Match"] = self.request.headers["If-Match"]

                logging.info("content-type=%s" % self.request.headers["Content-Type"])
                logging.info("body=%s" % self.request.body)
                if self.request.headers["Content-Type"] == "application/json":
                    logging.info("body=%s" % json.loads(self.request.body))

                http_request = tornado.httpclient.HTTPRequest(url=url, method=method, headers=headers, body=self.request.body)

            http_client = tornado.httpclient.HTTPClient()
            http_resp = http_client.fetch(http_request)

            if options.verbose: logging.info("driveAPI: %s %s/%s [%s]" % (method, self.URL_BASE, uri, http_resp.code))
            return http_resp
        except Exception, e:
            logging.error("driveAPI: %s %s/%s [%s]" % (method, self.URL_BASE, uri, e))
            raise e
