from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

User = get_user_model()


class Command(BaseCommand):
    help = 'Reset password for a superadmin account'

    def add_arguments(self, parser):
        parser.add_argument(
            '--email',
            type=str,
            help='Email of the user to reset password for',
        )
        parser.add_argument(
            '--new-password',
            type=str,
            help='New password to set',
        )

    def handle(self, *args, **options):
        email = options.get('email')
        new_password = options.get('new_password')

        if not email:
            email = input('Enter email of the user: ')
        
        if not new_password:
            new_password = input('Enter new password: ')

        try:
            user = User.objects.get(email=email)
            user.set_password(new_password)
            user.save()
            self.stdout.write(
                self.style.SUCCESS(f'Successfully reset password for {email}')
            )
        except User.DoesNotExist:
            self.stdout.write(
                self.style.ERROR(f'User with email {email} does not exist')
            )
