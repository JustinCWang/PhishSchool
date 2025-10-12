from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from services.supabase_service import CampaignService
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

class SendPhishingNowRequest(BaseModel):
    user_id: str
    difficulty: Optional[str] = "medium"  # easy | medium | hard
    theme: Optional[str] = None

@router.post("/send-emails")
async def send_scheduled_emails():
    """
    Send all emails that are scheduled to be sent now.
    This endpoint should be called by a cron job or scheduler.
    """
    try:
        campaign_service = CampaignService()
        result = await campaign_service.send_scheduled_emails()
        
        logger.info(f"Email sending completed: {result}")
        return {
            "success": True,
            "message": "Email sending process completed",
            "result": result
        }
        
    except Exception as exc:
        logger.error(f"Error sending scheduled emails: {exc}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to send scheduled emails: {str(exc)}"
        ) from exc

@router.post("/send-test-email")
async def send_test_email():
    """
    Send a test email to verify SendGrid integration is working.
    """
    try:
        from services.email_service import get_email_service
        
        email_service = get_email_service()
        
        # Create a simple test email
        test_email_data = {
            "email_type": "phishing",
            "subject": "Test Email from PhishSchool",
            "sender_email": "test@phishschool.com",
            "recipient_email": "test@example.com",
            "body": "This is a test email to verify SendGrid integration is working correctly.",
            "phishing_indicators": ["Suspicious sender", "Urgent language"],
            "explanation": "This is a test email for verification purposes.",
            "click_tracking_id": "test-tracking-123"
        }
        
        # Send to test recipient
        test_recipient = "test@example.com"  # Change this to your email
        success = await email_service.send_campaign_email(
            email_data=test_email_data,
            recipient_email=test_recipient
        )
        
        if success:
            return {
                "success": True,
                "message": f"Test email sent successfully to {test_recipient}"
            }
        else:
            return {
                "success": False,
                "message": "Failed to send test email"
            }
            
    except Exception as exc:
        logger.error(f"Error sending test email: {exc}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to send test email: {str(exc)}"
        ) from exc

@router.post("/send-phishing-now")
async def send_phishing_now(req: SendPhishingNowRequest):
    """
    Immediately generate and send a phishing email to the specified user.
    The recipient email is looked up from Supabase by user_id.
    """
    try:
        from services.email_service import get_email_service
        from services.gemini_client import generate_message, GeminiClientError
        import os

        svc = CampaignService()
        user_email = await svc.get_user_email(req.user_id)
        if not user_email:
            raise HTTPException(status_code=404, detail="User email not found")

        # Generate a phishing email message
        try:
            message_data = generate_message(
                message_type="email",
                content_type="phishing",
                difficulty=req.difficulty or "medium",
                theme=req.theme,
            )
        except GeminiClientError as exc:  # fallback to a simple static template
            message_data = {
                "subject": "Urgent: Verify Your Account",
                "sender": os.getenv("SENDGRID_FROM_EMAIL", "noreply@phishschool.com"),
                "body": (
                    "We detected unusual activity. Click the link to verify your identity immediately.\n\n"
                    "Failure to act may result in account suspension."
                ),
                "phishing_indicators": [
                    "Urgent language",
                    "Threat of account suspension",
                    "Request to click a link",
                ],
                "explanation": "Uses urgency and threats to coerce action."
            }

        email_service = get_email_service()
        email_data = {
            "email_type": "phishing",
            "subject": message_data.get("subject") or "Security Alert",
            "sender_email": message_data.get("sender") or os.getenv("SENDGRID_FROM_EMAIL", "noreply@phishschool.com"),
            "recipient_email": user_email,
            "body": message_data.get("body") or "Please verify your account.",
            "phishing_indicators": message_data.get("phishing_indicators", []),
            "explanation": message_data.get("explanation", "This is a simulated phishing email."),
            "click_tracking_id": None,
        }

        success = await email_service.send_campaign_email(email_data=email_data, recipient_email=user_email)
        if success:
            logger.info(f"Phishing email sent to user {req.user_id} ({user_email})")
            return {"success": True, "message": f"Email sent to {user_email}"}
        return {"success": False, "message": "Failed to send email"}

    except HTTPException:
        raise
    except Exception as exc:
        logger.error(f"Error sending phishing email now: {exc}")
        raise HTTPException(status_code=500, detail=f"Failed to send phishing email: {exc}")
