from unittest.mock import patch

from django.contrib.auth import get_user_model

from rest_framework.test import APITestCase

from members.models import MemberProfile
from .models import AuditLog

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


class MemberApprovalLogTests(APITestCase):
    def setUp(self):
        self.admin = _make_user('approver@example.com', role='ADMIN', position='PRESIDENT')
        self.admin.first_name = 'Maria'
        self.admin.last_name = 'Santos'
        self.admin.save(update_fields=['first_name', 'last_name'])
        self.client.force_authenticate(self.admin)

    def _profile(self, user, status=MemberProfile.Status.PENDING):
        return MemberProfile.objects.create(
            user=user,
            first_name='Test',
            last_name='User',
            student_number=user.email.split('@')[0] + 'SN',
            course='BSCS',
            year_level='1',
            section='A',
            contact_number='09170000000',
            membership_status=status,
        )

    @patch('members.views.generate_receipt_png', return_value=b'')
    @patch('members.views.notify_member_approved')
    def test_approve_log_includes_approver(self, mock_notify, mock_receipt):
        member = _make_user('member@example.com')
        profile = self._profile(member)

        res = self.client.post(
            f'/api/members/{profile.pk}/approve/',
            {'membership_status': 'APPROVED'},
            format='json',
        )
        self.assertEqual(res.status_code, 200)

        log = AuditLog.objects.get(action_type=AuditLog.ActionType.MEMBER_APPROVED)
        self.assertEqual(log.admin_user, self.admin)
        self.assertEqual(log.details['old_status'], 'PENDING')
        self.assertEqual(log.details['new_status'], 'APPROVED')
        self.assertEqual(log.details['approved_by'], self.admin.first_name + ' ' + self.admin.last_name)
        self.assertEqual(log.details['approved_by_position'], 'PRESIDENT')

    @patch('members.views.generate_receipt_png', return_value=b'')
    @patch('members.views.notify_member_approved')
    def test_reject_log_or_no_approver_details(self, mock_notify, mock_receipt):
        member = _make_user('member2@example.com')
        profile = self._profile(member)

        res = self.client.post(
            f'/api/members/{profile.pk}/approve/',
            {'membership_status': 'REJECTED'},
            format='json',
        )
        self.assertEqual(res.status_code, 200)

        self.assertFalse(AuditLog.objects.filter(action_type=AuditLog.ActionType.MEMBER_APPROVED).exists())
        log = AuditLog.objects.get(action_type=AuditLog.ActionType.MEMBER_REJECTED)
        self.assertEqual(log.details['new_status'], 'REJECTED')
        self.assertEqual(log.details['approved_by'], 'Maria Santos')
        self.assertEqual(log.details['approved_by_position'], 'PRESIDENT')

    def test_list_serializer_exposes_admin_name(self):
        AuditLog.objects.create(
            admin_user=self.admin,
            action_type=AuditLog.ActionType.ADMIN_CREATED,
            entity_type=AuditLog.EntityType.USER,
            entity_name='Someone',
        )

        res = self.client.get('/api/audit-logs/')
        self.assertEqual(res.status_code, 200)

        results = res.data['results'] if isinstance(res.data, dict) else res.data
        entry = next(x for x in results if x['action_type'] == 'ADMIN_CREATED')
        self.assertEqual(entry['admin_name'], 'Maria Santos')
        self.assertEqual(entry['admin_position'], 'PRESIDENT')