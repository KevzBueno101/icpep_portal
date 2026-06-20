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

        if User.objects.filter(email=email).exists():
            self.stdout.write('Superadmin already exists, skipping.')
            return

        user = User.objects.create_superuser(
            email=email,
            username=username,
            password=password
        )
        user.role = 'ADMIN'
        user.position = 'PRESIDENT'
        user.is_staff = True
        user.is_superuser = True
        user.save()

        self.stdout.write(
            self.style.SUCCESS(f'Superadmin created: {email}')
        )