from django.contrib.auth.backends import ModelBackend

from .utils import find_user_by_login


class EmailBackend(ModelBackend):
    def authenticate(self, request, username=None, password=None, **kwargs):
        identifier = kwargs.get('email') or username
        if identifier is None or password is None:
            return None

        user = find_user_by_login(identifier)
        if user is None:
            return None

        if user.check_password(password) and self.user_can_authenticate(user):
            return user
        return None
