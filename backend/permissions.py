from rest_framework.permissions import BasePermission


class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and getattr(request.user, 'role', '') == 'ADMIN'
        )


class IsPresident(IsAdmin):
    def has_permission(self, request, view):
        return (
            super().has_permission(request, view)
            and request.user.position == 'PRESIDENT'
        )


class CanManageRoles(IsAdmin):
    def has_permission(self, request, view):
        return (
            super().has_permission(request, view)
            and request.user.can_manage_roles
        )


class IsOwnerOrAdmin(BasePermission):
    def has_object_permission(self, request, view, obj):
        if getattr(request.user, 'role', '') == 'ADMIN':
            return True
        return obj.user == request.user
