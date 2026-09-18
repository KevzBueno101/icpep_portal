import os
import logging
from typing import Optional

from google import genai
from google.genai import types

logger = logging.getLogger(__name__)


class GeminiClient:
    DEFAULT_MODEL = 'gemini-1.5-flash'
    FALLBACK_MODELS = ['gemini-1.5-flash', 'gemini-2.0-flash', 'gemini-3.6-flash']

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
        
        # Deduplicate while preserving order
        tried = set()
        for model_name in [self.model_name] + self.FALLBACK_MODELS:
            if model_name in tried:
                continue
            tried.add(model_name)
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
                error_str = str(e).lower()
                # Continue to next model on: model not found, overloaded, or unavailable
                if ('404' in error_str or 'not found' in error_str or 'not supported' in error_str 
                    or '503' in error_str or 'unavailable' in error_str or 'overloaded' in error_str 
                    or 'high demand' in error_str):
                    continue
                break
        
        logger.error(f'All Gemini models failed. Last error: {last_error}')
        raise last_error

    def count_tokens(self, text: str) -> int:
        """Estimate token count for monitoring."""
        return len(text) // 4