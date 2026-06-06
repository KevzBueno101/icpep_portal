from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from rest_framework.test import APIRequestFactory, force_authenticate

from users.views import AdminProfileAPIView


class Command(BaseCommand):
    help = "Debug AdminProfileAPIView by forcing auth and calling get()."

    def add_arguments(self, parser):
        parser.add_argument('--user-id', type=int, required=True)

    def handle(self, *args, **options):
        User = get_user_model()
        user = User.objects.get(pk=options['user_id'])

        factory = APIRequestFactory()
        request = factory.get('/api/users/admin/profile/')
        force_authenticate(request, user=user)

        view = AdminProfileAPIView.as_view()
        response = view(request)

        self.stdout.write(self.style.SUCCESS(f'Status: {response.status_code}'))
        try:
            self.stdout.write(str(response.data))
        except Exception:
            self.stdout.write(str(response))

