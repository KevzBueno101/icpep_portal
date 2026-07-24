import os

from django.core.management.base import BaseCommand

from users.models import User


class Command(BaseCommand):
    help = 'Create default superadmin'

    def handle(self, *args, **kwargs):
        email = os.environ.get('DJANGO_SUPERADMIN_EMAIL')
        username = os.environ.get('DJANGO_SUPERADMIN_USERNAME')
        password = os.environ.get('DJANGO_SUPERADMIN_PASSWORD')

        if not all([email, username, password]):
            self.stdout.write('No superadmin env vars found, skipping.')
            return

        existing = User.objects.filter(email=email).first()
        if existing:
            if existing.position == 'PRESIDENT':
                existing.position = 'NONE'
                existing.save(update_fields=['position'])
                self.stdout.write(self.style.SUCCESS(f'Superadmin position reset to NONE: {email}'))
            else:
                self.stdout.write('Superadmin already exists, skipping.')
            return

        user = User.objects.create_superuser(
            email=email,
            username=username,
            password=password
        )
        user.role = 'ADMIN'
        user.position = 'NONE'
        user.is_staff = True
        user.is_superuser = True
        user.save()

        self.stdout.write(
            self.style.SUCCESS(f'Superadmin created: {email}')
        )
