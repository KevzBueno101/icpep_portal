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
from django_ratelimit.exceptions import Ratelimited
from rest_framework.response import Response
from rest_framework import status

class EmailTokenObtainPairSerializer(TokenObtainPairSerializer):
    username_field = 'email'

    def validate(self, attrs):
        # First authenticate the user
        data = super().validate(attrs)
        user = self.user

        # Reject admin users - they must use the admin portal login
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
@ratelimit(key='ip', rate='5/m', block=True)
def admin_login(request):
    """
    Dedicated admin login endpoint.
    Rejects anyone who is not role=ADMIN with a position assigned.
    """
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
    return Response(serializer.errors, status=status.HTTP_401_UNAUTHORIZED)
