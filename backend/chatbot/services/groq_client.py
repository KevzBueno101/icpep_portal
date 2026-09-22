import os
import logging

from groq import Groq

logger = logging.getLogger(__name__)


class GroqClient:
    """Groq-powered LLM client for the ICPEP chatbot.

    Uses fast, free LPU-hosted open models. Falls back across a chain
    of models if the primary one is unavailable.
    """

    # Preferred in order. All are on Groq's free developer tier.
    # llama-4-scout supports Tagalog (great for Taglish users) and has the
    # highest free token budget (30k TPM).
    PREFERRED_MODELS = [
        'meta-llama/llama-4-scout-17b-16e-instruct',
        'llama-3.1-8b-instant',
        'openai/gpt-oss-120b',
        'openai/gpt-oss-20b',
    ]

    def __init__(self):
        api_key = os.getenv('GROQ_API_KEY')
        if not api_key:
            raise ValueError('GROQ_API_KEY environment variable is not set')

        self.client = Groq(api_key=api_key, timeout=30, max_retries=1)

        env_model = os.getenv('GROQ_MODEL')
        self.model_name = env_model or self.PREFERRED_MODELS[0]
        logger.info(f'Using Groq model: {self.model_name}')

    def generate_response(self, system_prompt: str, user_message: str) -> str:
        """
        Generate a response from a Groq-hosted model with system prompt and
        user message. Tries fallback models if the primary one fails.
        """
        candidates = list(dict.fromkeys([self.model_name] + self.PREFERRED_MODELS))
        last_error = None

        for model_name in candidates:
            try:
                completion = self.client.chat.completions.create(
                    model=model_name,
                    messages=[
                        {'role': 'system', 'content': system_prompt},
                        {'role': 'user', 'content': user_message},
                    ],
                    temperature=0.7,
                    max_tokens=1024,
                )
                text = completion.choices[0].message.content
                return text.strip() if text else "I couldn't generate a response. Please try again."
            except Exception as e:
                last_error = e
                logger.warning(f'Groq model "{model_name}" failed: {e}')
                error_str = str(e).lower()
                # Skip models that are gone, overloaded, or rate-limited.
                retryable = (
                    '404' in error_str or 'not found' in error_str
                    or 'model_not_found' in error_str
                    or '429' in error_str or 'rate limit' in error_str
                    or '503' in error_str or 'unavailable' in error_str
                    or 'overloaded' in error_str or 'high demand' in error_str
                    or 'not supported' in error_str or 'overloaded_error' in error_str
                )
                if retryable:
                    continue
                break

        logger.error(f'All Groq models failed. Last error: {last_error}')
        raise last_error

    def count_tokens(self, text: str) -> int:
        """Estimate token count for monitoring."""
        return len(text) // 4