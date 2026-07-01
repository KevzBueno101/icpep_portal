from types import SimpleNamespace

from django.test import RequestFactory, SimpleTestCase, override_settings

from authentication.utils import build_password_reset_url


class PasswordResetLinkTests(SimpleTestCase):
    @override_settings(FRONTEND_URL='https://portal.example.com/')
    def test_build_password_reset_url_normalizes_trailing_slash(self):
        user = SimpleNamespace(pk=42)

        reset_url = build_password_reset_url(user, 'test-token')

        self.assertEqual(
            reset_url,
            'https://portal.example.com/reset-password/42/test-token',
        )
        self.assertNotIn('//reset-password/', reset_url)

    @override_settings(FRONTEND_URL='')
    def test_build_password_reset_url_uses_request_origin_when_frontend_url_is_missing(self):
        request = RequestFactory().get('/api/auth/forgot-password/', HTTP_ORIGIN='https://portal.example.com')
        user = SimpleNamespace(pk=7)

        reset_url = build_password_reset_url(user, 'fallback-token', request=request)

        self.assertEqual(
            reset_url,
            'https://portal.example.com/reset-password/7/fallback-token',
        )

    @override_settings(FRONTEND_URL='')
    def test_build_password_reset_url_uses_local_fallback_when_frontend_url_is_missing(self):
        user = SimpleNamespace(pk=7)

        reset_url = build_password_reset_url(user, 'fallback-token')

        self.assertEqual(
            reset_url,
            'http://localhost:5173/reset-password/7/fallback-token',
        )
