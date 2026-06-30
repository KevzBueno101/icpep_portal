from rest_framework import serializers, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model

from .serializers import RegisterSerializer, UserSerializer, AdminLoginSerializer
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
from django_ratelimit.decorators import ratelimit
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from .utils import get_client_ip, record_failed_attempt, recent_failures, send_password_reset_email

class EmailTokenObtainPairSerializer(TokenObtainPairSerializer):
    username_field = 'email'

    def validate(self, attrs):
        from django.contrib.auth import authenticate
        email = attrs.get('email', '')
        password = attrs.get('password', '')

        if not User.objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError('No account found with this email.')

        user = authenticate(
            request=self.context.get('request'),
            username=email,
            password=password,
        )
        if not user:
            user_by_email = User.objects.filter(email__iexact=email).first()
            if user_by_email and (
                getattr(user_by_email, 'role', None) == 'ADMIN'
                or user_by_email.is_staff
            ):
                raise serializers.ValidationError(
                    'Admin users must use the admin portal login at /admin-portal/login'
                )
            raise serializers.ValidationError('Incorrect password.')

        self.user = user

        if hasattr(user, 'role'):
            if user.role == 'ADMIN':
                raise serializers.ValidationError(
                    'Admin users must use the admin portal login at /admin-portal/login'
                )
        else:
            if user.is_staff or user.is_superuser:
                raise serializers.ValidationError(
                    'Admin users must use the admin portal login at /admin-portal/login'
                )

        from rest_framework_simplejwt.settings import api_settings
        from django.contrib.auth import update_last_login
        refresh = self.get_token(user)
        data = {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }
        if api_settings.UPDATE_LAST_LOGIN:
            update_last_login(None, user)
        return data

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        # Embed role + position in the JWT payload
        token['role']     = getattr(user, 'role', 'ADMIN' if getattr(user, 'is_staff', False) or getattr(user, 'is_superuser', False) else 'MEMBER')
        token['position'] = getattr(user, 'position', 'PRESIDENT' if getattr(user, 'is_staff', False) or getattr(user, 'is_superuser', False) else 'NONE')
        return token


class EmailTokenObtainPairView(TokenObtainPairView):
    serializer_class = EmailTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        email = request.data.get('email', '')
        ip = get_client_ip(request)

        # Block if too many recent failures for this email (non-critical)
        try:
            blocked = email and recent_failures(email, minutes=15) >= 5
        except Exception:
            blocked = False
        if blocked:
            return Response(
                {'detail': 'Too many login attempts. Try again later or reset your password.'},
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )

        response = super().post(request, *args, **kwargs)

        # Record failed attempts (non-critical — must not break login)
        if response.status_code >= 400 and email:
            try:
                record_failed_attempt(email, ip)
            except Exception:
                pass

        return response


User = get_user_model()


@api_view(['POST'])
@permission_classes([AllowAny])
@ratelimit(key='ip', rate='5/m', block=True)
def register(request):
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        user    = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response({
            'message': 'Registration successful.',
            'user':    UserSerializer(user).data,
            'tokens': {
                'refresh': str(refresh),
                'access':  str(refresh.access_token),
            }
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([AllowAny])
@ratelimit(key='ip', rate='5/m', block=True)
def check_availability(request):
    email = request.query_params.get('email', '').strip()
    username = request.query_params.get('username', '').strip()
    data = {}

    if email:
        data['email_exists'] = User.objects.filter(email__iexact=email).exists()

    if username:
        data['username_exists'] = User.objects.filter(username__iexact=username).exists()

    return Response(data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
@ratelimit(key='ip', rate='5/m', block=True)
def me(request):
    return Response(UserSerializer(request.user).data)


@api_view(['POST'])
@permission_classes([AllowAny])
@ratelimit(key='ip', rate='5/15m', block=True)
def admin_login(request):
    """
    Dedicated admin login endpoint.
    Rejects anyone who is not role=ADMIN with a position assigned.
    """
    email = request.data.get('email', '')
    ip = get_client_ip(request)

    # Block if too many recent failures for this email (non-critical)
    try:
        blocked = email and recent_failures(email, minutes=15) >= 5
    except Exception:
        blocked = False
    if blocked:
        return Response(
            {'detail': 'Too many login attempts. Try again later or reset your password.'},
            status=status.HTTP_429_TOO_MANY_REQUESTS,
        )

    serializer = AdminLoginSerializer(data=request.data)
    if serializer.is_valid():
        user    = serializer.validated_data['user']
        refresh = RefreshToken.for_user(user)

        # Embed extra claims
        access_token          = refresh.access_token
        access_token['role']     = getattr(user, 'role', 'ADMIN' if getattr(user, 'is_staff', False) or getattr(user, 'is_superuser', False) else 'MEMBER')
        access_token['position'] = getattr(user, 'position', 'PRESIDENT' if getattr(user, 'is_staff', False) or getattr(user, 'is_superuser', False) else 'NONE')
        position = access_token['position']

        return Response({
            'message':  f'Welcome, {position.capitalize()}!',
            'user':     UserSerializer(user).data,
            'tokens': {
                'refresh': str(refresh),
                'access':  str(access_token),
            }
        })

    # Record failed attempt (non-critical)
    if email:
        try:
            record_failed_attempt(email, ip)
        except Exception:
            pass
    return Response(serializer.errors, status=status.HTTP_401_UNAUTHORIZED)


@api_view(['GET'])
@permission_classes([AllowAny])
@ratelimit(key='ip', rate='10/m', block=False)
def failed_attempts(request):
    if getattr(request, 'limited', False):
        return Response({'count': 5}, status=status.HTTP_429_TOO_MANY_REQUESTS)

    email = request.query_params.get('email', '').strip()
    if not email:
        return Response({'count': 0})
    try:
        count = recent_failures(email, minutes=15)
    except Exception:
        count = 0
    return Response({'count': count})


@api_view(['POST'])
@permission_classes([AllowAny])
@ratelimit(key='ip', rate='3/15m', block=False)
def forgot_password(request):
    if getattr(request, 'limited', False):
        return Response(
            {'detail': 'Too many password reset requests. Try again in 15 minutes.'},
            status=status.HTTP_429_TOO_MANY_REQUESTS,
        )

    from django.conf import settings
    email = request.data.get('email', '').strip()
    if not email:
        return Response(
            {'detail': 'Email is required.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    user = User.objects.filter(email__iexact=email).first()

    # Always return the same message to prevent user enumeration
    message = 'If an account with that email exists, a reset link has been sent.'

    if user:
        token = PasswordResetTokenGenerator().make_token(user)
        reset_url = f"{settings.FRONTEND_URL}/reset-password/{user.pk}/{token}"

        try:
            send_password_reset_email(email, reset_url)
        except Exception:
            return Response(
                {'detail': 'Unable to send reset email. Please try again later.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    return Response({'message': message})


@api_view(['POST'])
@permission_classes([AllowAny])
@ratelimit(key='ip', rate='5/15m', block=False)
def reset_password(request):
    if getattr(request, 'limited', False):
        return Response(
            {'detail': 'Too many password reset attempts. Try again in 15 minutes.'},
            status=status.HTTP_429_TOO_MANY_REQUESTS,
        )

    pk = request.data.get('pk', '').strip()
    token = request.data.get('token', '').strip()
    password = request.data.get('password', '')

    if not pk or not token or not password:
        return Response(
            {'detail': 'User ID, token, and new password are required.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if len(password) < 8:
        return Response(
            {'detail': 'Password must be at least 8 characters.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        user = User.objects.get(pk=pk)
    except User.DoesNotExist:
        return Response(
            {'detail': 'Invalid reset link.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if not PasswordResetTokenGenerator().check_token(user, token):
        return Response(
            {'detail': 'This reset link is invalid or has expired.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    user.set_password(password)
    user.save()

    # Blacklist all existing refresh tokens (non-critical)
    try:
        from rest_framework_simplejwt.token_blacklist.models import OutstandingToken, BlacklistedToken
        for token_obj in OutstandingToken.objects.filter(user=user):
            BlacklistedToken.objects.get_or_create(token=token_obj)
    except Exception:
        pass

    return Response({'message': 'Password reset successful.'})
