#!/usr/bin/env python3
"""
Test script for email functionality with Supabase and SendGrid
Run this script to test your email setup
"""

import asyncio
import os
import sys
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Add the backend directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from services.email_service import get_email_service
from services.supabase_service import CampaignService

async def test_email_service():
    """Test the email service functionality"""
    print("🧪 Testing Email Service...")
    
    try:
        # Get SendGrid email service
        email_service = get_email_service()
        print(f"✅ SendGrid email service initialized: {type(email_service).__name__}")
        
        # Test email data
        test_email_data = {
            "email_type": "phishing",
            "subject": "Test Phishing Email - Urgent Action Required",
            "sender_email": "security@bank.com",
            "recipient_email": "user@example.com",
            "body": "Dear Customer,\n\nWe have detected suspicious activity on your account. Please click the link below to verify your identity immediately.\n\nBest regards,\nSecurity Team",
            "phishing_indicators": [
                "Urgent action required",
                "Suspicious activity claim",
                "Generic greeting",
                "Request for immediate verification"
            ],
            "explanation": "This email uses urgency tactics and generic greetings typical of phishing attempts.",
        }
        
        # Test recipient (use environment variable or default)
        test_recipient = os.getenv("TEST_EMAIL_RECIPIENT", "test@example.com")
        
        print(f"📧 Sending test email to: {test_recipient}")
        print("ℹ️  Note: In production, emails are sent to the logged-in user's email from Supabase")
        
        # Send the test email
        success = await email_service.send_campaign_email(
            email_data=test_email_data,
            recipient_email=test_recipient
        )
        
        if success:
            print("✅ Test email sent successfully!")
        else:
            print("❌ Failed to send test email")
            
    except Exception as e:
        print(f"❌ Error testing email service: {e}")

async def test_supabase_connection():
    """Test Supabase connection"""
    print("\n🗄️ Testing Supabase Connection...")
    
    try:
        from services.supabase_service import get_supabase_client
        supabase = get_supabase_client()
        
        # Test connection by querying campaigns table
        result = supabase.table("campaigns").select("id").limit(1).execute()
        print("✅ Supabase connection successful!")
        
        # Test campaign service
        campaign_service = CampaignService()
        print("✅ Campaign service initialized!")
        
        # Tracking service removed
        
    except Exception as e:
        print(f"❌ Error testing Supabase: {e}")

async def test_environment_variables():
    """Test required environment variables"""
    print("\n🔧 Testing Environment Variables...")
    
    required_vars = {
        "SUPABASE_URL": "Supabase project URL",
        "SUPABASE_SERVICE_ROLE_KEY": "Supabase service role key",
        "SENDGRID_API_KEY": "SendGrid API key (Required)",
        "SENDGRID_FROM_EMAIL": "SendGrid sender email (Required)"
    }
    
    missing_vars = []
    
    for var, description in required_vars.items():
        value = os.getenv(var)
        if value:
            print(f"✅ {var}: {description}")
        else:
            print(f"❌ {var}: {description} (MISSING)")
            missing_vars.append(var)
    
    if missing_vars:
        print(f"\n⚠️ Missing environment variables: {', '.join(missing_vars)}")
        print("Please check your .env file and ENVIRONMENT_SETUP.md for instructions.")
    else:
        print("\n✅ All required environment variables are set!")

async def main():
    """Run all tests"""
    print("🚀 Starting PhishSchool Email System Tests\n")
    
    # Test environment variables first
    await test_environment_variables()
    
    # Test Supabase connection
    await test_supabase_connection()
    
    # Test email service
    await test_email_service()
    
    print("\n🎉 Tests completed!")
    print("\nNext steps:")
    print("1. Set up your environment variables in .env file")
    print("2. Deploy the Supabase schema using supabase_schema.sql")
    print("3. Verify your SendGrid sender email and API key")
    print("4. Run the backend server: python -m uvicorn main:app --reload")

if __name__ == "__main__":
    asyncio.run(main())
