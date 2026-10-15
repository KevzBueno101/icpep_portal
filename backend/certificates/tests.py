import io
import json
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from PIL import Image, ImageDraw
from rest_framework.test import APITestCase

from members.models import MemberProfile

from . import serializers as certificate_serializers
from .imaging import strip_light_background
from .models import Certificate, CertificateDesign
from .pdf import build_certificate_pdf

User = get_user_model()


def _png_bytes(image):
    buffer = io.BytesIO()
    image.save(buffer, format='PNG')
    return buffer.getvalue()


def _white_with_ink(size=(10, 10), box=(2, 2, 8, 8), ink=(20, 20, 20, 255)):
    image = Image.new('RGBA', size, (255, 255, 255, 255))
    ImageDraw.Draw(image).rectangle(box, fill=ink)
    return image


# Minimal valid 1x1 PNG used for upload validation tests.
PNG_1x1 = (
    b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01'
    b'\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\nIDATx\x9cc\x00\x01'
    b'\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82'
)


def _make_user(email, **kwargs):
    defaults = {
        'username': email.split('@')[0],
        'password': 'Password123',
        'role': 'MEMBER',
        'position': '',
    }
    defaults.update(kwargs)
    return User.objects.create_user(email=email, **defaults)


def _make_profile(user, student_number, status='APPROVED'):
    return MemberProfile.objects.create(
        user=user,
        first_name='Test',
        last_name='Member',
        student_number=student_number,
        course='BSCS',
        year_level='1',
        section='A',
        contact_number='09170000000',
        membership_status=status,
    )


class CertificateAPITests(APITestCase):
    def setUp(self):
        self.admin = _make_user('admin@example.com', role='ADMIN', position='PRESIDENT')
        self.restricted = _make_user(
            'restricted@example.com', role='ADMIN', access_level='RESTRICTED'
        )
        self.member_user = _make_user('member@example.com')
        self.member = _make_profile(self.member_user, '2023-0001')
        self.other_user = _make_user('other@example.com')
        self.other = _make_profile(self.other_user, '2023-0002')
        self.design = CertificateDesign.objects.create(
            name='Participation', title='Certificate of Participation',
            message='For your participation.',
            signatories=[{'name': 'Jane Doe', 'position': 'President', 'signature_url': ''}],
        )
        self.event = {'event_name': 'Tech Summit', 'event_date': '2026-01-15'}

    def _issue(self, member_ids=None, user=None):
        self.client.force_authenticate(user or self.admin)
        payload = {
            'design': self.design.id,
            'event_name': self.event['event_name'],
            'event_date': self.event['event_date'],
            'member_ids': member_ids if member_ids is not None else [self.member.id],
        }
        return self.client.post('/api/certificates/issue/', payload, format='json')

    def test_issue_creates_certificate(self):
        res = self._issue()
        self.assertEqual(res.status_code, 201, res.data)
        self.assertEqual(res.data['issued'], 1)
        self.assertEqual(Certificate.objects.count(), 1)
        cert = Certificate.objects.first()
        self.assertEqual(cert.status, 'ISSUED')
        self.assertTrue(cert.verification_code.startswith('ICPEP-'))

    def test_issue_skips_duplicate_for_same_event(self):
        self._issue()
        res = self._issue()
        self.assertEqual(res.status_code, 201, res.data)
        self.assertEqual(res.data['issued'], 0)
        self.assertEqual(len(res.data['skipped']), 1)
        self.assertEqual(Certificate.objects.count(), 1)

    def test_issue_skips_invalid_and_unapproved_members(self):
        pending_user = _make_user('pending@example.com')
        pending = _make_profile(pending_user, '2023-0003', status='PENDING')
        res = self._issue(member_ids=[self.member.id, pending.id, 999999])
        self.assertEqual(res.status_code, 201, res.data)
        self.assertEqual(res.data['issued'], 1)
        self.assertEqual(len(res.data['skipped']), 2)

    def test_restricted_admin_cannot_issue(self):
        res = self._issue(user=self.restricted)
        self.assertEqual(res.status_code, 403)

    def test_member_cannot_access_candidates(self):
        self.client.force_authenticate(self.member_user)
        res = self.client.get('/api/certificates/candidates/')
        self.assertEqual(res.status_code, 403)

    def test_candidates_flagged_as_already_issued(self):
        self._issue()
        self.client.force_authenticate(self.admin)
        res = self.client.get('/api/certificates/candidates/', {
            'event_name': self.event['event_name'],
            'event_date': self.event['event_date'],
        })
        self.assertEqual(res.status_code, 200)
        results = res.data['results']
        issued = [row for row in results if row['id'] == self.member.id][0]
        self.assertTrue(issued['already_issued'])
        self.assertIsNotNone(issued['certificate_id'])

    def test_candidate_ids_excludes_already_issued(self):
        self._issue()
        self.client.force_authenticate(self.admin)
        res = self.client.get('/api/certificates/candidates/ids/', {
            'event_name': self.event['event_name'],
            'event_date': self.event['event_date'],
        })
        self.assertEqual(res.status_code, 200)
        ids = [row['id'] for row in res.data['members']]
        self.assertNotIn(self.member.id, ids)
        self.assertIn(self.other.id, ids)

    def test_member_only_sees_own_certificates(self):
        self._issue(member_ids=[self.member.id, self.other.id])
        self.client.force_authenticate(self.member_user)
        res = self.client.get('/api/certificates/mine/')
        self.assertEqual(res.status_code, 200)
        results = res.data['results']
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['member'], self.member.id)

    def test_mark_seen_clears_new_flag(self):
        self._issue()
        cert = Certificate.objects.first()
        self.assertTrue(cert.seen_at is None)
        self.client.force_authenticate(self.member_user)
        res = self.client.post('/api/certificates/mine/mark-seen/')
        self.assertEqual(res.status_code, 200)
        cert.refresh_from_db()
        self.assertIsNotNone(cert.seen_at)

    def test_download_returns_pdf_for_owner(self):
        self._issue()
        cert = Certificate.objects.first()
        self.client.force_authenticate(self.member_user)
        res = self.client.get(f'/api/certificates/{cert.id}/download/')
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res['Content-Type'], 'application/pdf')
        self.assertTrue(res.content.startswith(b'%PDF'))

    def test_download_blocked_for_other_member(self):
        self._issue()
        cert = Certificate.objects.first()
        self.client.force_authenticate(self.other_user)
        res = self.client.get(f'/api/certificates/{cert.id}/download/')
        self.assertEqual(res.status_code, 403)

    def test_verify_public_success_and_revoked(self):
        self._issue()
        cert = Certificate.objects.first()
        self.client.force_authenticate(user=None)
        res = self.client.get('/api/certificates/verify/', {'code': cert.verification_code})
        self.assertEqual(res.status_code, 200)
        self.assertTrue(res.data['valid'])
        self.assertEqual(res.data['event_name'], 'Tech Summit')

        cert.status = 'REVOKED'
        cert.save(update_fields=['status'])
        res = self.client.get('/api/certificates/verify/', {'code': cert.verification_code})
        self.assertFalse(res.data['valid'])

    def test_revoke_hides_from_member(self):
        self._issue()
        cert = Certificate.objects.first()
        self.client.force_authenticate(self.admin)
        res = self.client.post(f'/api/certificates/{cert.id}/revoke/')
        self.assertEqual(res.status_code, 200)
        cert.refresh_from_db()
        self.assertEqual(cert.status, 'REVOKED')

        self.client.force_authenticate(self.member_user)
        res = self.client.get('/api/certificates/mine/')
        self.assertEqual(len(res.data['results']), 0)

    def test_snapshot_is_frozen(self):
        self._issue()
        cert = Certificate.objects.first()
        self.design.title = 'Changed Title'
        self.design.save()
        cert.refresh_from_db()
        self.assertEqual(cert.design_snapshot['title'], 'Certificate of Participation')

    def test_design_delete_archives_when_used(self):
        self._issue()
        self.client.force_authenticate(self.admin)
        res = self.client.delete(f'/api/certificates/designs/{self.design.id}/')
        self.assertEqual(res.status_code, 204)
        self.design.refresh_from_db()
        self.assertTrue(self.design.is_archived)

    def test_design_text_align_persists_and_snapshots(self):
        self.client.force_authenticate(self.admin)
        res = self.client.post('/api/certificates/designs/', {
            'name': 'Aligned', 'title': 'Certificate', 'text_align': 'LEFT',
        }, format='json')
        self.assertEqual(res.status_code, 201, res.data)
        self.assertEqual(res.data['text_align'], 'LEFT')
        design = CertificateDesign.objects.get(id=res.data['id'])
        self.assertEqual(design.snapshot()['text_align'], 'LEFT')

    def test_pdf_renders_for_each_alignment(self):
        self._issue()
        cert = Certificate.objects.first()
        for align in ('LEFT', 'CENTER', 'RIGHT', 'garbage'):
            cert.design_snapshot = {**cert.design_snapshot, 'text_align': align}
            self.assertTrue(build_certificate_pdf(cert).startswith(b'%PDF'))

    def test_design_header_defaults_and_snapshot(self):
        design = CertificateDesign.objects.create(name='Headed', title='Certificate')
        snap = design.snapshot()
        self.assertEqual(snap['header_school'], 'Catanduanes State University')
        self.assertEqual(snap['header_college'], 'College of Engineering and Architecture')
        self.assertIn('CatSU Chapter', snap['header_organization'])

    def test_signatories_persist_and_snapshot(self):
        self.client.force_authenticate(self.admin)
        payload = [
            {'name': 'Jane Doe', 'position': 'President', 'signature_url': ''},
            {'name': 'John Cruz', 'position': 'Secretary', 'signature_url': ''},
        ]
        res = self.client.post('/api/certificates/designs/', {
            'name': 'Two signers', 'title': 'Certificate', 'signatories': json.dumps(payload),
        }, format='multipart')
        self.assertEqual(res.status_code, 201, res.data)
        design = CertificateDesign.objects.get(id=res.data['id'])
        self.assertEqual(len(design.signatories), 2)
        self.assertEqual(design.snapshot()['signatories'][1]['name'], 'John Cruz')

    def test_custom_clause_text_persists_and_snapshots(self):
        self.client.force_authenticate(self.admin)
        res = self.client.post('/api/certificates/designs/', {
            'name': 'Custom clause', 'title': 'Certificate',
            'presented_to_text': 'Awarded to',
            'for_text': 'for outstanding performance in',
        }, format='json')
        self.assertEqual(res.status_code, 201, res.data)
        design = CertificateDesign.objects.get(id=res.data['id'])
        snap = design.snapshot()
        self.assertEqual(snap['presented_to_text'], 'Awarded to')
        self.assertEqual(snap['for_text'], 'for outstanding performance in')

    def test_clause_defaults_and_pdf_renders_with_long_wrapped_text(self):
        design = CertificateDesign.objects.create(name='Defaults', title='Certificate')
        snap = design.snapshot()
        self.assertEqual(snap['presented_to_text'], 'This certificate is proudly presented to')
        self.assertEqual(snap['for_text'], 'for participating in')

        self._issue()
        cert = Certificate.objects.first()
        cert.design_snapshot = {
            **cert.design_snapshot,
            'presented_to_text': 'This certificate is proudly presented to ' * 3,
            'for_text': 'for participating in the annual convention and leadership summit ' * 3,
        }
        self.assertTrue(build_certificate_pdf(cert).startswith(b'%PDF'))

    def test_signatory_signature_upload_is_stored(self):
        self.client.force_authenticate(self.admin)
        img = SimpleUploadedFile('sig.png', PNG_1x1, content_type='image/png')
        res = self.client.post('/api/certificates/designs/', {
            'name': 'Sig upload', 'title': 'Certificate',
            'signatories': json.dumps([{'name': 'Jane Doe', 'position': 'President', 'signature_url': ''}]),
            'signature_0': img,
        }, format='multipart')
        self.assertEqual(res.status_code, 201, res.data)
        design = CertificateDesign.objects.get(id=res.data['id'])
        self.assertTrue(design.signatories[0]['signature_url'])

    def test_signature_upload_runs_background_strip(self):
        self.client.force_authenticate(self.admin)
        upload = SimpleUploadedFile(
            'sig.png', _png_bytes(_white_with_ink()), content_type='image/png'
        )
        with patch.object(
            certificate_serializers,
            'strip_light_background',
            wraps=certificate_serializers.strip_light_background,
        ) as spy:
            res = self.client.post('/api/certificates/designs/', {
                'name': 'Clean sig', 'title': 'Certificate',
                'signatories': json.dumps([{'name': 'Jane Doe', 'position': 'President', 'signature_url': ''}]),
                'signature_0': upload,
            }, format='multipart')
        self.assertEqual(res.status_code, 201, res.data)
        self.assertTrue(spy.called)
        self.assertTrue(spy.call_args.args[0])
        design = CertificateDesign.objects.get(id=res.data['id'])
        self.assertTrue(design.signatories[0]['signature_url'])

    def test_strip_light_background_removes_white(self):
        cleaned = strip_light_background(_png_bytes(_white_with_ink()))
        self.assertIsNotNone(cleaned)
        result = Image.open(io.BytesIO(cleaned)).convert('RGBA')
        self.assertEqual(result.getpixel((0, 0))[3], 0)
        center = result.getpixel((result.width // 2, result.height // 2))
        self.assertGreater(center[3], 200)

    def test_strip_light_background_skips_transparent_input(self):
        image = Image.new('RGBA', (10, 10), (255, 255, 255, 0))
        self.assertIsNone(strip_light_background(_png_bytes(image)))

    def test_strip_light_background_aborts_when_all_removed(self):
        image = Image.new('RGBA', (10, 10), (255, 255, 255, 255))
        self.assertIsNone(strip_light_background(_png_bytes(image)))

    def test_pdf_renders_with_multiple_signatories(self):
        self.design.signatories = [
            {'name': 'A', 'position': 'President', 'signature_url': ''},
            {'name': 'B', 'position': 'Vice', 'signature_url': ''},
            {'name': 'C', 'position': 'Secretary', 'signature_url': ''},
        ]
        self.design.save()
        self._issue()
        cert = Certificate.objects.first()
        self.assertTrue(build_certificate_pdf(cert).startswith(b'%PDF'))

    def test_pdf_renders_two_signatory_rows_with_long_content(self):
        self.design.signatories = [
            {'name': f'Name {i}', 'position': f'Position {i}', 'signature_url': ''}
            for i in range(1, 6)
        ]
        self.design.message = 'Presented for outstanding participation ' * 6
        self.design.save()
        self._issue()
        cert = Certificate.objects.first()
        self.assertTrue(build_certificate_pdf(cert).startswith(b'%PDF'))
