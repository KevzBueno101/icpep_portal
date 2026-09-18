import logging
import uuid

import groq
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import ChatRequestSerializer, ChatResponseSerializer, ChatErrorSerializer
from .services.groq_client import GroqClient
from .services.context_builder import build_context, get_session_history, update_session_history
from .throttles import ChatUserMinuteThrottle, ChatUserDailyThrottle

logger = logging.getLogger(__name__)


class ChatAPIView(APIView):
    """
    Chat endpoint for ICPEP chatbot.
    Requires authentication (MEMBERSHIP+ access level).
    Stateless - no DB persistence. Uses in-memory session for multi-turn context.
    """
    permission_classes = [IsAuthenticated]
    throttle_classes = [ChatUserMinuteThrottle, ChatUserDailyThrottle]

    _groq_client = None

    @property
    def groq_client(self):
        # Lazily instantiate once per process instead of once per request
        if ChatAPIView._groq_client is None:
            ChatAPIView._groq_client = GroqClient()
        return ChatAPIView._groq_client

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

            # Call the LLM (Groq)
            response_text = self.groq_client.generate_response(context, message)

            # Update session history (in-memory)
            update_session_history(session_id, message, response_text)

            # Log token usage (for monitoring)
            tokens_estimated = self.groq_client.count_tokens(context + message + response_text)
            logger.info(f'Chatbot: user={user.email} session={session_id} tokens~={tokens_estimated}')

            return Response(ChatResponseSerializer({
                'response': response_text,
                'session_id': session_id
            }).data)

        except ValueError as e:
            # Raised by GroqClient.__init__ when GROQ_API_KEY is missing
            logger.exception(f'Chatbot client config error: {e}')
            return Response(
                ChatErrorSerializer({'error': 'Chatbot configuration error. Contact admin.'}).data,
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        except groq.RateLimitError as e:
            logger.exception(f'Chatbot rate limit for user={user.email}: {e}')
            return Response(
                ChatErrorSerializer({
                    'error': 'Rate limit exceeded. Please try again later.',
                    'detail': 'AI service quota exceeded.',
                    'retry_after': 60
                }).data,
                status=status.HTTP_429_TOO_MANY_REQUESTS
            )

        except (groq.APIConnectionError, groq.APITimeoutError) as e:
            logger.exception(f'Chatbot connection error for user={user.email}: {e}')
            return Response(
                ChatErrorSerializer({
                    'error': 'Failed to generate response. Please try again.',
                    'detail': 'Service temporarily unavailable.'
                }).data,
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )

        except groq.APIStatusError as e:
            logger.exception(f'Chatbot API error for user={user.email}: {e}')
            return Response(
                ChatErrorSerializer({
                    'error': 'Failed to generate response. Please try again.',
                    'detail': 'AI service error.'
                }).data,
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )

        except Exception as e:
            logger.exception(f'Chatbot error for user={user.email}: {e}')
            error_msg = str(e)

            if '404' in error_msg or 'not found' in error_msg.lower() or 'not supported' in error_msg.lower():
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