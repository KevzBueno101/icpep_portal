from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase

from members.models import MemberProfile

from .models import Certificate, CertificateDesign

User = get_user_model()


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
            message='For your participation.', signatory_name='Jane Doe',
            signatory_position='President',
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
