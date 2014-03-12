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
from storage.collections import open_collection

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

class GoogleDriveApiHandler(tornado.web.RequestHandler):
    def get(self, *uri_path):
        if options.verbose: logging.info("driveAPI.get:%s [%s]" % (self.request.path, str(uri_path)))

        response = self.oauth_http("GET", "/".join(map(str,uri_path)))
        self.write(response.body)
        self.set_status(response.code)

    def post(self, *uri_path):
        if options.verbose: logging.info("driveAPI.post:%s" % self.request.path)

        response = self.oauth_http("POST", "/".join(map(str,uri_path)))

        if self.request.path.endswith("/files"):
            fileinfo = json.loads(response.body)
            owner = self.get_secure_cookie("whoami")
            insert_id = open_collection("datasheets").insert({ "owner": owner, "fileInfo": json.loads(response.body) })
            self.write({ "id": str(insert_id) })
        else:
            self.write(response.body)

        self.set_status(response.code)

    @OAuthenticated
    def oauth_http(self, method, uri):
        if options.verbose: logging.info("driveAPI: %s https://www.googleapis.com/%s" % (method, uri.strip("/")))

        userkey = self.get_secure_cookie("whoami")
        credentials = GetUserinfo(userkey)
        headers = { "Authorization": ( "Bearer %s" % credentials["access_token"] ) }

        if method == "GET":
            query_parameters = urllib.urlencode(self.request.arguments)
            url = "https://www.googleapis.com/%s?%s" % (uri.strip("/"), query_parameters)
            http_request = tornado.httpclient.HTTPRequest(url=url, method=method, headers=headers)
        else:
            url = "https://www.googleapis.com/%s" % uri.strip("/")
            headers["Content-Type"] = self.request.headers["Content-Type"]
            http_request = tornado.httpclient.HTTPRequest(url=url, method=method, headers=headers, body=self.request.body)

        http_client = tornado.httpclient.HTTPClient()
        http_resp = http_client.fetch(http_request)

        if options.verbose: logging.info("driveAPI: %s https://www.googleapis.com/%s [%s]" % (method, uri, http_resp.code))
        return http_resp
