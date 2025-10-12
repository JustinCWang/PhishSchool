from supabase import create_client, Client
import os
import logging
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
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

class CampaignService:
    """
    Service for interacting with Supabase using the simplified schema:
    - Users: data_joined, first_name, last_name, email, opted_in, num_fished, correct,
             frequency, learn_attempts, learn_correct, last_sent_at, user_id (PK/unique)
    - Scores: score_id (user_id), learn_correct, learn_attempted

    Note: Class name preserved to avoid router import changes.
    """

    def __init__(self):
        self.supabase = get_supabase_client()

    # -------------------- Users helpers --------------------
    async def ensure_users_row(
        self,
        user_id: str,
        email: Optional[str] = None,
        first_name: Optional[str] = None,
        last_name: Optional[str] = None,
    ) -> Dict[str, Any]:
        defaults: Dict[str, Any] = {
            "user_id": user_id,
            "email": email,
            "first_name": first_name,
            "last_name": last_name,
            "opted_in": False,
            "frequency": "weekly",
            "num_fished": 0,
            "correct": 0,
            "learn_attempts": 0,
            "learn_correct": 0,
        }
        result = (
            self.supabase
            .table("Users")
            .upsert(defaults, on_conflict="user_id")
            .execute()
        )
        return result.data[0] if result.data else defaults

    async def get_user(self, user_id: str) -> Optional[Dict[str, Any]]:
        res = (
            self.supabase
            .table("Users")
            .select("*")
            .eq("user_id", user_id)
            .maybe_single()
            .execute()
        )
        return res.data if res.data else None

    async def get_user_email(self, user_id: str) -> Optional[str]:
        res = (
            self.supabase
            .table("Users")
            .select("email")
            .eq("user_id", user_id)
            .maybe_single()
            .execute()
        )
        return (res.data or {}).get("email") if res.data else None

    async def opt_in_user(self, user_id: str, frequency: Optional[str] = None) -> Dict[str, Any]:
        freq = frequency or "weekly"
        payload = {
            "opted_in": True,
            "frequency": freq,
        }
        res = (
            self.supabase
            .table("Users")
            .update(payload)
            .eq("user_id", user_id)
            .execute()
        )
        return res.data[0] if res.data else {"user_id": user_id, **payload}

    async def opt_out_user(self, user_id: str) -> Dict[str, Any]:
        res = (
            self.supabase
            .table("Users")
            .update({"opted_in": False})
            .eq("user_id", user_id)
            .execute()
        )
        return res.data[0] if res.data else {"user_id": user_id, "opted_in": False}

    async def increment_num_fished(self, user_id: str) -> None:
        current = await self.get_user(user_id)
        current_value = int((current or {}).get("num_fished") or 0)
        self.supabase.table("Users").update({"num_fished": current_value + 1}).eq("user_id", user_id).execute()

    # -------------------- Scores helpers --------------------
    async def ensure_scores_row(self, user_id: str) -> None:
        self.supabase.table("Scores").upsert(
            {"score_id": user_id, "learn_attempted": 0, "learn_correct": 0},
            on_conflict="score_id",
        ).execute()

    async def record_learn_attempt(self, user_id: str, was_correct: bool) -> None:
        # Update Users table counters
        current = await self.get_user(user_id)
        attempts = int((current or {}).get("learn_attempts") or 0) + 1
        correct = int((current or {}).get("learn_correct") or 0) + (1 if was_correct else 0)
        self.supabase.table("Users").update({
            "learn_attempts": attempts,
            "learn_correct": correct,
        }).eq("user_id", user_id).execute()

        # Update Scores table
        scores_res = (
            self.supabase
            .table("Scores")
            .select("learn_attempted, learn_correct")
            .eq("score_id", user_id)
            .maybe_single()
            .execute()
        )
        s_attempted = int((scores_res.data or {}).get("learn_attempted") or 0) + 1
        s_correct = int((scores_res.data or {}).get("learn_correct") or 0) + (1 if was_correct else 0)
        self.supabase.table("Scores").upsert(
            {"score_id": user_id, "learn_attempted": s_attempted, "learn_correct": s_correct},
            on_conflict="score_id",
        ).execute()

    # -------------------- Sending logic (due-based) --------------------
    async def send_scheduled_emails(self) -> Dict[str, Any]:
        """
        Send training emails to Users who are opted-in and due based on `frequency` and `last_sent_at`.
        """
        try:
            now_iso = datetime.utcnow().isoformat()
            # Fetch opted-in users
            result = (
                self.supabase
                .table("Users")
                .select("user_id, email, frequency, last_sent_at")
                .eq("opted_in", True)
                .execute()
            )

            users = result.data or []
            due_users: List[Dict[str, Any]] = []
            for u in users:
                freq = (u.get("frequency") or "weekly").lower()
                last_sent_at = u.get("last_sent_at")
                delta = self._frequency_to_timedelta(freq)
                if not last_sent_at:
                    due_users.append(u)
                    continue
                try:
                    last = datetime.fromisoformat(str(last_sent_at).replace("Z", "+00:00").split("+", 1)[0])
                except Exception:
                    # If parsing fails, treat as due
                    due_users.append(u)
                    continue
                if datetime.utcnow() - last >= delta:
                    due_users.append(u)

            email_service = get_email_service()
            sent_count = 0
            failed_count = 0

            for u in due_users:
                user_id = u.get("user_id")
                recipient = u.get("email")
                if not user_id or not recipient:
                    failed_count += 1
                    continue

                try:
                    content_type = "phishing" if random.random() < 0.7 else "legitimate"
                    msg = generate_message(
                        message_type="email",
                        content_type=content_type,
                        difficulty="medium",
                        theme=None,
                    )
                    email_data = {
                        "email_type": content_type,
                        "subject": msg.get("subject") or "Security Training",
                        "sender_email": msg.get("sender") or os.getenv("SENDGRID_FROM_EMAIL", "noreply@phishschool.com"),
                        "recipient_email": recipient,
                        "body": msg.get("body") or "This is a training email.",
                        "phishing_indicators": msg.get("phishing_indicators") or [],
                        "explanation": msg.get("explanation") or "",
                    }
                    ok = await email_service.send_campaign_email(email_data=email_data, recipient_email=recipient)
                    if ok:
                        sent_count += 1
                        self.supabase.table("Users").update({"last_sent_at": now_iso}).eq("user_id", user_id).execute()
                    else:
                        failed_count += 1
                except GeminiClientError:
                    failed_count += 1
                except Exception:
                    failed_count += 1

            return {
                "users_considered": len(users),
                "users_due": len(due_users),
                "emails_sent": sent_count,
                "emails_failed": failed_count,
            }
        except Exception as e:
            logging.getLogger(__name__).error(f"Error in send_scheduled_emails: {e}")
            return {
                "users_considered": 0,
                "users_due": 0,
                "emails_sent": 0,
                "emails_failed": 0,
                "error": str(e),
            }

    def _frequency_to_timedelta(self, frequency: str) -> timedelta:
        f = (frequency or "weekly").lower()
        if f == "daily":
            return timedelta(days=1)
        if f == "weekly":
            return timedelta(weeks=1)
        if f == "monthly":
            return timedelta(days=30)
        return timedelta(weeks=1)
