import mimetypes
import re
from email import policy
from email.parser import BytesParser
from html import unescape
from typing import Dict, List, Optional, Tuple

from fastapi import APIRouter, File, HTTPException, UploadFile, status
from pydantic import BaseModel

from services.gemini_client import GeminiClientError, score_email


router = APIRouter()

_TAG_RE = re.compile(r"<[^>]+>")
_MAX_BODY_CHARS = 2_800
_TRIM_NOTICE = "\n\n--- content trimmed for analysis ---\n\n"
_QUOTE_SPLIT_RE = re.compile(r"\nOn .*?wrote:\n", re.IGNORECASE | re.DOTALL)
_ALLOWED_IMAGE_TYPES = {
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/webp",
    "image/gif",
}


class EmailMetadata(BaseModel):
    subject: Optional[str] = None
    sender: Optional[str] = None
    recipient: Optional[str] = None
    date: Optional[str] = None
    body_preview: Optional[str] = None
    attachment_type: str
    content_type: Optional[str] = None


class EmailAnalysisResponse(BaseModel):
    filename: str
    score: int
    rationale: str
    metadata: EmailMetadata


@router.get("/")
async def get_upload_info():
    """Get information about file upload endpoints."""
    return {
        "message": "File upload endpoint",
        "description": "Upload .eml files or images for phishing analysis",
        "accepted_formats": [".eml", ".png", ".jpg", ".jpeg", ".webp", ".gif"],
    }


@router.post("/eml", response_model=EmailAnalysisResponse)
async def upload_eml_file(file: UploadFile = File(...)) -> EmailAnalysisResponse:
    """Upload an .eml file or image, analyze it with Gemini and return a phishing likelihood score."""

    content = await file.read()
    if not content:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file was empty.",
        )

    filename = file.filename or "uploaded-file"
    suffix = filename.lower()
    content_type = file.content_type or mimetypes.guess_type(filename)[0]

    is_eml = suffix.endswith(".eml") or content_type == "message/rfc822"
    is_image = (
        (content_type in _ALLOWED_IMAGE_TYPES)
        or any(suffix.endswith(ext) for ext in (".png", ".jpg", ".jpeg", ".webp", ".gif"))
    )

    if not (is_eml or is_image):
        accepted = ["*.eml"] + sorted({f"*.{mime.split('/')[-1]}" for mime in _ALLOWED_IMAGE_TYPES})
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file type. Accepted formats: {', '.join(accepted)}",
        )

    try:
        if is_eml:
            metadata, prompt_payload = _prepare_email_summary(content)
            image_parts: Optional[List[dict]] = None
        else:
            metadata, prompt_payload, image_parts = _prepare_image_payload(
                filename, content_type or "application/octet-stream", content
            )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc

    try:
        score, rationale = score_email(prompt_payload, image_parts=image_parts)
    except GeminiClientError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(exc),
        ) from exc

    return EmailAnalysisResponse(
        filename=filename,
        score=score,
        rationale=rationale,
        metadata=EmailMetadata(**metadata),
    )


def _prepare_email_summary(raw_email: bytes) -> Tuple[Dict[str, Optional[str]], str]:
    """Parse the uploaded email and extract the pieces we want to analyse."""
    try:
        message = BytesParser(policy=policy.default).parsebytes(raw_email)
    except Exception as exc:
        raise ValueError(f"Could not parse .eml file: {exc}") from exc

    subject = (message.get("Subject") or "").strip() or None
    sender = (message.get("From") or "").strip() or None
    recipient = (message.get("To") or "").strip() or None
    date = (message.get("Date") or "").strip() or None
    body = _extract_email_body(message)
    condensed_body = _condense_body(body)

    summary_lines = [
        f"Subject: {subject or '(none)'}",
        f"From: {sender or '(unknown sender)'}",
        f"To: {recipient or '(unknown recipient)'}",
        f"Date: {date or '(unknown date)'}",
        "Body:",
        condensed_body,
    ]
    summary = "\n".join(summary_lines)

    clean_preview = condensed_body[:500].strip()
    if clean_preview.startswith("<"):
        clean_preview = _strip_html(clean_preview)

    metadata: Dict[str, Optional[str]] = {
        "subject": subject,
        "sender": sender,
        "recipient": recipient,
        "date": date,
        "body_preview": clean_preview or None,
        "attachment_type": "eml",
        "content_type": "message/rfc822",
    }

    return metadata, summary


def _extract_email_body(message) -> str:
    """Return a clean text representation of the email body."""
    if message.is_multipart():
        candidates = []
        html_fallback = []
        for part in message.walk():
            content_disposition = part.get_content_disposition()
            if content_disposition not in (None, "inline"):
                continue
            content_type = part.get_content_type()
            try:
                payload = part.get_content()
            except Exception:
                payload = part.get_payload(decode=True)
            payload_text = _coerce_to_text(payload)
            if not payload_text:
                continue
            if content_type == "text/plain":
                candidates.append(payload_text.strip())
            elif content_type == "text/html":
                html_fallback.append(_strip_html(payload_text))

        if candidates:
            return "\n\n".join(candidates).strip()
        if html_fallback:
            return "\n\n".join(html_fallback).strip()
    else:
        try:
            content = _coerce_to_text(message.get_content()).strip()
        except Exception:
            payload = message.get_payload(decode=True)
            content = _coerce_to_text(payload).strip()

        content_type = message.get_content_type()
        if content_type == "text/html" or content.strip().startswith("<"):
            return _strip_html(content)
        return content

    return "(no readable body content found)"


def _coerce_to_text(payload) -> str:
    """Convert email payloads into text."""
    if payload is None:
        return ""
    if isinstance(payload, bytes):
        return payload.decode("utf-8", errors="ignore")
    return str(payload)


def _strip_html(html: str) -> str:
    """Remove HTML tags and collapse whitespace."""
    without_tags = _TAG_RE.sub(" ", unescape(html))
    return " ".join(without_tags.split())


def _condense_body(body: str) -> str:
    """Trim long threads and quoted replies to keep the LLM prompt compact."""
    text = body.strip()
    if not text:
        return "(no readable body content found)"

    segments = _QUOTE_SPLIT_RE.split(text)
    primary = segments[0].strip()
    remainder = "\n".join(segment.strip() for segment in segments[1:] if segment.strip())

    if len(primary) > _MAX_BODY_CHARS:
        head = primary[: int(_MAX_BODY_CHARS * 0.75)].rstrip()
        tail = primary[-int(_MAX_BODY_CHARS * 0.25):].lstrip()
        return f"{head}{_TRIM_NOTICE}{tail}"

    condensed = primary

    if remainder:
        available = max(0, _MAX_BODY_CHARS - len(condensed))
        if available > len(_TRIM_NOTICE) + 300:
            tail_snippet = remainder[: available - len(_TRIM_NOTICE)].strip()
            if tail_snippet:
                condensed = f"{condensed}{_TRIM_NOTICE}{tail_snippet}"

    if len(condensed) > _MAX_BODY_CHARS:
        head = condensed[: int(_MAX_BODY_CHARS * 0.75)].rstrip()
        tail = condensed[-int(_MAX_BODY_CHARS * 0.25):].lstrip()
        condensed = f"{head}{_TRIM_NOTICE}{tail}"

    return condensed


def _prepare_image_payload(
    filename: str, content_type: str, content: bytes
) -> Tuple[Dict[str, Optional[str]], str, List[dict]]:
    """Prepare metadata and prompt payload for image attachments."""
    if content_type not in _ALLOWED_IMAGE_TYPES:
        guessed_type = mimetypes.guess_type(filename)[0]
        if guessed_type in _ALLOWED_IMAGE_TYPES:
            content_type = guessed_type
        else:
            raise ValueError("Unsupported image format.")

    metadata: Dict[str, Optional[str]] = {
        "subject": None,
        "sender": None,
        "recipient": None,
        "date": None,
        "body_preview": f"Image uploaded for analysis ({content_type}, {len(content)} bytes).",
        "attachment_type": "image",
        "content_type": content_type,
    }

    prompt = (
        "The user uploaded an image that may contain phishing or scam content (for example a screenshot of an email, text message, QR code, or social post). "
        "Inspect the visual and textual cues in the image to determine phishing likelihood. "
        "If text is present, transcribe the key parts before scoring. "
        "Return JSON with score (1-100) and rationale.\n"
        f"Filename: {filename}\n"
        f"Content type: {content_type}\n"
        f"File size: {len(content)} bytes\n"
    )

    image_parts = [{"mime_type": content_type, "data": content}]

    return metadata, prompt, image_parts
