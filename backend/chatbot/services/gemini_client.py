import os
import logging
from typing import Optional

import google.generativeai as genai
from google.api_core.exceptions import ResourceExhausted, GoogleAPICallError

logger = logging.getLogger(__name__)


class GeminiClient:
    def __init__(self):
        api_key = os.getenv('GEMINI_API_KEY')
        if not api_key:
            raise ValueError('GEMINI_API_KEY environment variable is not set')
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel('gemini-1.5-flash-latest')

    def generate_response(self, system_prompt: str, user_message: str) -> str:
        """
        Generate a response from Gemini with system prompt and user message.
        Returns the response text or raises an exception.
        """
        try:
            chat = self.model.start_chat(history=[])
            full_prompt = f"{system_prompt}\n\nUser: {user_message}"
            response = chat.send_message(full_prompt)
            return response.text.strip() if response.text else "I couldn't generate a response. Please try again."
        except ResourceExhausted as e:
            logger.warning(f'Gemini rate limit exceeded: {e}')
            raise
        except GoogleAPICallError as e:
            logger.error(f'Gemini API error: {e}')
            raise
        except Exception as e:
            logger.exception(f'Unexpected error calling Gemini: {e}')
            raise

    def count_tokens(self, text: str) -> int:
        """Estimate token count for monitoring."""
        return len(text) // 4