from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import RedirectResponse
from datetime import datetime
import uuid
from services.supabase_service import TrackingService

router = APIRouter()
tracking_service = TrackingService()

@router.get("/track/{tracking_id}")
async def handle_email_click(tracking_id: str, request: Request):
    """Handle email click tracking and redirect appropriately"""
    try:
        # Record the click and get email data
        email_data = await tracking_service.record_email_click(
            tracking_id, 
            request.client.host, 
            request.headers.get("user-agent", "")
        )
        
        if not email_data:
            return RedirectResponse(url="/error?message=Invalid tracking link")
        
        # Check if this was a phishing email
        if email_data["email_type"] == "phishing":
            # Redirect to phishing warning page
            return RedirectResponse(
                url=f"/phishing-warning?campaign_id={email_data['campaign_id']}&email_id={email_data['id']}&tracking_id={tracking_id}"
            )
        else:
            # Redirect to legitimate content or success page
            return RedirectResponse(
                url=f"/legitimate-content?campaign_id={email_data['campaign_id']}&email_id={email_data['id']}"
            )
    except Exception as exc:
        return RedirectResponse(url="/error?message=Tracking error")

@router.get("/track/stats/{tracking_id}")
async def get_tracking_stats(tracking_id: str):
    """Get tracking statistics for a specific email"""
    try:
        stats = await tracking_service.get_tracking_stats(tracking_id)
        
        if not stats:
            raise HTTPException(status_code=404, detail="Tracking ID not found")
        
        return stats
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch tracking stats: {str(exc)}"
        ) from exc

@router.post("/track/phish-report")
async def report_phishing_attempt(request: Request):
    """Report a phishing attempt (for analytics)"""
    try:
        data = await request.json()
        tracking_id = data.get("tracking_id")
        
        if not tracking_id:
            raise HTTPException(status_code=400, detail="Invalid tracking ID")
        
        # This would update tracking data with phishing report
        # Implementation depends on your analytics needs
        
        return {"message": "Phishing attempt reported successfully"}
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to report phishing attempt: {str(exc)}"
        ) from exc