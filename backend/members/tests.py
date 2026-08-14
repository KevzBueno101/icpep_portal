from datetime import UTC, date, datetime, time

from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.test import APITestCase

from members.models import MemberProfile

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


class MemberStatsTests(APITestCase):
    def setUp(self):
        self.admin = _make_user('admin@example.com', role='ADMIN', position='PRESIDENT')
        self.client.force_authenticate(self.admin)

    def _profile(self, user, status, created_on):
        profile = MemberProfile.objects.create(
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
        aware = timezone.make_aware(datetime.combine(created_on, time.min), UTC)
        MemberProfile.objects.filter(pk=profile.pk).update(created_at=aware)
        profile.refresh_from_db()
        return profile

    def test_requires_admin(self):
        self.client.force_authenticate(None)
        res = self.client.get('/api/members/stats/')
        self.assertEqual(res.status_code, 401)

        member = _make_user('member@example.com')
        self.client.force_authenticate(member)
        res = self.client.get('/api/members/stats/')
        self.assertEqual(res.status_code, 403)

    def test_empty_database(self):
        res = self.client.get('/api/members/stats/')
        self.assertEqual(res.status_code, 200)

        self.assertEqual(res.data['total'], 0)
        self.assertEqual(res.data['status_counts'], {
            'PENDING': 0,
            'APPROVED': 0,
            'REJECTED': 0,
            'EXPIRED': 0,
        })
        self.assertEqual(res.data['monthly_growth'], [])

    def test_status_counts_and_total(self):
        m1 = _make_user('m1@example.com')
        m2 = _make_user('m2@example.com')
        m3 = _make_user('m3@example.com')
        m4 = _make_user('m4@example.com')
        self._profile(m1, MemberProfile.Status.APPROVED, date(2025, 1, 10))
        self._profile(m2, MemberProfile.Status.APPROVED, date(2025, 2, 10))
        self._profile(m3, MemberProfile.Status.PENDING, date(2025, 2, 15))
        self._profile(m4, MemberProfile.Status.REJECTED, date(2025, 3, 5))

        res = self.client.get('/api/members/stats/')

        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data['total'], 4)
        self.assertEqual(res.data['status_counts']['APPROVED'], 2)
        self.assertEqual(res.data['status_counts']['PENDING'], 1)
        self.assertEqual(res.data['status_counts']['REJECTED'], 1)
        self.assertEqual(res.data['status_counts']['EXPIRED'], 0)

    def test_monthly_growth_is_chronological_and_zero_filled(self):
        m1 = _make_user('m1@example.com')
        m2 = _make_user('m2@example.com')
        self._profile(m1, MemberProfile.Status.APPROVED, date(2025, 1, 15))
        self._profile(m2, MemberProfile.Status.PENDING, date(2025, 3, 10))

        res = self.client.get('/api/members/stats/')

        months = res.data['monthly_growth']
        self.assertEqual(months[0]['month'], '2025-01')
        self.assertEqual(months[1]['month'], '2025-02')
        self.assertEqual(months[2]['month'], '2025-03')
        self.assertEqual([m['count'] for m in months[:3]], [1, 0, 1])
        self.assertEqual(months[-1]['month'], date.today().replace(day=1).strftime('%Y-%m'))
