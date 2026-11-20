from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase

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

    def test_restricted_account_is_still_blocked(self):
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
