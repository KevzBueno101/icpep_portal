from rest_framework import status
from rest_framework.pagination import PageNumberPagination
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404
from django.utils import timezone

from .serializers import (
    UserListSerializer,
    AssignRoleSerializer,
    DelegateSecretarySerializer,
    OfficerCreateSerializer,
    AdminAccountSerializer,
)
from permissions import IsAdmin, IsOwnerOrAdmin, CanManageRoles
# backend/users/views.py
from rest_framework import generics, permissions
from .serializers import AdminProfileSerializer
from django.contrib.auth import get_user_model

User = get_user_model()

class AdminProfileAPIView(generics.RetrieveAPIView):
    """
    GET /admin/profile/ – returns the currently authenticated admin’s profile.
    """
    serializer_class = AdminProfileSerializer
    permission_classes = [permissions.IsAdminUser]

    def get_object(self):
        return self.request.user


User = get_user_model()


def _is_president(user):
    return user.role == 'ADMIN' and user.position == 'PRESIDENT'


def _can_manage(user):
    return user.is_admin and user.can_manage_roles


# ── List all admin accounts ──────────────────────────────────────────────────

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def admin_accounts_list(request):
    """
    List ADMIN-role accounts, or create a new admin account.
    Accessible by President or delegated Secretary for listing.
    Creation is reserved for President only.
    """
    if not _can_manage(request.user):
        return Response(
            {'detail': 'Permission denied.'},
            status=status.HTTP_403_FORBIDDEN
        )

    if request.method == 'POST':
        serializer = AdminAccountSerializer(
            data=request.data,
            context={'requester': request.user}
        )
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        new_admin = serializer.save()
        return Response({
            'message': 'Admin account created successfully.',
            'user': UserListSerializer(new_admin).data,
        }, status=status.HTTP_201_CREATED)

    admins = User.objects.filter(role='ADMIN').order_by('position', 'email')

    # Apply pagination to match frontend expectations (returns {results: [...]})
    paginator = PageNumberPagination()
    page = paginator.paginate_queryset(admins, request)
    if page is not None:
        serializer = UserListSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)

    return Response(UserListSerializer(admins, many=True).data)


@api_view(['GET', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def admin_account_detail(request, pk):
    if not _can_manage(request.user):
        return Response(
            {'detail': 'Permission denied.'},
            status=status.HTTP_403_FORBIDDEN
        )

    target = get_object_or_404(User, pk=pk)

    if target.is_superuser and not request.user.is_superuser:
        return Response(
            {'detail': 'Cannot modify a superuser account.'},
            status=status.HTTP_403_FORBIDDEN
        )

    if request.method == 'GET':
        return Response(UserListSerializer(target).data)

    if request.method == 'DELETE':
        if target.pk == request.user.pk:
            return Response(
                {'detail': 'You cannot delete your own account.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        target.delete()
        return Response({'message': 'Admin account deleted successfully.'}, status=status.HTTP_204_NO_CONTENT)

    serializer = AdminAccountSerializer(
        target,
        data=request.data,
        partial=True,
        context={'requester': request.user}
    )
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    updated = serializer.save()
    return Response({
        'message': 'Admin account updated successfully.',
        'user': UserListSerializer(updated).data,
    })


# ── Assign role / position to a user ────────────────────────────────────────

@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def assign_role(request, pk):
    """
    Assign role + position to any user account.
    President → can assign anything including President (transfer of power).
    Delegated Secretary → Treasurer / Secretary / NONE only.

    Transfer-of-power logic:
      If requester assigns position=PRESIDENT to someone else,
      requester's own position becomes NONE automatically.
    """
    if not _can_manage(request.user):
        return Response(
            {'detail': 'Permission denied.'},
            status=status.HTTP_403_FORBIDDEN
        )

    target = get_object_or_404(User, pk=pk)

    # Cannot modify a superuser account
    if target.is_superuser and not request.user.is_superuser:
        return Response(
            {'detail': 'Cannot modify a superuser account.'},
            status=status.HTTP_403_FORBIDDEN
        )

    serializer = AssignRoleSerializer(
        data=request.data,
        context={'requester': request.user}
    )
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    new_role        = serializer.validated_data['role']
    new_position    = serializer.validated_data['position']
    new_delegated   = serializer.validated_data['is_delegated']

    # ── Transfer-of-power ───────────────────────────────────────────────────
    # If President assigns President to someone else → step down
    if (
        _is_president(request.user)
        and new_position == User.Position.PRESIDENT
        and target.pk != request.user.pk
    ):
        request.user.position     = User.Position.NONE
        request.user.is_delegated = False
        request.user.term_start   = None
        request.user.save(update_fields=['position', 'is_delegated', 'term_start'])

    # ── Apply changes to target ─────────────────────────────────────────────
    target.role         = new_role
    target.position     = new_position
    target.is_delegated = new_delegated if new_position == 'SECRETARY' else False
    target.term_start   = timezone.now().date() if new_position != 'NONE' else None
    target.save(update_fields=['role', 'position', 'is_delegated', 'term_start'])

    return Response({
        'message': f'Role updated successfully.',
        'user':    UserListSerializer(target).data,
    })


# ── Delegate / un-delegate Secretary ────────────────────────────────────────

@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def delegate_secretary(request, pk):
    """
    Toggle is_delegated for a Secretary account.
    President only.
    """
    if not _is_president(request.user):
        return Response(
            {'detail': 'Only the President can delegate the Secretary.'},
            status=status.HTTP_403_FORBIDDEN
        )

    target = get_object_or_404(User, pk=pk)

    if target.position != User.Position.SECRETARY:
        return Response(
            {'detail': 'Target user must have Secretary position to be delegated.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    serializer = DelegateSecretarySerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    target.is_delegated = serializer.validated_data['is_delegated']
    target.save(update_fields=['is_delegated'])

    action = 'delegated' if target.is_delegated else 'delegation removed from'
    return Response({
        'message': f'Secretary {action} successfully.',
        'user':    UserListSerializer(target).data,
    })


# ── Year-end reset ───────────────────────────────────────────────────────────

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def year_end_reset(request):
    """
    Resets ALL admin positions to NONE.
    - role stays ADMIN
    - position → NONE
    - is_delegated → False
    - term_start → None
    President only. The President's own position is also reset.
    After this, President must re-assign everyone including themselves.
    """
    if not _is_president(request.user):
        return Response(
            {'detail': 'Only the President can perform year-end reset.'},
            status=status.HTTP_403_FORBIDDEN
        )

    updated = User.objects.filter(role='ADMIN').update(
        position='NONE',
        is_delegated=False,
        term_start=None,
    )

    return Response({
        'message': f'Year-end reset complete. {updated} admin account(s) were reset.',
        'reset_count': updated,
    })


# ── Create officer accounts ───────────────────────────────────────────────

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_officer_account(request):
    """President-only creation of new ADMIN-role officer accounts."""
    serializer = OfficerCreateSerializer(
        data=request.data,
        context={'requester': request.user}
    )
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    validated = serializer.validated_data

    # Create the user
    UserModel = get_user_model()
    new_user = UserModel.objects.create_user(
        email=validated['email'],
        username=validated['username'],
        password=validated['password'],
        role=validated['role'],
        position=validated['position'],
        is_delegated=(validated['position'] == 'SECRETARY' and validated['is_delegated']),
        term_start=(timezone.now().date() if validated['position'] != 'NONE' else None),
    )

    return Response({
        'message': 'Officer account created successfully.',
        'user': UserListSerializer(new_user).data,
    }, status=status.HTTP_201_CREATED)

