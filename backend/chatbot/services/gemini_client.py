import os
import logging
from typing import Optional

from google import genai
from google.genai import types

logger = logging.getLogger(__name__)


class GeminiClient:
    DEFAULT_MODEL = 'gemini-2.5-flash'
    FALLBACK_MODELS = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash']

    def __init__(self):
        api_key = os.getenv('GEMINI_API_KEY')
        if not api_key:
            raise ValueError('GEMINI_API_KEY environment variable is not set')
        
        self.client = genai.Client(api_key=api_key)
        
        model_name = os.getenv('GEMINI_MODEL', self.DEFAULT_MODEL)
        self.model_name = model_name
        self._current_model_index = 0

    def generate_response(self, system_prompt: str, user_message: str) -> str:
        """
        Generate a response from Gemini with system prompt and user message.
        Tries fallback models if the primary one fails.
        """
        last_error = None
        
        for model_name in [self.model_name] + self.FALLBACK_MODELS:
            if model_name in [m for m in [self.model_name] + self.FALLBACK_MODELS if m != self.model_name]:
                continue
            try:
                response = self.client.models.generate_content(
                    model=model_name,
                    contents=user_message,
                    config=types.GenerateContentConfig(
                        system_instruction=system_prompt,
                        temperature=0.7,
                        max_output_tokens=1024,
                    ),
                )
                return response.text.strip() if response.text else "I couldn't generate a response. Please try again."
            except Exception as e:
                last_error = e
                logger.warning(f'Gemini model "{model_name}" failed: {e}')
                if '404' in str(e) or 'not found' in str(e).lower() or 'not supported' in str(e).lower():
                    continue
                break
        
        logger.error(f'All Gemini models failed. Last error: {last_error}')
        raise last_error

    def count_tokens(self, text: str) -> int:
        """Estimate token count for monitoring."""
        return len(text) // 4