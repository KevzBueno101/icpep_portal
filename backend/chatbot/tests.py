from unittest.mock import MagicMock, PropertyMock, patch

from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase

from chatbot.views import ChatAPIView

User = get_user_model()


class ChatPublicAccessTests(APITestCase):
    """The chatbot is available to landing-page visitors as well as members."""

    def test_anonymous_visitor_reaches_chat_validation(self):
        # An empty message is rejected by the serializer (400), not by auth (401).
        response = self.client.post('/api/chatbot/chat/', {
            'message': '',
            'session_id': 'public-session',
        }, format='json')
        self.assertEqual(response.status_code, 400)

    def test_anonymous_visitor_gets_a_chat_response(self):
        """
        A guest on the landing page gets a real answer, not a permission error.
        The Groq client is mocked so the test needs no API key/network.
        """
        mock_client = MagicMock()
        mock_client.generate_response.return_value = 'ICPEP.SE is for BS CpE students.'
        mock_client.count_tokens.return_value = 12

        with patch.object(
            ChatAPIView, 'groq_client', new_callable=PropertyMock
        ) as mock_client_property:
            mock_client_property.return_value = mock_client
            response = self.client.post('/api/chatbot/chat/', {
                'message': 'What is ICPEP?',
                'session_id': 'guest-success-session',
            }, format='json')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.data['response'], 'ICPEP.SE is for BS CpE students.'
        )
        self.assertEqual(response.data['session_id'], 'guest-success-session')
        mock_client.generate_response.assert_called_once()
        # The context passed to the LLM must include the organization system prompt.
        context = mock_client.generate_response.call_args.args[0]
        self.assertIn('ICPEP', context)

    def test_authenticated_restricted_account_is_still_blocked(self):
        user = User.objects.create_user(
            email='restricted@example.com',
            username='restricted',
            password='Password123',
            role='ADMIN',
            access_level='RESTRICTED',
        )
        self.client.force_authenticate(user)
        response = self.client.post('/api/chatbot/chat/', {
            'message': 'Hello',
            'session_id': 'restricted-session',
        }, format='json')
        self.assertEqual(response.status_code, 403)
        self.assertIn('restricted', str(response.data).lower())
