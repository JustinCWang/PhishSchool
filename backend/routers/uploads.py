import re
from email import policy
from email.parser import BytesParser
from html import unescape
from typing import Dict, Tuple

from fastapi import APIRouter, File, HTTPException, UploadFile, status
from pydantic import BaseModel

from services.gemini_client import GeminiClientError, score_email


router = APIRouter()

_TAG_RE = re.compile(r"<[^>]+>")
_MAX_BODY_CHARS = 20_000


class EmailMetadata(BaseModel):
    subject: str
    sender: str
    recipient: str
    date: str
    body_preview: str


class EmailAnalysisResponse(BaseModel):
    filename: str
    score: int
    rationale: str
    metadata: EmailMetadata


@router.get("/")
async def get_upload_info():
    """Get information about file upload endpoints"""
    return {
        "message": "File upload endpoint",
        "description": "Upload .eml files for phishing analysis",
        "accepted_formats": [".eml"]
    }


@router.post("/eml", response_model=EmailAnalysisResponse)
async def upload_eml_file(file: UploadFile = File(...)) -> EmailAnalysisResponse:
    """Upload an .eml file, analyze it with Gemini and return a phishing likelihood score."""
    if not file.filename.lower().endswith(".eml"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only .eml files are supported.",
        )

    content = await file.read()
    if not content:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file was empty.",
        )

    try:
        metadata, prompt_payload = _prepare_email_summary(content)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc

    try:
        score, rationale = score_email(prompt_payload)
    except GeminiClientError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(exc),
        ) from exc

    return EmailAnalysisResponse(
        filename=file.filename,
        score=score,
        rationale=rationale,
        metadata=EmailMetadata(**metadata),
    )


def _prepare_email_summary(raw_email: bytes) -> Tuple[Dict[str, str], str]:
    """Parse the uploaded email and extract the pieces we want to analyse."""
    try:
        message = BytesParser(policy=policy.default).parsebytes(raw_email)
    except Exception as exc:
        raise ValueError(f"Could not parse .eml file: {exc}") from exc

    subject = (message.get("Subject") or "").strip()
    sender = (message.get("From") or "").strip()
    recipient = (message.get("To") or "").strip()
    date = (message.get("Date") or "").strip()
    body = _extract_email_body(message)

    summary_lines = [
        f"Subject: {subject or '(none)'}",
        f"From: {sender or '(unknown sender)'}",
        f"To: {recipient or '(unknown recipient)'}",
        f"Date: {date or '(unknown date)'}",
        "Body:",
        body[:_MAX_BODY_CHARS],
    ]
    summary = "\n".join(summary_lines)

    # Clean the body preview - strip HTML if present
    clean_preview = body[:500].strip()
    if clean_preview.startswith("<"):
        clean_preview = _strip_html(clean_preview)
    
    metadata = {
        "subject": subject,
        "sender": sender,
        "recipient": recipient,
        "date": date,
        "body_preview": clean_preview.strip(),
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
        
        # Check if it's HTML and strip tags if needed
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
