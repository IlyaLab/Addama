import logging

from tornado.options import options
from tornado.httpclient import HTTPClient, HTTPRequest, HTTPError
import tornado.web
import json
import urllib
import base64
import unicodedata

from oauth.decorator import OAuthenticated
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
    def initialize(self):
        self.redirect_uri = "%s/svc/auth/signin/google/oauth2_callback" % options.client_host
        self.http_client = HTTPClient()

    def get(self):
        if "oauth2_callback" in self.request.path:
            oauth_code = self.get_argument("code", None)
            oauth_error = self.get_argument("error", None)
            oauth_state = self.get_argument("state", None)

            oauth_body = "code=%s&client_id=%s&client_secret=%s&redirect_uri=%s&grant_type=%s" % (oauth_code,
                options.client_id, options.client_secret, self.redirect_uri, "authorization_code")

            http_request = HTTPRequest(url="https://accounts.google.com/o/oauth2/token", method="POST",
                headers={"Content-Type": "application/x-www-form-urlencoded"},
                body=oauth_body)
            response = self.http_client.fetch(http_request)

            authoriJson = json.loads(response.body)
            if options.verbose: logging.info("GoogleOAuth2Handler.get:authoriJson=%s" % str(authoriJson))

            access_token = authoriJson["access_token"]
            refresh_token = authoriJson["refresh_token"]
            expires_in = authoriJson["expires_in"]
            token_type = authoriJson["token_type"]
            id_token = authoriJson["id_token"]

            segments = id_token.split('.')
            if (len(segments) != 3):
                logging.error('Wrong number of segments in token: %s' % id_token)
                return

            b64string = segments[1].encode('ascii')
            padded = b64string + '=' * (4 - len(b64string) % 4)
            padded = base64.urlsafe_b64decode(padded)

            if options.verbose: logging.info("GoogleOAuth2Handler.get:id_token=%s" % (padded))
            json_token = json.loads(padded)
            user_email = json_token["email"]

            http_request = HTTPRequest(url="https://www.googleapis.com/oauth2/v1/userinfo",
                headers={"Authorization": ("Bearer %s" % access_token)})
            response = self.http_client.fetch(http_request)

            authoriJson["profile"] = json.loads(response.body)
            SaveUserinfo(user_email, authoriJson)

            self.set_secure_cookie("whoami", user_email, expires_days=None)
            self.redirect(options.client_host)
            # /code?state=/profile&code=4/P7q7W91a-oMsCeLvIaQm6bTrgtp7

        elif "refresh" in self.request.path:
            userkey = self.get_secure_cookie("whoami")
            credentials = GetUserinfo(userkey)

            oauth_body = "refresh_token=%s&client_id=%s&client_secret=%s&grant_type=%s" % (credentials["refresh_token"],
                options.client_id, options.client_secret, "refresh_token")

            http_request = HTTPRequest(url="https://accounts.google.com/o/oauth2/token", method="POST",
                headers={"Content-Type": "application/x-www-form-urlencoded"},
                body=oauth_body)
            response = self.http_client.fetch(http_request)

        else:
            userkey = self.get_secure_cookie("whoami")
            credentials = GetUserinfo(userkey)

            if credentials is None or credentials.invalid:
                oauth = {
                    "response_type": "code",
                    "client_id": options.client_id,
                    "scope": " ".join(SCOPES),
                    "redirect_uri": self.redirect_uri,
                    "state": self.request.host,
                    "access_type": "offline",
                    "approval_prompt": "force"
                }

                self.set_status(301)
                self.set_header("Cache-Control", "no-cache")
                self.set_header("Location", "https://accounts.google.com/o/oauth2/auth?%s" % urllib.urlencode(oauth))

class GoogleSignoutHandler(tornado.web.RequestHandler):
    def get(self):
        self.clear_all_cookies()
        self.set_status(200)

class GoogleApisOAuthProxyHandler(tornado.web.RequestHandler):
    def initialize(self, url_base):
        self.URL_BASE = url_base.strip("/")

    def get(self, *uri_path):
        self.oauth_http("GET", "/".join(map(str,uri_path)))

    def post(self, *uri_path):
        self.oauth_http("POST", "/".join(map(str,uri_path)))

    def put(self, *uri_path):
        self.oauth_http("PUT", "/".join(map(str,uri_path)))

    @OAuthenticated
    def oauth_http(self, method, uri):
        try:
            if options.verbose: logging.info("driveAPI: %s %s/%s" % (method, self.URL_BASE, uri.strip("/")))

            userkey = self.get_secure_cookie("whoami")
            if not userkey: raise HTTPError(401, message="User is not logged-in")

            credentials = GetUserinfo(userkey)
            if not credentials: raise HTTPError(401, message="User has not authorized OAUTH access")

            headers = { "Authorization": ( "Bearer %s" % credentials["access_token"] ) }

            if method == "GET":
                query_parameters = urllib.urlencode(self.request.arguments)
                url = "%s/%s?%s" % (self.URL_BASE, uri.strip("/"), query_parameters)
                http_request = HTTPRequest(url=url, method=method, headers=headers)
            else:
                url = "%s/%s" % (self.URL_BASE, uri.strip("/"))
                headers["Content-Type"] = self.request.headers["Content-Type"]
                if "If-Match" in self.request.headers: headers["If-Match"] = self.request.headers["If-Match"]

                logging.info("content-type=%s" % self.request.headers["Content-Type"])
                logging.info("body=%s" % self.request.body)
                if self.request.headers["Content-Type"] == "application/json":
                    logging.info("body=%s" % json.loads(self.request.body))

                http_request = HTTPRequest(url=url, method=method, headers=headers, body=self.request.body)

            http_client = HTTPClient()
            http_resp = http_client.fetch(http_request)

            if options.verbose: logging.info("driveAPI: %s %s/%s [%s]" % (method, self.URL_BASE, uri, http_resp.code))

            self.write(http_resp.body)
            self.set_status(http_resp.code)

        except HTTPError, e:
            logging.error("driveAPI: %s %s/%s [%s]" % (method, self.URL_BASE, uri, e.response.code))
            self.set_status(e.response.code)
        except Exception, e:
            logging.error("driveAPI: %s %s/%s [%s]" % (method, self.URL_BASE, uri, e))
            self.set_status(500, message=e)
