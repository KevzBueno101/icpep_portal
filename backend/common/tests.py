from io import StringIO
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.core.management import call_command
from django.test import SimpleTestCase, override_settings
from rest_framework.test import APITestCase

from common.throttles import PublicStatsAnonThrottle
from members.models import MemberProfile

User = get_user_model()


class CheckBrevoCommandTests(SimpleTestCase):
    @override_settings(BREVO_API_KEY='', DEFAULT_FROM_EMAIL='')
    def test_warns_when_api_key_missing(self):
        out, err = StringIO(), StringIO()
        call_command('check_brevo', stdout=out, stderr=err)
        self.assertIn('BREVO_API_KEY is not set', err.getvalue())
        self.assertNotIn('Sending a real test', out.getvalue())

    @override_settings(BREVO_API_KEY='xkeysib-test-key', DEFAULT_FROM_EMAIL='noreply@icpepcatsu.app')
    @patch('common.management.commands.check_brevo.requests.get')
    def test_reports_success_on_200(self, mock_get):
        mock_get.return_value.status_code = 200
        mock_get.return_value.json.return_value = {'firstName': 'Test', 'emailCredits': 300}

        out, err = StringIO(), StringIO()
        call_command('check_brevo', stdout=out, stderr=err)

        self.assertNotIn('ERROR', err.getvalue())
        self.assertIn('OK', out.getvalue())

    @override_settings(BREVO_API_KEY='xkeysib-test-key', DEFAULT_FROM_EMAIL='noreply@icpepcatsu.app')
    @patch('common.management.commands.check_brevo.requests.get')
    def test_reports_key_not_found_on_401(self, mock_get):
        mock_get.return_value.status_code = 401
        mock_get.return_value.text = '{"message":"Key not found","code":"unauthorized"}'

        out, err = StringIO(), StringIO()
        call_command('check_brevo', stdout=out, stderr=err)

        self.assertIn('Brevo rejected the key', err.getvalue())
        self.assertIn('different Brevo account', err.getvalue())

    @override_settings(BREVO_API_KEY='xkeysib-test-key', DEFAULT_FROM_EMAIL='noreply@icpepcatsu.app')
    @patch('common.management.commands.check_brevo.requests.get')
    def test_reports_ip_whitelist_cause_on_401(self, mock_get):
        mock_get.return_value.status_code = 401
        mock_get.return_value.text = '{"message":"unrecognised IP address","code":"unauthorized"}'

        out, err = StringIO(), StringIO()
        call_command('check_brevo', stdout=out, stderr=err)

        self.assertIn('Authorised IPs is enabled', err.getvalue())
        self.assertIn('authorised_ips', err.getvalue())


class PublicStatsTests(APITestCase):
    url = '/api/public/stats/'

    def setUp(self):
        cache.clear()

    def _user(self, email, **kwargs):
        defaults = {
            'username': email.split('@')[0],
            'password': 'Password123',
            'role': 'MEMBER',
        }
        defaults.update(kwargs)
        return User.objects.create_user(email=email, **defaults)

    def _profile(self, user, status=MemberProfile.Status.APPROVED):
        return MemberProfile.objects.create(
            user=user,
            first_name='Test',
            last_name='User',
            student_number=f'SN{user.pk}',
            course='BSCS',
            year_level='1',
            section='A',
            contact_number='09170000000',
            membership_status=status,
        )

    def test_unauthenticated_returns_aggregate_counts(self):
        self._profile(self._user('m1@example.com'))
        self._profile(self._user('m2@example.com'), MemberProfile.Status.PENDING)
        self._profile(self._user('m3@example.com'), MemberProfile.Status.EXPIRED)
        self._user('officer@example.com', role='OFFICER')
        self._user('admin@example.com', role='ADMIN')

        res = self.client.get(self.url)

        self.assertEqual(res.status_code, 200)
        self.assertEqual(set(res.data.keys()), {'members', 'officers'})
        self.assertEqual(res.data['members'], 3)
        self.assertEqual(res.data['officers'], 2)
        self.assertIsInstance(res.data['members'], int)
        self.assertIsInstance(res.data['officers'], int)

    def test_officers_excludes_superuser_inactive_and_plain_users(self):
        self._user('super@example.com', role='ADMIN', is_superuser=True, is_staff=True)
        self._user('inactive@example.com', role='OFFICER', is_active=False)
        self._user('member@example.com', role='MEMBER')
        self._user('officer@example.com', role='OFFICER')

        res = self.client.get(self.url)

        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data['officers'], 1)

    def test_response_contains_no_pii(self):
        user = self._user('pii@example.com', first_name='Juan', last_name='Dela Cruz')
        self._profile(user)

        res = self.client.get(self.url)

        self.assertEqual(res.status_code, 200)
        self.assertEqual(set(res.data.keys()), {'members', 'officers'})
        body = str(res.data)
        for leaked in ('pii@example.com', 'Juan', 'Dela Cruz', 'SN', 'username'):
            self.assertNotIn(leaked, body)

    def test_write_methods_return_405(self):
        for method in ('post', 'put', 'patch', 'delete'):
            with self.subTest(method=method):
                res = getattr(self.client, method)(self.url, {}, format='json')
                self.assertEqual(res.status_code, 405)

    # SimpleRateThrottle.THROTTLE_RATES is bound at class-definition time,
    # so override_settings(REST_FRAMEWORK=...) has no effect — patch it directly.
    @patch.object(PublicStatsAnonThrottle, 'THROTTLE_RATES', {'public_stats': '3/minute'})
    def test_throttle_after_limit(self):
        for _ in range(3):
            res = self.client.get(self.url)
            self.assertEqual(res.status_code, 200)

        res = self.client.get(self.url)
        self.assertEqual(res.status_code, 429)
