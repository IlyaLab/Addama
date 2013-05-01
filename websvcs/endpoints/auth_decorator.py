import functools
import tornado.web
from tornado.options import options

def authenticated(method):
    """Decorate methods with this to require that the user be logged in."""
    @functools.wraps(method)
    def wrapper(self, *args, **kwargs):
        if len(options.authorized_users) > 0:
            whoami = self.get_secure_cookie("whoami")
            if not whoami:
                raise tornado.web.HTTPError(403)

            if not whoami.lower() in options.authorized_users:
                raise tornado.web.HTTPError(403)
                    
        return method(self, *args, **kwargs)
    return wrapper

