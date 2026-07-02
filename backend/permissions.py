from rest_framework.permissions import BasePermission


def _is_admin_or_president(user):
    """Helper: True if role=ADMIN or position contains 'president'."""
    if getattr(user, 'role', '') == 'ADMIN':
        return True
    return 'president' in (getattr(user, 'position', '') or '').lower()


class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and _is_admin_or_president(request.user)
        )


class IsPresident(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and 'president' in (getattr(request.user, 'position', '') or '').lower()
        )


class CanManageMembership(BasePermission):
    """Only FULL_CONTROL admins can manage members (approve/renew)."""
    def has_permission(self, request, view):
        from users.models import User
        return bool(
            request.user
            and request.user.is_authenticated
            and _is_admin_or_president(request.user)
            and getattr(request.user, 'access_level', User.AccessLevel.FULL_CONTROL) == User.AccessLevel.FULL_CONTROL
        )


class CanManageContent(BasePermission):
    """Allows FULL_CONTROL and MEMBERSHIP to CRUD content (announcements, milestones, etc.). Blocks RESTRICTED."""
    def has_permission(self, request, view):
        from users.models import User
        return bool(
            request.user
            and request.user.is_authenticated
            and _is_admin_or_president(request.user)
            and getattr(request.user, 'access_level', User.AccessLevel.FULL_CONTROL) != User.AccessLevel.RESTRICTED
        )


class CanManageRoles(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and _is_admin_or_president(request.user)
            and request.user.can_manage_roles
        )


class IsOwnerOrAdmin(BasePermission):
    def has_object_permission(self, request, view, obj):
        if _is_admin_or_president(request.user):
            return True
        return obj.user == request.user
