import json
import os
from functools import lru_cache
from typing import Dict, Iterable, Tuple

from dotenv import load_dotenv
import google.generativeai as genai


load_dotenv()


class GeminiClientError(RuntimeError):
    """Raised when the Gemini API cannot produce a usable response."""


@lru_cache(maxsize=1)
def _get_model(model_name: str = "models/gemini-flash-latest") -> genai.GenerativeModel:
    """Configure and memoize the Gemini model instance."""
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise GeminiClientError("GEMINI_API_KEY is not set in the environment.")

    genai.configure(api_key=api_key)
    configured_model = os.getenv("GEMINI_MODEL", model_name)
    max_tokens = int(os.getenv("GEMINI_MAX_OUTPUT_TOKENS", "800"))
    temperature = float(os.getenv("GEMINI_TEMPERATURE", "0.2"))
    return genai.GenerativeModel(
        configured_model,
        generation_config={
            "temperature": temperature,
            "max_output_tokens": max_tokens,
            "response_mime_type": "application/json",
            "response_schema": {
                "type": "object",
                "properties": {
                    "score": {"type": "integer"},
                    "rationale": {"type": "string"},
                },
                "required": ["score", "rationale"],
            },
        },
    )


def score_email(email_summary: str) -> Tuple[int, str]:
    """
    Ask Gemini to score an email for phishing risk.

    Returns a tuple of (score, rationale).
    """
    prompt = (
        "You are a security analyst who labels emails for phishing risk. "
        "Given the email metadata and body below, assign a phishing likelihood score "
        "between 1 and 100, where 1 means certainly safe and 100 means certainly phishing. "
        "Reply strictly as a compact JSON object with the following schema:\n"
        '{\"score\": <integer>, \"rationale\": \"<concise explanation>\"}.\n'
        "Do not include Markdown, code fences, or any text outside the JSON object. "
        "Keep the rationale to three sentences or fewer.\n\n"
        "If the email appears incomplete or you cannot decide, set the score to 50 and explain why.\n\n"
        "Email to score:\n"
        f"{email_summary}\n"
    )

    model = _get_model()

    try:
        response = model.generate_content(prompt)
    except Exception as exc:
        raise GeminiClientError(f"Gemini API call failed: {exc}") from exc

    response_text = _extract_text(response)
    try:
        parsed: Dict[str, str] = json.loads(response_text)
    except json.JSONDecodeError as exc:
        raise GeminiClientError(
            f"Gemini response was not valid JSON: {response_text}"
        ) from exc

    try:
        score = int(parsed["score"])
        rationale = str(parsed["rationale"]).strip()
    except (KeyError, TypeError, ValueError) as exc:
        raise GeminiClientError(
            f"Gemini response did not include the expected fields: {parsed}"
        ) from exc

    score = max(1, min(score, 100))
    if not rationale:
        raise GeminiClientError("Gemini response rationale was empty.")

    return score, rationale


def _extract_text(response) -> str:
    """Collect text parts from the first usable candidate."""
    candidates = getattr(response, "candidates", None) or []
    for candidate in candidates:
        parts: Iterable = getattr(candidate, "content", None)
        if not parts:
            continue
        parts = getattr(parts, "parts", [])
        text_chunks = [
            getattr(part, "text", "")
            for part in parts
            if getattr(part, "text", "").strip()
        ]
        if text_chunks:
            return "\n".join(text_chunks).strip()

    finish_reasons = [getattr(c, "finish_reason", None) for c in candidates]
    raise GeminiClientError(
        "Gemini returned no usable text parts."
        + (f" Finish reasons: {finish_reasons}" if finish_reasons else "")
    )
