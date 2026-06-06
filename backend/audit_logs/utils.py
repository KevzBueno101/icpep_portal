from .models import AuditLog


def log_action(user, action_type, entity_type, entity_id=None, entity_name='', details=None, request=None):
    """
    Helper function to create an audit log entry.
    
    Args:
        user: The User object who performed the action
        action_type: ActionType enum value (e.g., AuditLog.ActionType.MEMBER_APPROVED)
        entity_type: EntityType enum value (e.g., AuditLog.EntityType.MEMBER)
        entity_id: ID of the affected entity (optional)
        entity_name: Human-readable name of the entity (optional)
        details: Dictionary with additional context (optional)
        request: The HTTP request object to extract IP address (optional)
    """
    try:
        ip_address = None
        if request:
            # Get IP address from request
            x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
            if x_forwarded_for:
                ip_address = x_forwarded_for.split(',')[0].strip()
            else:
                ip_address = request.META.get('REMOTE_ADDR')
        
        AuditLog.objects.create(
            admin_user=user,
            action_type=action_type,
            entity_type=entity_type,
            entity_id=entity_id,
            entity_name=entity_name,
            details=details or {},
            ip_address=ip_address
        )
    except Exception as e:
        # Log errors but don't break the main operation
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Failed to create audit log: {str(e)}", exc_info=True)
