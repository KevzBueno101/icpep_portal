import os

from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .serializers import (
    AdminAccountSerializer,
    AssignRoleSerializer,
    DelegateSecretarySerializer,
    OfficerCreateSerializer,
    OfficerRosterSerializer,
    UserListSerializer,
)

try:
    from .serializers import AdminProfileSerializer
except ImportError:
    AdminProfileSerializer = None


from rest_framework import generics, permissions
from rest_framework.exceptions import PermissionDenied, ValidationError

from audit_logs.models import AuditLog
from audit_logs.utils import log_action

User = get_user_model()


class AdminProfileAPIView(generics.RetrieveUpdateAPIView):
    """GET/PATCH /admin/profile/ – returns/updates the currently authenticated admin's profile."""

    serializer_class = AdminProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        try:
            if not self.request.user or not self.request.user.is_authenticated:
                raise PermissionDenied('Authentication required.')

            user = self.request.user
            if not hasattr(user, 'role'):
                raise PermissionDenied('User object missing role attribute.')

            if user.role != 'ADMIN':
                raise PermissionDenied(f'Only admin users can edit their profile. Current role: {user.role}')

            return user
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Error in AdminProfileAPIView.get_object: {str(e)}", exc_info=True)
            raise

    def patch(self, request, *args, **kwargs):
        user = self.request.user

        position_lower = user.position.lower() if user.position else ''
        if 'president' in position_lower:
            allowed_fields = {
                'first_name', 'last_name', 'email', 'username',
                'role', 'position', 'profile_picture',
                'current_password', 'new_password', 'confirm_password',
                'department', 'academic_year',
            }
            if 'role' in request.data and request.data['role'] != 'ADMIN':
                raise ValidationError({'detail': 'President cannot change their own role to MEMBER.'})
        else:
            allowed_fields = {
                'first_name', 'last_name', 'email', 'username',
                'profile_picture', 'current_password', 'new_password', 'confirm_password',
                'department', 'academic_year',
            }

        incoming = set(request.data.keys())
        forbidden = sorted([f for f in incoming if f not in allowed_fields])
        if forbidden:
            raise ValidationError({
                'detail': f"Cannot update fields: {', '.join(forbidden)}. Only President can edit these fields."
            })

        return self.partial_update(request, *args, **kwargs)


User = get_user_model()


def _is_president(user):
    return user.role == 'ADMIN' and user.position == 'PRESIDENT'


def _can_manage(user):
    return user.is_admin and user.can_manage_roles


def _safe_profile_picture_url(user):
    """Safely extract profile picture URL. Returns None if file is missing or broken.

    Cloudinary returns absolute URLs (https://res.cloudinary.com/...), so we return them as-is.
    Local storage returns relative URLs (/media/...), which we return as-is for frontend resolution.
    If Cloudinary returns only a public_id, we construct the full URL.
    """
    try:
        field = getattr(user, 'profile_picture', None)
        if field and field.name:
            url = field.url
            # Cloudinary URLs are already absolute (start with http:// or https://)
            if isinstance(url, str) and url.startswith(('http://', 'https://')):
                return url
            # Local storage URLs are relative, return as-is for frontend to resolve
            if isinstance(url, str) and url.startswith('/'):
                return url
            # Fallback: if it's just a public_id, construct Cloudinary URL
            cloud_name = os.getenv('CLOUDINARY_CLOUD_NAME')
            if cloud_name and isinstance(url, str):
                return f"https://res.cloudinary.com/{cloud_name}/{url}"
            return url
    except (ValueError, AttributeError):
        pass
    return None


# ── List / Create admin accounts ─────────────────────────────────────────────

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def admin_accounts_list(request):
    if not _can_manage(request.user):
        return Response({'detail': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)

    if request.method == 'POST':
        serializer = AdminAccountSerializer(
            data=request.data,
            context={'requester': request.user}
        )
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        new_admin = serializer.save()

        log_action(
            user=request.user,
            action_type=AuditLog.ActionType.ADMIN_CREATED,
            entity_type=AuditLog.EntityType.USER,
            entity_id=new_admin.id,
            entity_name=new_admin.email,
            details={
                'email': new_admin.email,
                'username': new_admin.username,
                'role': new_admin.role,
                'position': new_admin.position,
            },
            request=request
        )

        return Response({
            'message': 'Admin account created successfully.',
            'user': UserListSerializer(new_admin).data,
        }, status=status.HTTP_201_CREATED)

    admins = User.objects.filter(role='ADMIN').order_by('position', 'email')
    paginator = PageNumberPagination()
    page = paginator.paginate_queryset(admins, request)

    def serialize_user(u):
        return {
            'id': u.id,
            'email': getattr(u, 'email', None),
            'username': getattr(u, 'username', None),
            'first_name': getattr(u, 'first_name', ''),
            'last_name': getattr(u, 'last_name', ''),
            'role': getattr(u, 'role', None),
            'position': getattr(u, 'position', None),
            'is_delegated': getattr(u, 'is_delegated', False),
            'is_active': getattr(u, 'is_active', True),
            'year_level': getattr(u, 'year_level', None),
            'created_at': getattr(u, 'created_at', None),
            'profile_picture': _safe_profile_picture_url(u),
        }

    results = [serialize_user(u) for u in (page if page is not None else admins)]
    if page is not None:
        return paginator.get_paginated_response(results)

    return Response(results)


# ── Get / Update / Delete single admin account ───────────────────────────────

@api_view(['GET', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def admin_account_detail(request, pk):
    if request.method in ['PATCH', 'DELETE']:
        is_president = (
            getattr(request.user, 'position', '') == 'PRESIDENT' and
            getattr(request.user, 'role', '') == 'ADMIN'
        )
        is_self = (pk == request.user.pk)

        if request.method == 'DELETE' and not is_president:
            return Response(
                {'detail': 'Only the President can delete accounts.'},
                status=status.HTTP_403_FORBIDDEN
            )
        if request.method == 'PATCH' and not (is_president or is_self):
            return Response(
                {'detail': 'Only the President can edit other accounts; you can only edit your own account.'},
                status=status.HTTP_403_FORBIDDEN
            )

    if not _can_manage(request.user):
        return Response({'detail': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)

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
        entity_id = target.pk
        entity_name = target.email
        target.delete()

        log_action(
            user=request.user,
            action_type=AuditLog.ActionType.ADMIN_DELETED,
            entity_type=AuditLog.EntityType.USER,
            entity_id=entity_id,
            entity_name=entity_name,
            details={'email': entity_name},
            request=request
        )

        # Broadcast roster update to all connected clients
        try:
            from asgiref.sync import async_to_sync
            from channels.layers import get_channel_layer

            channel_layer = get_channel_layer()
            if channel_layer is not None:
                async_to_sync(channel_layer.group_send)(
                    "officers",
                    {
                        "type": "officers.roster.updated",
                        "payload": {"updated_by": request.user.id},
                    },
                )
        except Exception:
            pass

        return Response({'message': 'Admin account deleted successfully.'}, status=status.HTTP_204_NO_CONTENT)

    # PATCH
    serializer = AdminAccountSerializer(
        target,
        data=request.data,
        partial=True,
        context={'requester': request.user}
    )
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    try:
        updated = serializer.save()
    except Exception as e:
        # Return actionable error instead of generic 500 HTML.
        # Frontend currently logs only "Server Error (500)".
        return Response(
            {'detail': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )

    log_action(
        user=request.user,
        action_type=AuditLog.ActionType.ADMIN_UPDATED,
        entity_type=AuditLog.EntityType.USER,
        entity_id=updated.id,
        entity_name=updated.email,
        details={'email': updated.email, 'changes': list(request.data.keys())},
        request=request
    )

    # Broadcast roster update to all connected clients
    try:
        from asgiref.sync import async_to_sync
        from channels.layers import get_channel_layer

        channel_layer = get_channel_layer()
        if channel_layer is not None:
            async_to_sync(channel_layer.group_send)(
                "officers",
                {
                    "type": "officers.roster.updated",
                    "payload": {"updated_by": request.user.id},
                },
            )
    except Exception:
        pass

    return Response({
        'message': 'Admin account updated successfully.',
        'user': UserListSerializer(updated).data,
    })


# ── Assign role / position to a user ────────────────────────────────────────

@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def assign_role(request, pk):
    if not _can_manage(request.user):
        return Response({'detail': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)

    target = get_object_or_404(User, pk=pk)

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

    new_role     = serializer.validated_data['role']
    new_position = serializer.validated_data['position']
    new_delegated = serializer.validated_data['is_delegated']

    if (
        _is_president(request.user) and
        new_position == 'PRESIDENT' and
        target.pk != request.user.pk
    ):
        request.user.position     = 'NONE'
        request.user.is_delegated = False
        request.user.term_start   = None
        request.user.save(update_fields=['position', 'is_delegated', 'term_start'])

    old_role     = target.role
    old_position = target.position
    target.role         = new_role
    target.position     = new_position
    target.is_delegated = new_delegated if new_position == 'SECRETARY' else False
    target.term_start   = timezone.now().date() if new_position != 'NONE' else None
    target.save(update_fields=['role', 'position', 'is_delegated', 'term_start'])

    log_action(
        user=request.user,
        action_type=AuditLog.ActionType.ROLE_ASSIGNED,
        entity_type=AuditLog.EntityType.USER,
        entity_id=target.id,
        entity_name=target.email,
        details={
            'email': target.email,
            'old_role': old_role,
            'new_role': new_role,
            'old_position': old_position,
            'new_position': new_position,
            'is_delegated': new_delegated,
        },
        request=request
    )

    # Broadcast roster update to all connected clients
    try:
        from asgiref.sync import async_to_sync
        from channels.layers import get_channel_layer

        channel_layer = get_channel_layer()
        if channel_layer is not None:
            async_to_sync(channel_layer.group_send)(
                "officers",
                {
                    "type": "officers.roster.updated",
                    "payload": {"updated_by": request.user.id},
                },
            )
    except Exception:
        # Real-time updates are best-effort; do not fail request.
        pass

    return Response({
        'message': 'Role updated successfully.',
        'user': UserListSerializer(target).data,
    })


# ── Delegate / un-delegate Secretary ────────────────────────────────────────

@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def delegate_secretary(request, pk):
    if not _is_president(request.user):

        return Response(
            {'detail': 'Only the President can delegate the Secretary.'},
            status=status.HTTP_403_FORBIDDEN
        )

    target = get_object_or_404(User, pk=pk)

    if target.position != 'SECRETARY':
        return Response(
            {'detail': 'Target user must have Secretary position to be delegated.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    serializer = DelegateSecretarySerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    target.is_delegated = serializer.validated_data['is_delegated']
    target.save(update_fields=['is_delegated'])

    log_action(
        user=request.user,
        action_type=AuditLog.ActionType.ROLE_DELEGATED,
        entity_type=AuditLog.EntityType.USER,
        entity_id=target.id,
        entity_name=target.email,
        details={
            'email': target.email,
            'is_delegated': target.is_delegated,
            'position': target.position,
        },
        request=request
    )

    # Broadcast roster update to all connected clients
    try:
        from asgiref.sync import async_to_sync
        from channels.layers import get_channel_layer

        channel_layer = get_channel_layer()
        if channel_layer is not None:
            async_to_sync(channel_layer.group_send)(
                "officers",
                {
                    "type": "officers.roster.updated",
                    "payload": {"updated_by": request.user.id},
                },
            )
    except Exception:
        pass

    action = 'delegated' if target.is_delegated else 'delegation removed from'
    return Response({
        'message': f'Secretary {action} successfully.',
        'user': UserListSerializer(target).data,
    })


# ── Year-end reset ───────────────────────────────────────────────────────────

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def year_end_reset(request):
    if not _is_president(request.user):
        return Response(
            {'detail': 'Only the President can perform year-end reset.'},
            status=status.HTTP_403_FORBIDDEN
        )

    from members.models import MemberProfile

    expired_members = MemberProfile.objects.filter(
        membership_status='APPROVED'
    ).update(membership_status='EXPIRED')

    updated_admins = User.objects.filter(
        role='ADMIN'
    ).exclude(
        position='PRESIDENT'
    ).update(
        position='NONE',
        is_delegated=False,
        term_start=None,
    )

    log_action(
        user=request.user,
        action_type=AuditLog.ActionType.YEAR_END_RESET,
        entity_type=AuditLog.EntityType.USER,
        entity_name='All Admins and Members',
        details={
            'expired_members': expired_members,
            'reset_admins': updated_admins,
            'type': 'full_reset',
        },
        request=request
    )

    return Response({
        'message': f'Year-end reset complete. {expired_members} member(s) expired, {updated_admins} admin account(s) reset.',
        'expired_members': expired_members,
        'reset_admins': updated_admins,
    })


# ── Create officer accounts ───────────────────────────────────────────────────

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

    log_action(
        user=request.user,
        action_type=AuditLog.ActionType.ADMIN_CREATED,
        entity_type=AuditLog.EntityType.USER,
        entity_id=new_user.id,
        entity_name=new_user.email,
        details={
            'email': new_user.email,
            'username': new_user.username,
            'role': new_user.role,
            'position': new_user.position,
            'is_delegated': new_user.is_delegated,
        },
        request=request
    )

    # Broadcast roster update to all connected clients
    try:
        from asgiref.sync import async_to_sync
        from channels.layers import get_channel_layer

        channel_layer = get_channel_layer()
        if channel_layer is not None:
            async_to_sync(channel_layer.group_send)(
                "officers",
                {
                    "type": "officers.roster.updated",
                    "payload": {"updated_by": request.user.id},
                },
            )
    except Exception:
        pass

    return Response({
        'message': 'Officer account created successfully.',
        'user': UserListSerializer(new_user).data,
    }, status=status.HTTP_201_CREATED)


# ── Officers roster (public) ─────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def officers_roster(request):
    """Public roster for the Student Leadership Board.

    Returns all users with role OFFICER or ADMIN who have recognized leadership
    positions. Filters out invalid records and only returns active officers
    with complete information.
    """

    leadership_positions = [
        'President',
        'Vice President',
        'Secretary',
        'Treasurer',
        'Auditor',
    ]

    def normalize_position(pos):
        """Map a raw position string to one of the canonical leadership titles.

        Uses contains-based matching so entries like 'External Vice President'
        or 'Vice Pres' still resolve correctly.
        Returns the canonical title, or the original position string if no
        match is found (so non-standard positions still show up as-is).
        """
        if not pos:
            return ''
        p_lower = str(pos).strip().lower()
        # Check specific matches first (most to least specific)
        if 'vice president' in p_lower or 'vice pres' in p_lower:
            return 'Vice President'
        if 'president' in p_lower:
            return 'President'
        if 'secretary' in p_lower:
            return 'Secretary'
        if 'treasurer' in p_lower:
            return 'Treasurer'
        if 'auditor' in p_lower:
            return 'Auditor'
        return str(pos).strip()

    # Include both OFFICER and ADMIN roles — all active officers/admins
    # with positions belong in the public-facing leadership board.
    qs = User.objects.filter(
        role__in=['OFFICER', 'ADMIN'],
        is_active=True,
    ).exclude(position__isnull=True).exclude(position='').exclude(position__iexact='NONE')

    roster = []
    for u in qs:
        canon = normalize_position(getattr(u, 'position', ''))
        if canon and canon in leadership_positions:
            u.position = canon
        roster.append(u)

    order_index = {p: i for i, p in enumerate(leadership_positions)}
    roster.sort(key=lambda u: order_index.get(getattr(u, 'position', ''), 999))

    # Serialize and filter out invalid records
    results = []
    for u in roster:
        officer_data = OfficerRosterSerializer.from_user(u, request=request)

        # Data integrity check: only include officers with valid full name and position
        if officer_data['fullName'] and officer_data['fullName'] != '-' and officer_data['position']:
            results.append(officer_data)

    return Response({'results': results}, status=status.HTTP_200_OK)
