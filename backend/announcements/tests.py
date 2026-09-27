from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from members.models import MemberProfile

from .models import Announcement, BlastLog

User = get_user_model()


class AnnouncementEmailBlastTests(APITestCase):
    """Tests for POST /api/announcements/admin/<id>/email-blast/."""

    def setUp(self):
        self.admin = User.objects.create_user(
            email='officer@example.com',
            username='officer',
            password='Password123',
            role='ADMIN',
            position='Vice President',
            registration_status='APPROVED',
            is_active=True,
        )
        self.client.force_authenticate(user=self.admin)

        self.member = self._make_member(
            email='member@example.com',
            username='member',
            first_name='Maria',
            last_name='Santos',
            school_id='member-num',
        )
        self.announcement = Announcement.objects.create(
            title='General Assembly',
            body='Annual general assembly for all members.',
            category='event',
            author='Vice President',
            is_published=True,
            members_only=True,
        )

    def _make_member(self, **kwargs):
        fields = {
            'password': 'Password123',
            'registration_status': 'APPROVED',
            'is_active': True,
            'first_name': 'Juan',
            'last_name': 'Dela Cruz',
        }
        fields.update(kwargs)
        school_id = fields.pop('school_id', kwargs.get('username', 'member') + '-num')
        user = User.objects.create_user(**fields)
        MemberProfile.objects.create(
            user=user,
            first_name=fields['first_name'],
            last_name=fields['last_name'],
            student_number=school_id,
            course='BS CpE',
            year_level='3',
            section='A',
            contact_number='09171234567',
            membership_status='APPROVED',
        )
        return user

    @patch('announcements.blast.send_email_blocking', return_value=True)
    def test_blast_sends_to_approved_members_only(self, mock_send):
        pending = self._make_member(
            email='pending@example.com',
            username='pending',
            school_id='pending-num',
        )
        pending.profile.membership_status = 'PENDING'
        pending.profile.save()

        response = self.client.post(
            f'/api/announcements/admin/{self.announcement.id}/email-blast/'
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        self.assertEqual(response.data['recipients'], 1)
        self.assertEqual(response.data['sent'], 1)
        self.assertEqual(response.data['failed'], 0)
        self.assertEqual(response.data['queued'], 0)
        # Only the approved member was emailed (pending member excluded).
        self.assertEqual(mock_send.call_count, 1)
        self.assertEqual(mock_send.call_args[0][1], 'member@example.com')

        self.announcement.refresh_from_db()
        self.assertIsNotNone(self.announcement.email_blast_sent_at)
        self.assertEqual(BlastLog.objects.count(), 1)

    @patch('announcements.blast.send_email_blocking', return_value=True)
    def test_blast_is_a_noop_when_no_approved_members(self, mock_send):
        self.member.profile.membership_status = 'PENDING'
        self.member.profile.save()

        response = self.client.post(
            f'/api/announcements/admin/{self.announcement.id}/email-blast/'
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        self.assertEqual(response.data['sent'], 0)
        mock_send.assert_not_called()

    def test_public_announcement_cannot_be_blasted(self):
        self.announcement.members_only = False
        self.announcement.save()

        response = self.client.post(
            f'/api/announcements/admin/{self.announcement.id}/email-blast/'
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIsNone(self.announcement.email_blast_sent_at)

    def test_unpublished_announcement_cannot_be_blasted(self):
        self.announcement.is_published = False
        self.announcement.save()

        response = self.client.post(
            f'/api/announcements/admin/{self.announcement.id}/email-blast/'
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIsNone(self.announcement.email_blast_sent_at)

    @patch('announcements.blast.send_email_blocking', return_value=True)
    def test_blast_cannot_be_triggered_twice(self, mock_send):
        first = self.client.post(
            f'/api/announcements/admin/{self.announcement.id}/email-blast/'
        )
        self.assertEqual(first.status_code, status.HTTP_200_OK)

        second = self.client.post(
            f'/api/announcements/admin/{self.announcement.id}/email-blast/'
        )

        self.assertEqual(second.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(mock_send.call_count, 1)
        self.assertEqual(BlastLog.objects.count(), 1)
        self.assertEqual(BlastLog.objects.first().sent_count, 1)

    @patch('announcements.blast.send_email_blocking', return_value=True)
    def test_restricted_admin_cannot_blast(self, mock_send):
        self.admin.access_level = User.AccessLevel.RESTRICTED
        self.admin.save()

        response = self.client.post(
            f'/api/announcements/admin/{self.announcement.id}/email-blast/'
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIsNone(self.announcement.email_blast_sent_at)


class AnnouncementFlushEmailTests(APITestCase):
    """Tests for the flush_announcement_emails management command."""

    def setUp(self):
        self.announcement = Announcement.objects.create(
            title='Queued Announcement',
            body='Needs flushing.',
            category='announcement',
            author='Vice President',
            is_published=True,
            members_only=True,
            email_blast_sent_at=timezone.now(),
        )

    @patch('announcements.blast.send_email_blocking', return_value=True)
    def test_flush_skips_fully_sent_announcements(self, mock_send):
        BlastLog.objects.create(
            announcement=self.announcement,
            recipient_count=5,
            sent_count=5,
        )

        from django.core.management import call_command
        call_command('flush_announcement_emails')

        mock_send.assert_not_called()
        self.assertEqual(BlastLog.objects.count(), 1)

    @patch('announcements.blast.send_email_blocking', return_value=True)
    def test_flush_resumes_partial_announcement(self, mock_send):
        member = User.objects.create_user(
            email='member@example.com',
            username='member',
            password='Password123',
            first_name='Maria',
            last_name='Santos',
            registration_status='APPROVED',
            is_active=True,
        )
        MemberProfile.objects.create(
            user=member,
            first_name='Maria',
            last_name='Santos',
            student_number='12345',
            course='BS CpE',
            year_level='3',
            section='A',
            contact_number='09171234567',
            membership_status='APPROVED',
        )
        # A previous run already emailed this member.
        BlastLog.objects.create(
            announcement=self.announcement,
            recipient_count=1,
            sent_count=1,
        )

        from django.core.management import call_command
        call_command('flush_announcement_emails')

        # Fully sent -> nothing new delivered on the first flush.
        mock_send.assert_not_called()
        self.assertEqual(BlastLog.objects.count(), 1)

        # A new member gets approved -> the next flush delivers to them and
        # creates a new BlastLog row for that run.
        member2 = User.objects.create_user(
            email='member2@example.com',
            username='member2',
            password='Password123',
            first_name='Ana',
            last_name='Reyes',
            registration_status='APPROVED',
            is_active=True,
        )
        MemberProfile.objects.create(
            user=member2,
            first_name='Ana',
            last_name='Reyes',
            student_number='54321',
            course='BS CpE',
            year_level='2',
            section='B',
            contact_number='09179876543',
            membership_status='APPROVED',
        )

        mock_send.reset_mock()
        call_command('flush_announcement_emails')

        self.assertEqual(mock_send.call_count, 1)
        self.assertEqual(mock_send.call_args[0][1], 'member2@example.com')
        self.assertEqual(BlastLog.objects.count(), 2)
