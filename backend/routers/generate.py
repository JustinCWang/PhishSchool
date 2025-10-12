"""Endpoints for generating training messages via Gemini.

Supports structured phishing or legitimate content for email/SMS,
including sample and random variations.
"""

from typing import Dict, List, Optional
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from services.gemini_client import GeminiClientError, generate_message

router = APIRouter()


class MessageGenerationRequest(BaseModel):
    """Request payload describing what kind of training message to generate.

    Attributes:
        message_type: Either "email" or "sms".
        content_type: Either "phishing" or "legitimate".
        difficulty: Difficulty level guiding realism and subtlety.
        theme: Optional theme cue (e.g., bank, job, health).
        custom_prompt: Optional extra instructions for generation.
    """
    message_type: str  # "email" or "sms"
    content_type: str  # "phishing" or "legitimate"
    difficulty: Optional[str] = "medium"  # "easy", "medium", "hard"
    theme: Optional[str] = None  # "friend", "job", "offer", "bank", "health", "other"
    custom_prompt: Optional[str] = None


class GeneratedMessageResponse(BaseModel):
    """Response model returned from the generation endpoints.

    Contains email- or SMS-specific fields depending on `message_type`,
    along with phishing indicators and a brief explanation.
    """
    message_type: str  # "email" or "sms"
    content_type: str  # "phishing" or "legitimate"
    difficulty: str
    theme: Optional[str]
    
    # Email fields
    subject: Optional[str] = None
    sender: Optional[str] = None
    recipient: Optional[str] = None
    body: Optional[str] = None
    
    # SMS fields
    phone_number: Optional[str] = None
    contact_name: Optional[str] = None
    message: Optional[str] = None
    
    # Common fields
    phishing_indicators: Optional[List[str]] = None
    explanation: Optional[str] = None


@router.get("/")
async def get_generation_info():
    """Get information about message generation endpoints"""
    return {
        "message": "Message generation endpoint",
        "description": "Generate fake phishing or legitimate emails/SMS for training purposes",
        "supported_message_types": ["email", "sms"],
        "supported_content_types": ["phishing", "legitimate"],
        "difficulty_levels": ["easy", "medium", "hard"],
        "themes": ["friend", "job", "offer", "bank", "health", "other"]
    }


@router.post("/message", response_model=GeneratedMessageResponse)
async def generate_training_message(request: MessageGenerationRequest) -> GeneratedMessageResponse:
    """Generate a fake email or SMS for training purposes using Gemini AI."""
    
    # Validate message type
    if request.message_type not in ["email", "sms"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="message_type must be either 'email' or 'sms'"
        )
    
    # Validate content type
    if request.content_type not in ["phishing", "legitimate"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="content_type must be either 'phishing' or 'legitimate'"
        )
    
    # Validate difficulty level
    if request.difficulty not in ["easy", "medium", "hard"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="difficulty must be 'easy', 'medium', or 'hard'"
        )
    
    try:
        generated_message = generate_message(
            message_type=request.message_type,
            content_type=request.content_type,
            difficulty=request.difficulty,
            theme=request.theme,
            custom_prompt=request.custom_prompt
        )
    except GeminiClientError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(exc)
        ) from exc
    
    return GeneratedMessageResponse(**generated_message)


@router.post("/random", response_model=GeneratedMessageResponse)
async def generate_random_message():
    """Generate a random message with random type, theme, and content type."""
    import random
    
    message_types = ["email", "sms"]
    content_types = ["phishing", "legitimate"]
    difficulties = ["easy", "medium", "hard"]
    themes = ["friend", "job", "offer", "bank", "health", "other"]
    
    # Randomly select parameters
    message_type = random.choice(message_types)
    content_type = random.choice(content_types)
    difficulty = random.choice(difficulties)
    theme = random.choice(themes)
    
    try:
        generated_message = generate_message(
            message_type=message_type,
            content_type=content_type,
            difficulty=difficulty,
            theme=theme
        )
    except GeminiClientError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(exc)
        ) from exc
    
    return GeneratedMessageResponse(**generated_message)


@router.get("/sample-phishing")
async def get_sample_phishing_message():
    """Get a sample phishing message for demonstration purposes."""
    try:
        generated_message = generate_message(
            message_type="email",
            content_type="phishing",
            difficulty="medium",
            theme="bank"
        )
        return GeneratedMessageResponse(**generated_message)
    except GeminiClientError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(exc)
        ) from exc


@router.get("/sample-legitimate")
async def get_sample_legitimate_message():
    """Get a sample legitimate message for demonstration purposes."""
    try:
        generated_message = generate_message(
            message_type="email",
            content_type="legitimate",
            difficulty="medium",
            theme="job"
        )
        return GeneratedMessageResponse(**generated_message)
    except GeminiClientError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(exc)
        ) from exc
