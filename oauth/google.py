import logging

from tornado.options import options
from tornado.httpclient import HTTPClient, HTTPRequest, HTTPError
import tornado.web

import json
import urllib
import base64

from oauth.decorator import OAuthenticated
from storage.mongo import open_collection

# https://developers.google.com/drive/web/scopes
SCOPES = [
    "email", "profile",
    "https://www.googleapis.com/auth/drive.file",
    "https://www.googleapis.com/auth/drive.appdata",
    "https://www.googleapis.com/auth/plus.me",
    "https://spreadsheets.google.com/feeds"
]

# Google OAUTH flow is implemented with these handlers
# 1. User sign-in request goes to GoogleOAuth2SignInHandler         : >-redirects-> Google OAUTH page
# 2. Google OAUTH page, user signs-in and approves scopes           : >-redirects-> GoogleOAuth2CallbackHandler
# 3. GoogleOAuth2CallbackHandler stores user info and access tokens : >-redirects-> WebApp

# Redirects users to Google for authentication and authorization of 'scopes'
class GoogleOAuth2SignInHandler(tornado.web.RequestHandler):
    def initialize(self):
        self.redirect_uri = "%s/svc/auth/signin/google/oauth2_callback" % options.client_host

    def get(self):
        final_redirect = self.request.host  # TODO : specify based on requesting application

        oauth = {
            "response_type": "code",
            "client_id": options.client_id,
            "scope": " ".join(SCOPES),
            "redirect_uri": self.redirect_uri,
            "state": final_redirect,
            "access_type": "offline",
            "approval_prompt": "force"
        }

        # Redirect user to Google+ for signin
        self.set_status(301)
        self.set_header("Cache-Control", "no-cache")
        self.set_header("Location", "https://accounts.google.com/o/oauth2/auth?%s" % urllib.urlencode(oauth))

# This request is received when Google redirects user from Google OAUTH service
class GoogleOAuth2CallbackHandler(tornado.web.RequestHandler):
    def initialize(self):
        self.redirect_uri = "%s/svc/auth/signin/google/oauth2_callback" % options.client_host
        self.http_client = HTTPClient()

    def get(self):
        # TODO: Handle final redirect (/code?state=/profile&code=...)
        final_redirect = options.client_host
        oauth_state = self.get_argument("state", None)

        oauth_error = self.get_argument("error", None)
        if not oauth_error is None:
            if options.verbose: logging.error("GoogleOAuth2CallbackHandler.get:error=%s" % oauth_error)
            self.redirect(final_redirect)
            return

        oauth_code = self.get_argument("code", None)
        if oauth_code is None:
            if options.verbose: logging.error("GoogleOAuth2CallbackHandler.get:oauth_code is missing")
            self.redirect(final_redirect)
            return

        # Exchanging Google-provided authorization code for authorization token
        param_str = "code=%s&client_id=%s&client_secret=%s&redirect_uri=%s&grant_type=authorization_code"
        http_body = param_str % (oauth_code, options.client_id, options.client_secret, self.redirect_uri)

        http_request = HTTPRequest(url="https://accounts.google.com/o/oauth2/token", method="POST",
            headers={"Content-Type": "application/x-www-form-urlencoded"}, body=http_body)
        http_response = self.http_client.fetch(http_request)

        # Extracting user information and tokens
        respjson = json.loads(http_response.body)
        if options.verbose: logging.info("GoogleOAuth2CallbackHandler.get:respjson=%s" % str(respjson))
        userinfo = self.decode_json_web_token(respjson["id_token"])

        # Lookup existing user record, or create one
        collection = open_collection("google_oauth_tokens")
        credentials = collection.find_one({ "whoami": userinfo["email"] })
        if credentials is None: credentials = { "whoami": userinfo["email"] }

        # Update database entry
        for k in respjson: credentials[k] = respjson[k]
        credentials["userinfo"] = userinfo
        collection.save(credentials)

        # Update cookies and send back to application
        self.set_secure_cookie("whoami", userinfo["email"], expires_days=None)
        self.redirect(final_redirect)

    # see for details: https://developers.google.com/accounts/docs/OAuth2ServiceAccount#jwtcontents
    def decode_json_web_token(self, id_token):
        segments = id_token.split(".")
        if (len(segments) != 3): raise HTTPError(400, message="Wrong number of segments in id_token:%s" % id_token)

        b64string = segments[1].encode("ascii")
        padded = b64string + "=" * (4 - len(b64string) % 4)
        padded = base64.urlsafe_b64decode(padded)

        if options.verbose: logging.info("GoogleOAuth2CallbackHandler.decode_json_web_token:id_token=%s" % (padded))
        return json.loads(padded)

# Allows applications to refresh access token
class GoogleOAuth2RefreshTokenHandler(tornado.web.RequestHandler):
    def initialize(self):
        self.http_client = HTTPClient()

    @OAuthenticated
    def get(self):
        self.refresh_token()
        self.set_status(200)

    def refresh_token(self):
        # retrieve credentials
        collection = open_collection("google_oauth_tokens")
        credentials = collection.find_one({ "whoami": self.get_secure_cookie("whoami") })
        if credentials is None:
            self.set_status(404, "No credentials found, unable to refresh OAUTH2 token")
            return

        # request fresh access_token
        param_str = "refresh_token=%s&client_id=%s&client_secret=%s&grant_type=refresh_token"
        http_body = param_str % (credentials["refresh_token"], options.client_id, options.client_secret)

        http_request = HTTPRequest(url="https://accounts.google.com/o/oauth2/token", method="POST",
            headers={"Content-Type": "application/x-www-form-urlencoded"}, body=http_body)
        http_response = self.http_client.fetch(http_request)
        respjson = json.loads(http_response.body)

        # store fresh access_token
        credentials["access_token"] = respjson["access_token"]
        collection.save(credentials)

# Logs out users
class GoogleSignoutHandler(tornado.web.RequestHandler):
    def get(self):
        self.clear_all_cookies()
        self.set_status(200)

# API Domains
GOOGLE_APIS = "https://www.googleapis.com"
GOOGLE_SPREADSHEET_APIS = "https://spreadsheets.google.com"

# Wraps calls to Google APIs with access tokens
class GoogleApisOAuthProxyHandler(GoogleOAuth2RefreshTokenHandler):
    def initialize(self, api_domain):
        self.http_client = HTTPClient()
        self.API_DOMAIN = api_domain.strip("/")

    def get(self, *uri_path):
        self.oauth_http("GET", "/".join(map(str,uri_path)))

    def post(self, *uri_path):
        self.oauth_http("POST", "/".join(map(str,uri_path)))

    def put(self, *uri_path):
        self.oauth_http("PUT", "/".join(map(str,uri_path)))

    @OAuthenticated
    def oauth_http(self, method, uri, RefreshToken=True):
        if options.verbose: logging.info("GoogleApisOAuthProxyHandler.oauth_http: %s %s/%s" % (method, self.API_DOMAIN, uri.strip("/")))

        credentials = open_collection("google_oauth_tokens").find_one({ "whoami": self.get_secure_cookie("whoami") })
        if not credentials: raise HTTPError(401, message="No OAUTH access_tokens, user must approve to access")

        try:
            headers = { "Authorization": ( "Bearer %s" % credentials["access_token"] ) }

            # Proxy requests to appropriate API
            if method == "GET":
                query_parameters = urllib.urlencode(self.request.arguments)
                url = "%s/%s?%s" % (self.API_DOMAIN, uri.strip("/"), query_parameters)
                http_request = HTTPRequest(url=url, method=method, headers=headers)
            else:
                url = "%s/%s" % (self.API_DOMAIN, uri.strip("/"))
                headers["Content-Type"] = self.request.headers["Content-Type"]
                if "If-Match" in self.request.headers: headers["If-Match"] = self.request.headers["If-Match"]
                http_request = HTTPRequest(url=url, method=method, headers=headers, body=self.request.body)

            # Process response
            http_resp = self.http_client.fetch(http_request)
            if options.verbose: logging.info("GoogleApisOAuthProxyHandler.oauth_http: %s %s/%s [%s]" % (method, self.API_DOMAIN, uri, http_resp.code))
            self.write(http_resp.body)
            self.set_status(http_resp.code)

        except HTTPError, e:
            if options.verbose: logging.error("GoogleApisOAuthProxyHandler.oauth_http: %s %s/%s [%s]" % (method, self.API_DOMAIN, uri, e.code))
            if e.code == 401 and RefreshToken:
                self.refresh_token()
                self.oauth_http(self, method, uri, False) # avoid getting into a loop, next time token should be fresh
                return

            if e.code == 599:
                if options.verbose: logging.error("GoogleApisOAuthProxyHandler.oauth_http: %s %s/%s [CODE=599]" % (method, self.API_DOMAIN, uri))
                self.set_status(500) # network connectivity issue, for some reason tornado.web chokes on 599
                return

            self.set_status(e.code)
