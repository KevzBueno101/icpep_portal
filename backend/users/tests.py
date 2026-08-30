from io import BytesIO

from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase
from PIL import Image
from rest_framework import status
from rest_framework.test import APIClient

User = get_user_model()


def _make_png(name='profile.png'):
    """Return an in-memory 1x1 PNG upload."""
    buf = BytesIO()
    Image.new('RGB', (8, 8), (100, 149, 237)).save(buf, format='PNG')
    return SimpleUploadedFile(name, buf.getvalue(), content_type='image/png')


class AdminProfileAPITests(TestCase):

    def setUp(self):
        self.user = User.objects.create_user(
            email='officer@example.com',
            username='officer1',
            password='old-pass-123',
            first_name='Jane',
            last_name='Doe',
            role='ADMIN',
            position='Secretary',
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def _patch(self, data, as_format='multipart'):
        return self.client.patch('/api/users/admin/profile/', data, format=as_format)

    def test_profile_picture_upload_saves_file(self):
        resp = self._patch({'profile_picture': _make_png()})
        self.assertEqual(resp.status_code, status.HTTP_200_OK, resp.data)
        self.user.refresh_from_db()
        self.assertTrue(self.user.profile_picture.name)
        self.assertTrue(self.user.profile_picture.storage.exists(self.user.profile_picture.name))

    def test_profile_picture_preserved_on_text_only_update(self):
        self.user.profile_picture = _make_png()
        self.user.save()
        original_name = self.user.profile_picture.name

        resp = self._patch({'first_name': 'Joan'})
        self.assertEqual(resp.status_code, status.HTTP_200_OK, resp.data)
        self.user.refresh_from_db()
        self.assertEqual(self.user.profile_picture.name, original_name)
        self.assertEqual(self.user.first_name, 'Joan')

    def test_password_change_requires_valid_current_password(self):
        resp = self._patch({
            'current_password': 'wrong-pass',
            'new_password': 'new-pass-456',
            'confirm_password': 'new-pass-456',
        })
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password('old-pass-123'))

    def test_password_change_updates_password(self):
        resp = self._patch({
            'current_password': 'old-pass-123',
            'new_password': 'new-pass-456',
            'confirm_password': 'new-pass-456',
        })
        self.assertEqual(resp.status_code, status.HTTP_200_OK, resp.data)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password('new-pass-456'))

    def test_password_mismatch_rejected(self):
        resp = self._patch({
            'current_password': 'old-pass-123',
            'new_password': 'new-pass-456',
            'confirm_password': 'different-789',
        })
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_president_can_update_role_and_position(self):
        self.user.position = 'President'
        self.user.save()

        resp = self._patch({
            'position': 'Vice President',
            'role': 'ADMIN',
        })
        self.assertEqual(resp.status_code, status.HTTP_200_OK, resp.data)
        self.user.refresh_from_db()
        self.assertEqual(self.user.position, 'Vice President')

    def test_non_president_cannot_update_role_or_position(self):
        resp = self._patch({'position': 'Treasurer'})
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.user.refresh_from_db()
        self.assertEqual(self.user.position, 'Secretary')

        resp = self._patch({'role': 'OFFICER'})
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
