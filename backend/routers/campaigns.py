from typing import List, Optional
from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel
from datetime import datetime, timedelta
import uuid
import random
from services.gemini_client import generate_message, GeminiClientError
from services.supabase_service import CampaignService

router = APIRouter()
campaign_service = CampaignService()

# Pydantic models for API
class CampaignCreateRequest(BaseModel):
    name: str
    email_frequency: str = "weekly"  # daily, weekly, monthly
    difficulty_level: str = "medium"  # easy, medium, hard
    preferred_themes: List[str] = ["bank", "job", "friend"]
    email_count: int = 10
    duration_days: int = 30

class CampaignResponse(BaseModel):
    id: str
    name: str
    status: str
    email_frequency: str
    difficulty_level: str
    preferred_themes: List[str]
    email_count: int
    duration_days: int
    created_at: datetime
    emails_sent: int = 0
    emails_clicked: int = 0
    phishing_caught: int = 0

class CampaignEmailResponse(BaseModel):
    id: str
    email_type: str
    subject: str
    sender_email: str
    recipient_email: str
    scheduled_send_time: datetime
    sent_at: Optional[datetime] = None
    clicked_at: Optional[datetime] = None

class CampaignStatsResponse(BaseModel):
    total_campaigns: int
    active_campaigns: int
    total_emails_sent: int
    total_emails_clicked: int
    phishing_detection_rate: float
    click_rate: float

@router.post("/create", response_model=CampaignResponse)
async def create_campaign(request: CampaignCreateRequest, user_id: str = "mock_user"):
    """Create a new phishing simulation campaign"""
    try:
        campaign_data = {
            "name": request.name,
            "email_frequency": request.email_frequency,
            "difficulty_level": request.difficulty_level,
            "preferred_themes": request.preferred_themes,
            "email_count": request.email_count,
            "duration_days": request.duration_days
        }
        
        campaign = await campaign_service.create_campaign(user_id, campaign_data)
        
        return CampaignResponse(
            id=campaign["id"],
            name=campaign["name"],
            status=campaign["status"],
            email_frequency=campaign["email_frequency"],
            difficulty_level=campaign["difficulty_level"],
            preferred_themes=campaign["preferred_themes"],
            email_count=campaign["email_count"],
            duration_days=campaign["duration_days"],
            created_at=campaign["created_at"],
            emails_sent=campaign.get("emails_sent", 0),
            emails_clicked=campaign.get("emails_clicked", 0),
            phishing_caught=campaign.get("phishing_caught", 0)
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create campaign: {str(exc)}"
        ) from exc

@router.get("/user/{user_id}", response_model=List[CampaignResponse])
async def get_user_campaigns(user_id: str):
    """Get all campaigns for a user"""
    try:
        campaigns = await campaign_service.get_user_campaigns(user_id)
        
        return [
            CampaignResponse(
                id=campaign["id"],
                name=campaign["name"],
                status=campaign["status"],
                email_frequency=campaign["email_frequency"],
                difficulty_level=campaign["difficulty_level"],
                preferred_themes=campaign["preferred_themes"],
                email_count=campaign["email_count"],
                duration_days=campaign["duration_days"],
                created_at=campaign["created_at"],
                emails_sent=campaign.get("emails_sent", 0),
                emails_clicked=campaign.get("emails_clicked", 0),
                phishing_caught=campaign.get("phishing_caught", 0)
            )
            for campaign in campaigns
        ]
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch campaigns: {str(exc)}"
        ) from exc

@router.get("/{campaign_id}/emails", response_model=List[CampaignEmailResponse])
async def get_campaign_emails(campaign_id: str):
    """Get all emails for a campaign"""
    try:
        emails = await campaign_service.get_campaign_emails(campaign_id)
        
        return [
            CampaignEmailResponse(
                id=email["id"],
                email_type=email["email_type"],
                subject=email["subject"],
                sender_email=email["sender_email"],
                recipient_email=email["recipient_email"],
                scheduled_send_time=email["scheduled_send_time"],
                sent_at=email["sent_at"],
                clicked_at=email["clicked_at"]
            )
            for email in emails
        ]
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch campaign emails: {str(exc)}"
        ) from exc

@router.put("/{campaign_id}/pause")
async def pause_campaign(campaign_id: str):
    """Pause a campaign"""
    try:
        success = await campaign_service.pause_campaign(campaign_id)
        if not success:
            raise HTTPException(status_code=404, detail="Campaign not found")
        
        return {"message": "Campaign paused successfully"}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to pause campaign: {str(exc)}"
        ) from exc

@router.put("/{campaign_id}/resume")
async def resume_campaign(campaign_id: str):
    """Resume a paused campaign"""
    try:
        success = await campaign_service.resume_campaign(campaign_id)
        if not success:
            raise HTTPException(status_code=404, detail="Campaign not found")
        
        return {"message": "Campaign resumed successfully"}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to resume campaign: {str(exc)}"
        ) from exc

@router.delete("/{campaign_id}")
async def delete_campaign(campaign_id: str):
    """Delete a campaign and all its emails"""
    try:
        success = await campaign_service.delete_campaign(campaign_id)
        if not success:
            raise HTTPException(status_code=404, detail="Campaign not found")
        
        return {"message": "Campaign deleted successfully"}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete campaign: {str(exc)}"
        ) from exc

@router.get("/{campaign_id}/stats", response_model=CampaignStatsResponse)
async def get_campaign_stats(campaign_id: str):
    """Get detailed statistics for a campaign"""
    try:
        stats = await campaign_service.get_campaign_stats(campaign_id)
        
        # Calculate rates
        click_rate = (stats["emails_clicked"] / stats["emails_sent"] * 100) if stats["emails_sent"] > 0 else 0
        phishing_detection_rate = 0  # This would need more complex calculation
        
        return CampaignStatsResponse(
            total_campaigns=1,
            active_campaigns=1,  # This would need to be determined from campaign status
            total_emails_sent=stats["emails_sent"],
            total_emails_clicked=stats["emails_clicked"],
            phishing_detection_rate=phishing_detection_rate,
            click_rate=click_rate
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch campaign stats: {str(exc)}"
        ) from exc