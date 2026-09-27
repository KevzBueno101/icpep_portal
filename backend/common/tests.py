from io import StringIO
from unittest.mock import patch

from django.core.management import call_command
from django.test import SimpleTestCase, override_settings


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
