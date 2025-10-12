#!/usr/bin/env python3
"""SendGrid configuration validator for local/manual checks.

Validates required environment variables and attempts a simple send using the
SendGrid SDK to confirm credentials and sender configuration.
"""

import os
import sys
from dotenv import load_dotenv
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail, Email, To, Content

def validate_sendgrid_config():
    """Validate SendGrid configuration"""
    print("🔍 Validating SendGrid Configuration...")
    
    # Load environment variables
    load_dotenv()
    
    # Check required environment variables
    api_key = os.getenv("SENDGRID_API_KEY")
    from_email = os.getenv("SENDGRID_FROM_EMAIL")
    
    if not api_key:
        print(" SENDGRID_API_KEY is not set")
        return False
    
    if not from_email:
        print(" SENDGRID_FROM_EMAIL is not set")
        return False
    
    print(f" API Key: {'*' * 20}{api_key[-4:] if len(api_key) > 4 else '****'}")
    print(f" From Email: {from_email}")
    
    # Test SendGrid client initialization
    try:
        sg = SendGridAPIClient(api_key=api_key)
        print(" SendGrid client initialized successfully")
        return True
    except Exception as e:
        print(f" Failed to initialize SendGrid client: {e}")
        return False

def test_sendgrid_email():
    """Test sending a simple email through SendGrid"""
    print("\n Testing SendGrid Email Sending...")
    
    api_key = os.getenv("SENDGRID_API_KEY")
    from_email = os.getenv("SENDGRID_FROM_EMAIL")
    test_recipient = os.getenv("TEST_EMAIL_RECIPIENT", "test@example.com")
    
    try:
        sg = SendGridAPIClient(api_key=api_key)
        
        # Create a simple test email
        message = Mail(
            from_email=Email(from_email),
            to_emails=To(test_recipient),
            subject="PhishSchool SendGrid Test",
            plain_text_content="This is a test email from PhishSchool to verify SendGrid configuration."
        )
        
        # Send the email
        response = sg.send(message)
        
        if response.status_code in [200, 201, 202]:
            print(f" Test email sent successfully to {test_recipient}")
            print(f" Response status: {response.status_code}")
            return True
        else:
            print(f" Failed to send test email. Status: {response.status_code}")
            print(f" Response body: {response.body}")
            return False
            
    except Exception as e:
        print(f" Error sending test email: {e}")
        return False

def main():
    """Main validation function"""
    print(" SendGrid Configuration Validator\n")
    
    # Validate configuration
    config_valid = validate_sendgrid_config()
    
    if not config_valid:
        print("\n SendGrid configuration is invalid. Please check your .env file.")
        return
    
    # Test email sending
    email_sent = test_sendgrid_email()
    
    if email_sent:
        print("\n SendGrid is properly configured and working!")
        print("\nYour PhishSchool application is ready to send emails.")
    else:
        print("\n SendGrid configuration is valid but email sending failed.")
        print("Check your SendGrid account settings and sender verification.")

if __name__ == "__main__":
    main()
