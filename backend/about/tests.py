import tempfile

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import override_settings
from rest_framework.test import APITestCase

from .models import AboutSection

User = get_user_model()


class AboutSectionAPITests(APITestCase):
    def _make_admin(self, **kwargs):
        fields = {
            'email': 'officer@example.com',
            'username': 'officer',
            'password': 'Password123',
            'role': 'ADMIN',
            'position': 'Vice President',
            'registration_status': 'APPROVED',
            'is_active': True,
        }
        fields.update(kwargs)
        return User.objects.create_user(**fields)

    def _create_section(self, **kwargs):
        fields = {
            'section_type': 'MISSION',
            'title': 'Our Mission',
            'body': 'To provide a platform for student computer engineers.',
            'is_published': True,
        }
        fields.update(kwargs)
        return AboutSection.objects.create(**fields)

    def _login(self, user):
        self.client.force_authenticate(user=user)

    def test_public_list_returns_only_published_sections_in_order(self):
        AboutSection.objects.all().delete()
        self._create_section(title='Second', display_order=1)
        self._create_section(title='First', display_order=0)
        self._create_section(title='Hidden', is_published=False)

        response = self.client.get('/api/about/')

        self.assertEqual(response.status_code, 200)
        titles = [item['title'] for item in response.data['results']]
        self.assertEqual(titles, ['First', 'Second'])
        self.assertNotIn('Hidden', titles)

    def test_public_list_requires_no_authentication(self):
        response = self.client.get('/api/about/')

        self.assertEqual(response.status_code, 200)

    def test_admin_list_requires_authentication(self):
        response = self.client.get('/api/about/admin/')

        self.assertEqual(response.status_code, 401)

    def test_admin_can_create_section(self):
        admin = self._make_admin()
        self._login(admin)

        response = self.client.post('/api/about/admin/', {
            'section_type': 'VISION',
            'title': 'Our Vision',
            'body': 'To be the premier student organization.',
            'is_published': True,
        }, format='json')

        self.assertEqual(response.status_code, 201)
        section = AboutSection.objects.get(id=response.data['id'])
        self.assertEqual(section.title, 'Our Vision')
        self.assertEqual(section.created_by, admin)

    def test_admin_can_update_and_delete_section(self):
        admin = self._make_admin()
        self._login(admin)
        section = self._create_section()

        patch = self.client.patch(f'/api/about/admin/{section.id}/', {
            'title': 'Our Updated Mission',
        }, format='json')
        self.assertEqual(patch.status_code, 200)
        section.refresh_from_db()
        self.assertEqual(section.title, 'Our Updated Mission')

        delete = self.client.delete(f'/api/about/admin/{section.id}/')
        self.assertEqual(delete.status_code, 204)
        self.assertFalse(AboutSection.objects.filter(id=section.id).exists())

    def test_reorder_updates_display_order(self):
        admin = self._make_admin()
        self._login(admin)
        first = self._create_section(title='First', display_order=0)
        second = self._create_section(title='Second', display_order=1)

        response = self.client.post('/api/about/admin/reorder/', {
            'ordered_ids': [second.id, first.id],
        }, format='json')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(AboutSection.objects.get(id=first.id).display_order, 1)
        self.assertEqual(AboutSection.objects.get(id=second.id).display_order, 0)

    def test_restricted_admin_cannot_create_section(self):
        admin = self._make_admin(access_level='RESTRICTED')
        self._login(admin)

        response = self.client.post('/api/about/admin/', {
            'section_type': 'CUSTOM',
            'title': 'Blocked',
            'body': 'Should not be created.',
        }, format='json')

        self.assertEqual(response.status_code, 403)
        self.assertFalse(AboutSection.objects.filter(title='Blocked').exists())

    def test_admin_can_upload_and_remove_document(self):
        admin = self._make_admin()
        self._login(admin)
        section = self._create_section()
        fake_pdf = SimpleUploadedFile('constitution.pdf', b'%PDF-1.4 test', content_type='application/pdf')

        with tempfile.TemporaryDirectory() as media_root, override_settings(
            STORAGES={
                **settings.STORAGES,
                'default': {'BACKEND': 'django.core.files.storage.FileSystemStorage'},
            },
            MEDIA_ROOT=media_root,
        ):
            upload = self.client.patch(
                f'/api/about/admin/{section.id}/',
                {
                    'section_type': 'CONSTITUTION',
                    'title': 'Constitution & By-Laws',
                    'body': 'Article 1.',
                    'document': fake_pdf,
                    'document_name': 'constitution.pdf',
                },
                format='multipart',
            )
            self.assertEqual(upload.status_code, 200)
            section.refresh_from_db()
            self.assertTrue(section.document)

            remove = self.client.delete(f'/api/about/admin/{section.id}/document/')
            self.assertEqual(remove.status_code, 204)
            section.refresh_from_db()
            self.assertFalse(section.document)
            self.assertEqual(section.document_name, '')
