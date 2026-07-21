import contextlib
import logging
import secrets

from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.core.exceptions import ValidationError
from django.utils.encoding import force_str
from django.utils.http import urlsafe_base64_decode
from django_ratelimit.decorators import ratelimit
from rest_framework import serializers, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView

from .models import PasswordResetToken
from .serializers import (
    AdminLoginSerializer,
    AdminRegistrationSerializer,
    RegisterSerializer,
    UserSerializer,
)
from .utils import (
    build_password_reset_url,
    get_client_ip,
    recent_failures,
    record_failed_attempt,
    send_password_reset_email,
)

logger = logging.getLogger(__name__)


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

        from django.utils import timezone
        from rest_framework_simplejwt.settings import api_settings
        refresh = self.get_token(user)
        data = {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }
        if api_settings.UPDATE_LAST_LOGIN:
            user.last_login = timezone.now()
            user.save(update_fields=['last_login'])
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
            with contextlib.suppress(Exception):
                record_failed_attempt(email, ip)

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


@api_view(['POST'])
@permission_classes([AllowAny])
@ratelimit(key='ip', rate='5/m', block=True)
def admin_register(request):
    serializer = AdminRegistrationSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        return Response({
            'message': 'Admin access request submitted successfully. Please wait for President approval.',
            'user': UserSerializer(user).data,
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
@ratelimit(key='ip', rate='5/15m', block=False)
def admin_login(request):
    """
    Dedicated admin login endpoint.
    Rejects anyone who is not role=ADMIN with a position assigned.
    """
    if getattr(request, 'limited', False):
        return Response(
            {'detail': 'Too many login attempts. Try again later or reset your password.'},
            status=status.HTTP_429_TOO_MANY_REQUESTS,
        )
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
        with contextlib.suppress(Exception):
            record_failed_attempt(email, ip)
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
@ratelimit(key='ip', rate='5/m', block=False)
def forgot_password(request):
    if getattr(request, 'limited', False):
        return Response(
            {'detail': 'Too many password reset requests. Try again later.'},
            status=status.HTTP_429_TOO_MANY_REQUESTS,
        )

    email = request.data.get('email', '').strip()
    if not email:
        return Response(
            {'detail': 'Email is required.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Always return the same message to prevent user enumeration
    message = 'If an account with that email exists, a reset link has been sent.'

    try:
        user = User.objects.filter(email__iexact=email).first()
        if user:
            # Clean up any expired tokens for this user
            PasswordResetToken.objects.filter(user=user).delete()
            raw_token = secrets.token_urlsafe(48)
            PasswordResetToken.objects.create(user=user, token=raw_token)
            reset_url = build_password_reset_url(user, raw_token, request=request)
            send_password_reset_email(email, reset_url)
    except Exception:
        import logging
        logging.getLogger(__name__).exception("Forgot-password error for %s", email)

    return Response({'message': message})


@api_view(['POST'])
@permission_classes([AllowAny])
@ratelimit(key='ip', rate='5/m', block=False)
def reset_password(request):
    if getattr(request, 'limited', False):
        return Response(
            {'detail': 'Too many attempts. Try again later.'},
            status=status.HTTP_429_TOO_MANY_REQUESTS,
        )

    uidb64 = request.data.get('uidb64', '').strip()
    token = request.data.get('token', '').strip()
    password = request.data.get('password', '')

    if not uidb64 or not token or not password:
        return Response(
            {'detail': 'User ID, token, and new password are required.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if len(password) < 8:
        logger.warning("Reset-password: password too short (uidb64=%s)", uidb64[:10])
        return Response(
            {'detail': 'Password must be at least 8 characters.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        uid = force_str(urlsafe_base64_decode(uidb64))
        user = User.objects.get(pk=uid)
    except (TypeError, ValueError, OverflowError, User.DoesNotExist):
        logger.warning("Reset-password: invalid uidb64 (uidb64=%s)", uidb64[:10])
        return Response(
            {'detail': 'Invalid reset link.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Try DB-backed token first, fallback to stateless PasswordResetTokenGenerator
    # to support links generated before the DB-backed deploy.
    reset_token = None
    with contextlib.suppress(PasswordResetToken.DoesNotExist):
        reset_token = PasswordResetToken.objects.get(user=user, token=token, is_used=False)

    if reset_token is None:
        if not PasswordResetTokenGenerator().check_token(user, token):
            logger.warning(
                "Reset-password: token check failed for user %s (uidb64=%s)",
                user.pk, uidb64[:10],
            )
            return Response(
                {'detail': 'This reset link is invalid or has expired.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
    elif reset_token.is_expired():
        logger.warning(
            "Reset-password: expired token for user %s (uidb64=%s)",
            user.pk, uidb64[:10],
        )
        return Response(
            {'detail': 'This reset link is invalid or has expired.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        validate_password(password, user=user)
    except ValidationError as e:
        logger.warning(
            "Reset-password: password validation failed for user %s: %s",
            user.pk, e.messages,
        )
        return Response(
            {'detail': ' '.join(e.messages)},
            status=status.HTTP_400_BAD_REQUEST,
        )

    user.set_password(password)
    user.save()

    if reset_token is not None:
        reset_token.is_used = True
        reset_token.save(update_fields=['is_used'])

    # Blacklist all existing refresh tokens (non-critical)
    try:
        from rest_framework_simplejwt.token_blacklist.models import (
            BlacklistedToken,
            OutstandingToken,
        )
        for token_obj in OutstandingToken.objects.filter(user=user):
            BlacklistedToken.objects.get_or_create(token=token_obj)
    except Exception:
        pass

    return Response({'message': 'Password reset successful.'})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@ratelimit(key='ip', rate='5/m', block=True)
def change_password(request):
    user = request.user
    current_password = request.data.get('current_password', '')
    new_password = request.data.get('new_password', '')
    confirm_password = request.data.get('confirm_password', '')

    if not current_password or not new_password or not confirm_password:
        return Response(
            {'detail': 'Current password, new password, and confirmation are required.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if not user.check_password(current_password):
        return Response(
            {'detail': 'Current password is incorrect.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if new_password != confirm_password:
        return Response(
            {'detail': 'New password and confirmation do not match.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if len(new_password) < 8:
        return Response(
            {'detail': 'New password must be at least 8 characters.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        validate_password(new_password, user=user)
    except ValidationError as e:
        return Response(
            {'detail': ' '.join(e.messages)},
            status=status.HTTP_400_BAD_REQUEST,
        )

    user.set_password(new_password)
    user.save()

    # Blacklist all existing refresh tokens
    try:
        from rest_framework_simplejwt.token_blacklist.models import (
            BlacklistedToken,
            OutstandingToken,
        )
        for token_obj in OutstandingToken.objects.filter(user=user):
            BlacklistedToken.objects.get_or_create(token=token_obj)
    except Exception:
        pass

    return Response({'message': 'Password changed successfully.'})
