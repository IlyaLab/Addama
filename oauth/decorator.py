import functools
import tornado.web
from tornado.options import options

def CheckAuthorized(method):
    """Decorate methods with this to require that the user be logged in."""
    @functools.wraps(method)
    def wrapper(self, *args, **kwargs):
        if len(options.authorized_users) > 0:
            current_user = self.get_current_user()
            if not current_user.lower() in options.authorized_users: raise tornado.web.HTTPError(403)
        return method(self, *args, **kwargs)
    return wrapper
