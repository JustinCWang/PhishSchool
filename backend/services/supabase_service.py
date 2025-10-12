from supabase import create_client, Client
import os
import logging
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import uuid
import random
from services.gemini_client import generate_message, GeminiClientError
from services.email_service import get_email_service

# Initialize Supabase client
def get_supabase_client() -> Client:
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")  # Use service role key for backend
    
    if not supabase_url or not supabase_key:
        raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set")

    # Some environments inject proxy-related env vars that older SDKs don't support,
    # causing: Client.__init__() got an unexpected keyword argument 'proxy'.
    # We handle this gracefully by retrying without proxy env vars if that error occurs.
    try:
        return create_client(supabase_url, supabase_key)
    except TypeError as exc:
        if "unexpected keyword argument 'proxy'" in str(exc):
            # Clear proxy env vars and retry once
            proxy_vars = [
                "HTTP_PROXY", "http_proxy",
                "HTTPS_PROXY", "https_proxy",
                "ALL_PROXY", "all_proxy",
                "NO_PROXY", "no_proxy",
            ]
            cleared = [name for name in proxy_vars if os.environ.pop(name, None) is not None]
            logging.getLogger(__name__).warning(
                "Supabase client init failed due to proxy kw; cleared env vars and retrying: %s",
                ", ".join(cleared) or "none",
            )
            return create_client(supabase_url, supabase_key)
        raise

# Database operations for campaigns
class CampaignService:
    def __init__(self):
        self.supabase = get_supabase_client()
    
    async def create_campaign(self, user_id: str, campaign_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new campaign in Supabase"""
        campaign_id = str(uuid.uuid4())
        
        campaign = {
            "id": campaign_id,
            "user_id": user_id,
            "name": campaign_data["name"],
            "status": "active",
            "email_frequency": campaign_data["email_frequency"],
            "difficulty_level": campaign_data["difficulty_level"],
            "preferred_themes": campaign_data["preferred_themes"],
            "email_count": campaign_data["email_count"],
            "duration_days": campaign_data["duration_days"],
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
        
        result = self.supabase.table("campaigns").insert(campaign).execute()
        
        if result.data:
            # Generate emails for the campaign
            await self.generate_campaign_emails(campaign_id, campaign_data)
            return result.data[0]
        else:
            raise Exception("Failed to create campaign")
    
    async def get_user_campaigns(self, user_id: str) -> List[Dict[str, Any]]:
        """Get all campaigns for a user"""
        result = self.supabase.table("campaigns").select("*").eq("user_id", user_id).execute()
        
        campaigns = []
        for campaign in result.data:
            # Get campaign statistics
            stats = await self.get_campaign_stats(campaign["id"])
            campaign.update(stats)
            campaigns.append(campaign)
        
        return campaigns

    # -------------------- User Preferences --------------------
    async def get_user_preferences(self, user_id: str) -> Dict[str, Any]:
        """Fetch user's email training preferences, falling back to sensible defaults."""
        result = (
            self.supabase
            .table("user_email_preferences")
            .select("*")
            .eq("user_id", user_id)
            .limit(1)
            .execute()
        )
        if result.data:
            return result.data[0]
        # Defaults mirror schema defaults
        return {
            "user_id": user_id,
            "email_frequency": "weekly",
            "difficulty_level": "medium",
            "preferred_themes": ["bank", "job", "friend"],
            "is_active": False,
        }

    async def upsert_user_preferences(
        self,
        user_id: str,
        email_frequency: Optional[str] = None,
        difficulty_level: Optional[str] = None,
        preferred_themes: Optional[List[str]] = None,
        is_active: Optional[bool] = None,
    ) -> Dict[str, Any]:
        """Create or update user preferences."""
        existing = await self.get_user_preferences(user_id)
        payload: Dict[str, Any] = {
            "user_id": user_id,
            "email_frequency": email_frequency or existing.get("email_frequency", "weekly"),
            "difficulty_level": difficulty_level or existing.get("difficulty_level", "medium"),
            "preferred_themes": preferred_themes or existing.get("preferred_themes", ["bank", "job", "friend"]),
            "is_active": existing.get("is_active", False) if is_active is None else is_active,
            "updated_at": datetime.utcnow().isoformat(),
        }
        # Insert or update
        upsert_result = self.supabase.table("user_email_preferences").upsert(payload).execute()
        return upsert_result.data[0] if upsert_result.data else payload

    async def opt_in_user(self, user_id: str, email_frequency: Optional[str] = None) -> Dict[str, Any]:
        """Opt-in a user and create a campaign based on their preferences (frequency-driven)."""
        # Enable preferences
        prefs = await self.upsert_user_preferences(
            user_id=user_id,
            email_frequency=email_frequency,
            is_active=True,
        )

        # Create a campaign tailored to the user's preferences
        campaign_data = {
            "name": f"PhishSchool Training ({prefs['email_frequency']})",
            "email_frequency": prefs["email_frequency"],
            "difficulty_level": prefs["difficulty_level"],
            "preferred_themes": prefs.get("preferred_themes") or ["bank", "job", "friend"],
            # Reasonable defaults; can be adjusted from the frontend later
            "email_count": 10,
            "duration_days": 30,
        }
        campaign = await self.create_campaign(user_id, campaign_data)
        return {"preferences": prefs, "campaign": campaign}

    async def opt_out_user(self, user_id: str) -> Dict[str, Any]:
        """Opt-out a user from receiving training emails."""
        prefs = await self.upsert_user_preferences(user_id=user_id, is_active=False)
        return {"preferences": prefs}
    
    async def get_campaign_emails(self, campaign_id: str) -> List[Dict[str, Any]]:
        """Get all emails for a campaign"""
        result = self.supabase.table("campaign_emails").select("*").eq("campaign_id", campaign_id).execute()
        return result.data
    
    async def pause_campaign(self, campaign_id: str) -> bool:
        """Pause a campaign"""
        result = self.supabase.table("campaigns").update({
            "status": "paused",
            "updated_at": datetime.utcnow().isoformat()
        }).eq("id", campaign_id).execute()
        
        return len(result.data) > 0
    
    async def resume_campaign(self, campaign_id: str) -> bool:
        """Resume a campaign"""
        result = self.supabase.table("campaigns").update({
            "status": "active",
            "updated_at": datetime.utcnow().isoformat()
        }).eq("id", campaign_id).execute()
        
        return len(result.data) > 0
    
    async def delete_campaign(self, campaign_id: str) -> bool:
        """Delete a campaign and all its emails"""
        # Delete campaign emails first
        self.supabase.table("campaign_emails").delete().eq("campaign_id", campaign_id).execute()
        
        # Delete campaign
        result = self.supabase.table("campaigns").delete().eq("id", campaign_id).execute()
        
        return len(result.data) > 0
    
    async def get_campaign_stats(self, campaign_id: str) -> Dict[str, Any]:
        """Get statistics for a campaign"""
        # Get email counts
        emails_result = self.supabase.table("campaign_emails").select("*").eq("campaign_id", campaign_id).execute()
        emails = emails_result.data
        
        emails_sent = sum(1 for email in emails if email.get("sent_at") is not None)
        emails_clicked = sum(1 for email in emails if email.get("clicked_at") is not None)
        phishing_emails = [email for email in emails if email.get("email_type") == "phishing"]
        phishing_clicked = sum(1 for email in phishing_emails if email.get("clicked_at") is not None)
        
        return {
            "emails_sent": emails_sent,
            "emails_clicked": emails_clicked,
            "phishing_caught": len(phishing_emails) - phishing_clicked
        }
    
    async def generate_campaign_emails(self, campaign_id: str, campaign_data: Dict[str, Any]):
        """Generate emails for a campaign using Gemini"""
        from datetime import timedelta
        
        # Calculate send times based on frequency
        start_date = datetime.utcnow()
        send_times = self.calculate_send_times(start_date, campaign_data["email_frequency"], campaign_data["email_count"])
        
        emails_to_insert = []
        
        for i in range(campaign_data["email_count"]):
            try:
                # Generate email using Gemini
                theme = random.choice(campaign_data["preferred_themes"])
                content_type = "phishing" if random.random() < 0.7 else "legitimate"  # 70% phishing
                
                message_data = generate_message(
                    message_type="email",
                    content_type=content_type,
                    difficulty=campaign_data["difficulty_level"],
                    theme=theme
                )
                
                # Create campaign email
                email_id = str(uuid.uuid4())
                
                campaign_email = {
                    "id": email_id,
                    "campaign_id": campaign_id,
                    "email_type": content_type,
                    "subject": message_data["subject"],
                    "sender_email": message_data["sender"],
                    "recipient_email": f"user{campaign_id}@phishschool.com",  # Mock recipient
                    "body": message_data["body"],
                    "phishing_indicators": message_data["phishing_indicators"],
                    "explanation": message_data["explanation"],
                    "scheduled_send_time": send_times[i].isoformat(),
                    "sent_at": None,
                    "clicked_at": None,
                    "created_at": datetime.utcnow().isoformat()
                }
                
                emails_to_insert.append(campaign_email)
                
            except GeminiClientError as exc:
                print(f"Failed to generate email {i+1} for campaign {campaign_id}: {exc}")
                continue
        
        # Insert all emails at once
        if emails_to_insert:
            self.supabase.table("campaign_emails").insert(emails_to_insert).execute()
    
    def calculate_send_times(self, start_date: datetime, frequency: str, count: int) -> List[datetime]:
        """Calculate when to send each email based on frequency"""
        send_times = []
        
        if frequency == "daily":
            interval = timedelta(days=1)
        elif frequency == "weekly":
            interval = timedelta(weeks=1)
        elif frequency == "monthly":
            interval = timedelta(days=30)
        else:
            interval = timedelta(weeks=1)  # Default to weekly
        
        current_time = start_date
        for i in range(count):
            send_times.append(current_time)
            current_time += interval
        
        return send_times
    
    async def get_user_email(self, user_id: str) -> Optional[str]:
        """Get user's email by user_id.

        Prefers the application's `Users` table (capitalized, as in the UI screenshot),
        but gracefully falls back to a lowercase `users` table if present.
        """
        table_candidates = ["Users", "users"]
        for table_name in table_candidates:
            try:
                result = (
                    self.supabase
                    .table(table_name)
                    .select("email")
                    .eq("user_id", user_id)
                    .limit(1)
                    .execute()
                )
                if result.data and result.data[0].get("email"):
                    return result.data[0]["email"]
            except Exception:
                # Ignore and try next candidate table
                continue
        return None
    
    async def send_scheduled_emails(self) -> Dict[str, Any]:
        """Send emails that are scheduled to be sent now"""
        try:
            # Get emails that should be sent now
            current_time = datetime.utcnow()
            result = self.supabase.table("campaign_emails").select("*").eq("sent_at", None).lte("scheduled_send_time", current_time.isoformat()).execute()
            
            emails_to_send = result.data
            sent_count = 0
            failed_count = 0
            
            email_service = get_email_service()
            
            for email_data in emails_to_send:
                try:
                    # Get the actual user's email from the campaign
                    campaign_result = self.supabase.table("campaigns").select("user_id").eq("id", email_data["campaign_id"]).execute()
                    
                    if not campaign_result.data:
                        print(f"Campaign not found for email {email_data['id']}")
                        failed_count += 1
                        continue
                    
                    user_id = campaign_result.data[0]["user_id"]
                    user_email = await self.get_user_email(user_id)
                    
                    if not user_email:
                        print(f"User email not found for campaign {email_data['campaign_id']}")
                        failed_count += 1
                        continue
                    
                    success = await email_service.send_campaign_email(
                        email_data=email_data,
                        recipient_email=user_email
                    )
                    
                    if success:
                        # Update the email as sent
                        self.supabase.table("campaign_emails").update({
                            "sent_at": current_time.isoformat()
                        }).eq("id", email_data["id"]).execute()
                        sent_count += 1
                    else:
                        failed_count += 1
                        
                except Exception as e:
                    print(f"Failed to send email {email_data['id']}: {e}")
                    failed_count += 1
            
            return {
                "emails_processed": len(emails_to_send),
                "emails_sent": sent_count,
                "emails_failed": failed_count
            }
            
        except Exception as e:
            print(f"Error in send_scheduled_emails: {e}")
            return {
                "emails_processed": 0,
                "emails_sent": 0,
                "emails_failed": 0,
                "error": str(e)
            }

# Tracking features removed: no click tracking service or stats
