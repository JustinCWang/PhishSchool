import json
import os
from functools import lru_cache
from typing import Dict, Iterable, Optional, Sequence, Tuple

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


def score_email(email_summary: str, image_parts: Optional[Sequence[dict]] = None) -> Tuple[int, str]:
    """
    Ask Gemini to score an email for phishing risk.

    Returns a tuple of (score, rationale).
    """
    prompt = (
        "You are a security analyst who labels content for phishing risk. "
        "Given the provided information (which may include parsed email text or visual attachments), "
        "assign a phishing likelihood score between 1 and 100, where 1 means certainly safe and 100 means certainly phishing. "
        "If an image is provided, transcribe relevant text or describe critical visual cues before scoring. "
        "Reply strictly as a compact JSON object with the following schema:\n"
        '{\"score\": <integer>, \"rationale\": \"<concise explanation>\"}.\n'
        "Do not include Markdown, code fences, or any text outside the JSON object. "
        "Keep the rationale to three sentences or fewer.\n\n"
        "If the evidence appears incomplete or inconclusive, set the score to 50 and explain why.\n\n"
        "Content to score:\n"
        f"{email_summary}\n"
    )

    model = _get_model()

    try:
        if image_parts:
            response = model.generate_content([prompt, *image_parts])
        else:
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


def generate_message(
    message_type: str,
    content_type: str,
    difficulty: str = "medium",
    theme: Optional[str] = None,
    custom_prompt: Optional[str] = None
) -> Dict[str, str]:
    """
    Generate a fake email or SMS for training purposes using Gemini AI.
    
    Args:
        message_type: "email" or "sms"
        content_type: "phishing" or "legitimate"
        difficulty: "easy", "medium", or "hard"
        theme: Optional theme like "friend", "job", "offer", "bank", "health", "other"
        custom_prompt: Optional custom instructions
    
    Returns:
        Dictionary with message components
    """
    
    # Build the prompt based on parameters
    prompt_parts = [
        "You are an expert message generator creating training materials for phishing detection education.",
        f"Generate a {content_type} {message_type} with {difficulty} difficulty level."
    ]
    
    if theme:
        prompt_parts.append(f"Theme: {theme}")
    
    if custom_prompt:
        prompt_parts.append(f"Additional requirements: {custom_prompt}")
    
    if content_type == "phishing":
        prompt_parts.extend([
            "Make it realistic but include subtle phishing indicators that security training participants should learn to identify.",
            "Include common phishing tactics like urgency, suspicious links, requests for personal information, or impersonation."
        ])
    else:
        prompt_parts.extend([
            "Make it a legitimate, professional message that would be safe to interact with.",
            "Use proper formatting, legitimate-looking sender, and appropriate content."
        ])
    
    if message_type == "email":
        prompt_parts.extend([
            "Format your response as a JSON object with the following structure:",
            '{"subject": "Email subject line", "sender": "sender@domain.com", "recipient": "recipient@domain.com", "body": "Email body content", "phishing_indicators": ["list", "of", "indicators"], "explanation": "Brief explanation of why this is phishing/legitimate"}',
            "For legitimate emails, set phishing_indicators to null.",
            "Keep the email concise but realistic."
        ])
    else:  # SMS
        prompt_parts.extend([
            "Format your response as a JSON object with the following structure:",
            '{"phone_number": "+1234567890", "contact_name": "Contact Name", "message": "SMS message content", "phishing_indicators": ["list", "of", "indicators"], "explanation": "Brief explanation of why this is phishing/legitimate"}',
            "For legitimate SMS, set phishing_indicators to null.",
            "Keep the SMS message short (under 160 characters) and realistic.",
            "Use realistic phone numbers and contact names appropriate for the theme."
        ])
    
    prompt = "\n".join(prompt_parts)
    
    # Use a different model configuration for generation
    model = _get_generation_model()
    
    max_retries = 3
    for attempt in range(max_retries):
        try:
            response = model.generate_content(prompt)
            response_text = _extract_text(response)
            
            try:
                parsed: Dict[str, str] = json.loads(response_text)
            except json.JSONDecodeError as exc:
                print(f"[ATTEMPT {attempt + 1}] JSON Parse Error: {exc}")
                print(f"[ATTEMPT {attempt + 1}] Gemini Response: {response_text}")
                if attempt == max_retries - 1:
                    raise GeminiClientError(f"Failed to parse JSON after {max_retries} attempts")
                continue
            
            # Clean up null string values
            for key, value in parsed.items():
                if value == "null" or value == "":
                    parsed[key] = None
            
            # Validate required fields based on message type
            validation_error = None
            if message_type == "email":
                required_fields = ["subject", "sender", "recipient", "body"]
                for field in required_fields:
                    if field not in parsed or parsed[field] is None:
                        validation_error = f"Missing required field: {field}"
                        break
            else:  # SMS
                required_fields = ["phone_number", "contact_name", "message"]
                for field in required_fields:
                    if field not in parsed or parsed[field] is None:
                        validation_error = f"Missing required field: {field}"
                        break
            
            if validation_error:
                print(f"[ATTEMPT {attempt + 1}] Validation Error: {validation_error}")
                print(f"[ATTEMPT {attempt + 1}] Parsed Data: {parsed}")
                if attempt == max_retries - 1:
                    raise GeminiClientError(f"Validation failed after {max_retries} attempts: {validation_error}")
                continue
            
            # If we get here, everything is valid
            break
            
        except Exception as exc:
            print(f"[ATTEMPT {attempt + 1}] API Call Error: {exc}")
            if attempt == max_retries - 1:
                raise GeminiClientError(f"Gemini API call failed after {max_retries} attempts: {exc}") from exc
            continue
    
    # Add metadata
    parsed["message_type"] = message_type
    parsed["content_type"] = content_type
    parsed["difficulty"] = difficulty
    parsed["theme"] = theme
    
    return parsed


@lru_cache(maxsize=1)
def _get_generation_model(model_name: str = "models/gemini-flash-latest") -> genai.GenerativeModel:
    """Configure and memoize the Gemini model instance for email generation."""
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise GeminiClientError("GEMINI_API_KEY is not set in the environment.")

    genai.configure(api_key=api_key)
    configured_model = os.getenv("GEMINI_MODEL", model_name)
    max_tokens = int(os.getenv("GEMINI_MAX_OUTPUT_TOKENS", "2000"))
    temperature = float(os.getenv("GEMINI_TEMPERATURE", "0.7"))  # Higher creativity for generation
    return genai.GenerativeModel(
        configured_model,
        generation_config={
            "temperature": temperature,
            "max_output_tokens": max_tokens,
            "response_mime_type": "application/json",
            "response_schema": {
                "type": "object",
                "properties": {
                    "subject": {"type": "string"},
                    "sender": {"type": "string"},
                    "recipient": {"type": "string"},
                    "body": {"type": "string"},
                    "phone_number": {"type": "string"},
                    "contact_name": {"type": "string"},
                    "message": {"type": "string"},
                    "phishing_indicators": {"type": "array", "items": {"type": "string"}},
                    "explanation": {"type": "string"}
                },
                "required": ["phishing_indicators", "explanation"]
            },
        },
    )


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
