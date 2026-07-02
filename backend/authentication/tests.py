from types import SimpleNamespace

from django.contrib.auth import get_user_model
from django.test import RequestFactory, SimpleTestCase, override_settings
from rest_framework.test import APITestCase

from authentication.utils import build_password_reset_url

User = get_user_model()


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


class AdminRegistrationTests(APITestCase):
    def test_admin_registration_creates_pending_account(self):
        response = self.client.post('/api/auth/admin-register/', {
            'email': 'new-admin@example.com',
            'username': 'newadmin',
            'password': 'Password123',
            'confirm_password': 'Password123',
            'first_name': 'New',
            'last_name': 'Admin',
            'position': 'Treasurer',
            'department': 'Finance',
            'academic_year': '2025-2026',
            'admin_note': 'Needs approval',
        }, format='json')

        self.assertEqual(response.status_code, 201)
        self.assertTrue(User.objects.filter(email='new-admin@example.com').exists())
        user = User.objects.get(email='new-admin@example.com')
        self.assertEqual(user.registration_status, 'PENDING')
        self.assertFalse(user.is_active)
        self.assertEqual(user.requested_position, 'Treasurer')

    def test_pending_admin_login_is_rejected(self):
        user = User.objects.create_user(
            email='pending@example.com',
            username='pendingadmin',
            password='Password123',
            role='ADMIN',
            registration_status='PENDING',
            is_active=False,
        )

        response = self.client.post('/api/auth/admin-login/', {
            'email': user.email,
            'password': 'Password123',
        }, format='json')

        self.assertEqual(response.status_code, 401)
        self.assertIn('pending approval', str(response.data).lower())
