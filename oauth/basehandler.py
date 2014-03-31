import logging

from pretty_json import PrettyJsonRequestHandler

import tornado.web
from tornado.options import options

class AuthenticatedRequestHandler(PrettyJsonRequestHandler):
    def get_current_user(self):
        authenticated = self.opt_current_user()
        if authenticated is None: raise tornado.web.HTTPError(401)
        return authenticated

    def opt_current_user(self):
        cookie_id = options.cookie_id
        authenticated = self.get_secure_cookie(cookie_id)
        if options.verbose: logging.info("get_current_user():%s:[%s]" % (authenticated, cookie_id))
        return authenticated
