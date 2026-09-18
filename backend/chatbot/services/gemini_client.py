import os
import logging

from google import genai
from google.genai import types

logger = logging.getLogger(__name__)


class GeminiClient:
    """Gemini client that auto-discovers the best available flash model."""

    # Preferred in order. The API frequently deprecates old names, so we
    # discover what's actually available instead of hard-coding a name.
    PREFERRED_MODELS = [
        'gemini-3.6-flash',
        'gemini-3.5-flash',
        'gemini-3-flash',
        'gemini-2.5-flash',
        'gemini-2.0-flash',
        'gemini-1.5-flash',
    ]

    def __init__(self):
        api_key = os.getenv('GEMINI_API_KEY')
        if not api_key:
            raise ValueError('GEMINI_API_KEY environment variable is not set')

        # Disable SDK built-in async retries (they make requests hang long
        # enough for Render to kill the instance) and set a sane timeout.
        self.client = genai.Client(
            api_key=api_key,
            http_options=types.HttpOptions(timeout=30_000, do_not_retry=True),
        )

        env_model = os.getenv('GEMINI_MODEL')
        self.model_name = env_model or self._discover_model()
        logger.info(f'Using Gemini model: {self.model_name}')

    def _discover_model(self) -> str:
        """Query ListModels and pick the first preferred name that exists."""
        try:
            available = {m.name for m in self.client.models.list()}
            logger.info(f'Available Gemini models: {sorted(available)}')
            for name in self.PREFERRED_MODELS:
                fq = name if name.startswith('models/') else f'models/{name}'
                if fq in available:
                    return name
        except Exception as e:
            logger.warning(f'Model discovery failed, using default: {e}')
        return self.PREFERRED_MODELS[0]

    def generate_response(self, system_prompt: str, user_message: str) -> str:
        """
        Generate a response from Gemini with system prompt and user message.
        Tries fallback models if the primary one fails.
        """
        candidates = list(dict.fromkeys([self.model_name] + self.PREFERRED_MODELS))
        last_error = None

        for model_name in candidates:
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
                # Skip models that are gone or unavailable; keep trying.
                if ('404' in error_str or 'not found' in error_str or 'not supported' in error_str
                        or '503' in error_str or 'unavailable' in error_str or 'overloaded' in error_str
                        or 'high demand' in error_str or '429' in error_str or 'resource exhausted' in error_str):
                    continue
                break

        logger.error(f'All Gemini models failed. Last error: {last_error}')
        raise last_error

    def count_tokens(self, text: str) -> int:
        """Estimate token count for monitoring."""
        return len(text) // 4