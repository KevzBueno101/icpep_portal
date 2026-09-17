import logging
import uuid
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import ChatRequestSerializer, ChatResponseSerializer, ChatErrorSerializer
from .services.gemini_client import GeminiClient
from .services.context_builder import build_context, get_session_history, update_session_history
from .throttles import GeminiUserMinuteThrottle, GeminiUserDailyThrottle

logger = logging.getLogger(__name__)


class ChatAPIView(APIView):
    """
    Chat endpoint for ICPEP chatbot.
    Requires authentication (MEMBERSHIP+ access level).
    Stateless - no DB persistence. Uses in-memory session for multi-turn context.
    """
    permission_classes = [IsAuthenticated]
    throttle_classes = [GeminiUserMinuteThrottle, GeminiUserDailyThrottle]

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.gemini_client = GeminiClient()

    def post(self, request):
        serializer = ChatRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                ChatErrorSerializer({'error': 'Invalid request', 'detail': serializer.errors}).data,
                status=status.HTTP_400_BAD_REQUEST
            )

        message = serializer.validated_data['message'].strip()
        if not message:
            return Response(
                ChatErrorSerializer({'error': 'Message cannot be empty'}).data,
                status=status.HTTP_400_BAD_REQUEST
            )

        session_id = serializer.validated_data.get('session_id') or str(uuid.uuid4())[:8]

        # Check access level (block RESTRICTED)
        user = request.user
        if getattr(user, 'access_level', 'FULL_CONTROL') == 'RESTRICTED':
            return Response(
                ChatErrorSerializer({'error': 'Chatbot access restricted for your account'}).data,
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            # Build context with system prompt + user info
            context = build_context(user, message, session_id)

            # Optionally include recent history for multi-turn (stateless in-memory)
            history = get_session_history(session_id)
            if history:
                history_text = "\n\nRecent conversation:\n"
                for msg in history[-6:]:  # Last 3 exchanges
                    role = "User" if msg['role'] == 'user' else "Assistant"
                    history_text += f"{role}: {msg['content']}\n"
                context += history_text

            # Call Gemini
            response_text = self.gemini_client.generate_response(context, message)

            # Update session history (in-memory)
            update_session_history(session_id, message, response_text)

            # Log token usage (for monitoring)
            tokens_estimated = self.gemini_client.count_tokens(context + message + response_text)
            logger.info(f'Chatbot: user={user.email} session={session_id} tokens~={tokens_estimated}')

            return Response(ChatResponseSerializer({
                'response': response_text,
                'session_id': session_id
            }).data)

        except Exception as e:
            logger.exception(f'Chatbot error for user={user.email}: {e}')
            error_msg = str(e)
            retry_after = None

            if 'ResourceExhausted' in type(e).__name__ or 'rate limit' in error_msg.lower():
                error_response = ChatErrorSerializer({
                    'error': 'Rate limit exceeded. Please try again later.',
                    'detail': 'Gemini API quota exceeded.',
                    'retry_after': 60
                }).data
                return Response(error_response, status=status.HTTP_429_TOO_MANY_REQUESTS)

            if 'API key' in error_msg or 'authentication' in error_msg.lower():
                return Response(
                    ChatErrorSerializer({'error': 'Chatbot configuration error. Contact admin.'}).data,
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

            return Response(
                ChatErrorSerializer({
                    'error': 'Failed to generate response. Please try again.',
                    'detail': 'Service temporarily unavailable.'
                }).data,
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )