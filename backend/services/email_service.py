import os
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import (
    Mail,
    Email,
    To,
    Content,
    TrackingSettings,
    ClickTracking,
    OpenTracking,
    CustomArg,
)
from typing import Dict, Any, Optional
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class EmailService:
    def __init__(self):
        self.api_key = os.getenv("SENDGRID_API_KEY")
        if not self.api_key:
            raise ValueError("SENDGRID_API_KEY environment variable is required")
        
        self.sg = SendGridAPIClient(api_key=self.api_key)
        self.from_email = os.getenv("SENDGRID_FROM_EMAIL", "noreply@phishschool.com")
    
    async def send_email(
        self,
        to_email: str,
        subject: str,
        html_content: str,
        plain_content: Optional[str] = None,
        tracking_id: Optional[str] = None
    ) -> bool:
        """
        Send an email using SendGrid
        
        Args:
            to_email: Recipient email address
            subject: Email subject
            html_content: HTML content of the email
            plain_content: Plain text content (optional)
            tracking_id: Tracking ID for analytics (optional)
        
        Returns:
            bool: True if email was sent successfully, False otherwise
        """
        try:
            # Create the email
            from_email = Email(self.from_email)
            to_email_obj = To(to_email)
            
            # Use HTML content if provided, otherwise use plain text
            if html_content:
                content = Content("text/html", html_content)
            elif plain_content:
                content = Content("text/plain", plain_content)
            else:
                raise ValueError("Either html_content or plain_content must be provided")
            
            # Create the mail object
            mail = Mail(from_email, to_email_obj, subject, content)
            
            # Add tracking if provided
            if tracking_id:
                tracking_settings = TrackingSettings()
                tracking_settings.click_tracking = ClickTracking(True, False)
                tracking_settings.open_tracking = OpenTracking(True)
                mail.tracking_settings = tracking_settings

                # Add custom tracking ID in a SendGrid-supported way
                mail.add_custom_arg(CustomArg("tracking_id", tracking_id))
            
            # Send the email
            response = self.sg.send(mail)
            
            if response.status_code in [200, 201, 202]:
                logger.info(f"Email sent successfully to {to_email}. Status: {response.status_code}")
                return True
            else:
                logger.error(f"Failed to send email to {to_email}. Status: {response.status_code}")
                logger.error(f"Response body: {response.body}")
                return False
                
        except Exception as e:
            logger.error(f"Error sending email to {to_email}: {str(e)}")
            return False
    
    async def send_campaign_email(
        self,
        email_data: Dict[str, Any],
        recipient_email: str
    ) -> bool:
        """
        Send a campaign email with proper formatting
        
        Args:
            email_data: Email data from database
            recipient_email: Actual recipient email address
        
        Returns:
            bool: True if email was sent successfully
        """
        try:
            # Create HTML content for the email
            html_content = self._create_email_html(email_data)
            plain_content = self._create_email_plain(email_data)
            
            # Add tracking link if it's a phishing email
            if email_data.get("email_type") == "phishing" and email_data.get("click_tracking_id"):
                tracking_url = f"http://localhost:8000/api/track/{email_data['click_tracking_id']}"
                html_content = html_content.replace(
                    "{{TRACKING_URL}}", 
                    f'<a href="{tracking_url}" style="color: #007bff; text-decoration: underline;">Click here</a>'
                )
                plain_content = plain_content.replace(
                    "{{TRACKING_URL}}", 
                    f"Click here: {tracking_url}"
                )
            
            return await self.send_email(
                to_email=recipient_email,
                subject=email_data["subject"],
                html_content=html_content,
                plain_content=plain_content,
                tracking_id=email_data.get("click_tracking_id")
            )
            
        except Exception as e:
            logger.error(f"Error sending campaign email: {str(e)}")
            return False
    
    def _create_email_html(self, email_data: Dict[str, Any]) -> str:
        """Create HTML content for the email"""
        email_type = email_data.get("email_type", "legitimate")
        email_type_badge = "🔴 PHISHING" if email_type == "phishing" else "🟢 LEGITIMATE"
        
        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>{email_data["subject"]}</title>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 20px; }}
                .badge {{ display: inline-block; padding: 5px 10px; border-radius: 3px; font-size: 12px; font-weight: bold; }}
                .phishing {{ background: #dc3545; color: white; }}
                .legitimate {{ background: #28a745; color: white; }}
                .content {{ background: white; padding: 20px; border: 1px solid #ddd; border-radius: 5px; }}
                .footer {{ margin-top: 20px; padding: 15px; background: #f8f9fa; border-radius: 5px; font-size: 12px; color: #666; }}
                .indicators {{ background: #fff3cd; border: 1px solid #ffeaa7; padding: 10px; border-radius: 5px; margin: 10px 0; }}
            </style>
        </head>
        <body>
            <div class="header">
                <h2>{email_data["subject"]}</h2>
                <span class="badge {'phishing' if email_type == 'phishing' else 'legitimate'}">{email_type_badge}</span>
            </div>
            
            <div class="content">
                <p><strong>From:</strong> {email_data["sender_email"]}</p>
                <p><strong>To:</strong> {email_data["recipient_email"]}</p>
                
                <div style="margin: 20px 0; padding: 20px; background: #f8f9fa; border-radius: 5px;">
                    {email_data["body"].replace(chr(10), '<br>')}
                </div>
                
                {self._format_phishing_indicators(email_data.get("phishing_indicators", []))}
                
                {self._format_explanation(email_data.get("explanation", ""))}
            </div>
            
            <div class="footer">
                <p><strong>This is a PhishSchool training email.</strong></p>
                <p>This email was generated for educational purposes to help you learn how to identify phishing attempts.</p>
                {{TRACKING_URL}}
            </div>
        </body>
        </html>
        """
        return html
    
    def _create_email_plain(self, email_data: Dict[str, Any]) -> str:
        """Create plain text content for the email"""
        email_type = email_data.get("email_type", "legitimate")
        email_type_badge = "PHISHING" if email_type == "phishing" else "LEGITIMATE"
        
        plain = f"""
Subject: {email_data["subject"]}
From: {email_data["sender_email"]}
To: {email_data["recipient_email"]}
Type: {email_type_badge}

{email_data["body"]}

"""
        
        if email_data.get("phishing_indicators"):
            plain += "Phishing Indicators:\n"
            for indicator in email_data["phishing_indicators"]:
                plain += f"- {indicator}\n"
            plain += "\n"
        
        if email_data.get("explanation"):
            plain += f"Explanation: {email_data['explanation']}\n\n"
        
        plain += "This is a PhishSchool training email for educational purposes.\n"
        plain += "{{TRACKING_URL}}\n"
        
        return plain
    
    def _format_phishing_indicators(self, indicators: list) -> str:
        """Format phishing indicators for HTML"""
        if not indicators:
            return ""
        
        indicators_html = '<div class="indicators"><h4>🚨 Phishing Indicators:</h4><ul>'
        for indicator in indicators:
            indicators_html += f'<li>{indicator}</li>'
        indicators_html += '</ul></div>'
        return indicators_html
    
    def _format_explanation(self, explanation: str) -> str:
        """Format explanation for HTML"""
        if not explanation:
            return ""
        
        return f'<div style="background: #e7f3ff; border: 1px solid #b3d9ff; padding: 10px; border-radius: 5px; margin: 10px 0;"><h4>💡 Explanation:</h4><p>{explanation}</p></div>'

# Global email service instance
email_service = None

def get_email_service():
    """Get the global email service instance - SendGrid only"""
    global email_service
    if email_service is None:
        try:
            email_service = EmailService()
            logger.info("Using SendGrid email service")
        except Exception as e:
            logger.error(f"SendGrid initialization failed: {e}")
            raise Exception("SendGrid email service is required but not properly configured")
    return email_service
