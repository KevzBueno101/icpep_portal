from types import SimpleNamespace

from django.contrib.auth import get_user_model
from django.test import RequestFactory, SimpleTestCase, override_settings
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode
from rest_framework.test import APITestCase

from authentication.models import FailedLoginAttempt
from authentication.utils import build_password_reset_url

User = get_user_model()


class PasswordResetLinkTests(SimpleTestCase):
    @override_settings(FRONTEND_URL='https://portal.example.com/')
    def test_build_password_reset_url_normalizes_trailing_slash(self):
        user = SimpleNamespace(pk=42)
        expected_uid = urlsafe_base64_encode(force_bytes(user.pk))

        reset_url = build_password_reset_url(user, 'test-token')

        self.assertEqual(
            reset_url,
            f'https://portal.example.com/reset-password/{expected_uid}/test-token',
        )
        self.assertNotIn('//reset-password/', reset_url)

    @override_settings(FRONTEND_URL='')
    def test_build_password_reset_url_uses_request_origin_when_frontend_url_is_missing(self):
        request = RequestFactory().get('/api/auth/forgot-password/', HTTP_ORIGIN='https://portal.example.com')
        user = SimpleNamespace(pk=7)
        expected_uid = urlsafe_base64_encode(force_bytes(user.pk))

        reset_url = build_password_reset_url(user, 'fallback-token', request=request)

        self.assertEqual(
            reset_url,
            f'https://portal.example.com/reset-password/{expected_uid}/fallback-token',
        )

    @override_settings(FRONTEND_URL='')
    def test_build_password_reset_url_uses_local_fallback_when_frontend_url_is_missing(self):
        user = SimpleNamespace(pk=7)
        expected_uid = urlsafe_base64_encode(force_bytes(user.pk))

        reset_url = build_password_reset_url(user, 'fallback-token')

        self.assertEqual(
            reset_url,
            f'http://localhost:5173/reset-password/{expected_uid}/fallback-token',
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


class LoginRateLimitTests(APITestCase):
    def _make_admin(self, **kwargs):
        fields = {
            'email': 'president@example.com',
            'username': 'president',
            'password': 'Password123',
            'role': 'ADMIN',
            'position': 'President',
            'registration_status': 'APPROVED',
            'is_active': True,
        }
        fields.update(kwargs)
        return User.objects.create_user(**fields)

    def _make_member(self, **kwargs):
        fields = {
            'email': 'member@example.com',
            'username': 'member',
            'password': 'Password123',
            'role': 'OFFICER',
            'registration_status': 'APPROVED',
            'is_active': True,
        }
        fields.update(kwargs)
        return User.objects.create_user(**fields)

    def test_failed_admin_login_records_attempt(self):
        self._make_admin()
        for _ in range(3):
            self.client.post('/api/auth/admin-login/', {
                'email': 'president@example.com',
                'password': 'WrongPass123',
            }, format='json')

        self.assertEqual(
            FailedLoginAttempt.objects.filter(email__iexact='president@example.com').count(),
            3,
        )

    def test_successful_admin_login_clears_failure_counter(self):
        self._make_admin()
        for _ in range(3):
            self.client.post('/api/auth/admin-login/', {
                'email': 'president@example.com',
                'password': 'WrongPass123',
            }, format='json')
        self.assertEqual(
            FailedLoginAttempt.objects.filter(email__iexact='president@example.com').count(),
            3,
        )

        response = self.client.post('/api/auth/admin-login/', {
            'email': 'president@example.com',
            'password': 'Password123',
        }, format='json')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            FailedLoginAttempt.objects.filter(email__iexact='president@example.com').count(),
            0,
        )

    def test_successful_logins_do_not_consume_the_ip_budget(self):
        self._make_admin()
        for _ in range(6):
            response = self.client.post('/api/auth/admin-login/', {
                'email': 'president@example.com',
                'password': 'Password123',
            }, format='json')
            self.assertEqual(response.status_code, 200)

    def test_ten_failed_admin_logins_do_not_block_the_eleventh(self):
        self._make_admin()
        for _ in range(10):
            self.client.post('/api/auth/admin-login/', {
                'email': 'president@example.com',
                'password': 'WrongPass123',
            }, format='json')

        response = self.client.post('/api/auth/admin-login/', {
            'email': 'president@example.com',
            'password': 'Password123',
        }, format='json')

        self.assertEqual(response.status_code, 200)

    def test_eleven_failed_admin_logins_block_the_twelfth_even_with_right_password(self):
        self._make_admin()
        for _ in range(11):
            self.client.post('/api/auth/admin-login/', {
                'email': 'president@example.com',
                'password': 'WrongPass123',
            }, format='json')

        response = self.client.post('/api/auth/admin-login/', {
            'email': 'president@example.com',
            'password': 'Password123',
        }, format='json')

        self.assertEqual(response.status_code, 429)
        self.assertIn('15 minutes', str(response.data.get('detail', '')))

    def test_ten_failed_member_logins_do_not_block_the_eleventh(self):
        self._make_member()
        for _ in range(10):
            self.client.post('/api/auth/login/', {
                'email': 'member@example.com',
                'password': 'WrongPass123',
            }, format='json')

        response = self.client.post('/api/auth/login/', {
            'email': 'member@example.com',
            'password': 'Password123',
        }, format='json')

        self.assertEqual(response.status_code, 200)

    def test_failed_member_login_records_and_successful_login_clears(self):
        self._make_member()
        for _ in range(2):
            self.client.post('/api/auth/login/', {
                'email': 'member@example.com',
                'password': 'WrongPass123',
            }, format='json')
        self.assertEqual(
            FailedLoginAttempt.objects.filter(email__iexact='member@example.com').count(),
            2,
        )

        response = self.client.post('/api/auth/login/', {
            'email': 'member@example.com',
            'password': 'Password123',
        }, format='json')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            FailedLoginAttempt.objects.filter(email__iexact='member@example.com').count(),
            0,
        )
