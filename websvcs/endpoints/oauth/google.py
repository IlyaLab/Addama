from tornado.options import options
import tornado.web
import tornado.httpclient
import json
import urlparse

from oauth2client.client import OAuth2WebServerFlow, AccessTokenRefreshError
from oauth2client.file import Storage

class GoogleOAuth2Handler(tornado.web.RequestHandler):
    def get(self):
        if "oauth2_callback" in self.request.uri:
            redirect = "%s/svc/auth/signin/google/oauth2_callback" % (options.client_host)
            scope = "https://www.googleapis.com/auth/devstorage.read_write https://www.google.com/m8/feeds https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/compute https://www.googleapis.com/auth/plus.me https://www.googleapis.com/auth/urlshortener https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile"
            flow = OAuth2WebServerFlow(options.client_id, options.client_secret, scope, redirect_uri=redirect)

            parsed = urlparse.urlparse(self.request.uri)
            code = urlparse.parse_qs(parsed.query)["code"][0]
            credentials = flow.step2_exchange(code)

            cred_json = json.loads(credentials.to_json())
            user_email = cred_json["id_token"]["email"]
            access_token = cred_json["access_token"]
            storage = Storage('credentials-%s.dat' % (user_email))
            storage.put(credentials)

            http_client = tornado.httpclient.HTTPClient()
            response = http_client.fetch("https://www.googleapis.com/oauth2/v1/userinfo?access_token=%s"%(access_token))
            f = open('userinfo-%s.dat' % (user_email), 'w+')
            f.write(response.body)

            self.set_secure_cookie("whoami", user_email, expires_days=None)
            self.redirect(options.client_host)
        else:
            userkey = self.get_secure_cookie("whoami")
            storage = Storage('credentials-%s.dat' % (userkey))
            credentials = storage.get()

            if credentials is None or credentials.invalid:
                self.respond_redirect_to_auth_server()

    def respond_redirect_to_auth_server(self):
        redirect = "%s/svc/auth/signin/google/oauth2_callback" % (options.client_host)
        scope = "https://www.googleapis.com/auth/devstorage.read_write https://www.google.com/m8/feeds https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/compute https://www.googleapis.com/auth/plus.me https://www.googleapis.com/auth/urlshortener https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile"
        flow = OAuth2WebServerFlow(options.client_id, options.client_secret, scope, redirect_uri=redirect)

        self.set_status(301)
        self.set_header('Cache-Control', 'no-cache')
        self.set_header('Location', flow.step1_get_authorize_url())

class GoogleSignoutHandler(tornado.web.RequestHandler):
    def get(self):
        self.clear_all_cookies()
        self.set_status(200)

