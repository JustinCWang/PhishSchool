# PhishSchool Email System Setup Guide

## Overview

Your PhishSchool application is now configured to use **Supabase** for database operations and **SendGrid** for email delivery.

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Email Service │
│   (React)       │◄──►│   (FastAPI)     │◄──►│   (SendGrid)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │   Supabase      │
                       │   (Database)    │
                       └─────────────────┘
```

## Database Schema

Your Supabase schema includes these key tables:

- **`campaigns`** - Stores user campaign configurations
- **`campaign_emails`** - Stores generated emails with tracking IDs
- **`email_tracking`** - Records email clicks and analytics
- **`user_email_preferences`** - User preferences for email frequency and themes

## Email Service Configuration

### SendGrid Email Service
- **Advantages**: Reliable delivery, detailed analytics, professional service, scalable
- **Setup**: Requires API key and verified sender email
- **Usage**: Primary and only email service for the application

## Setup Instructions

### 1. Environment Variables

Create a `.env` file in the `backend` directory:

```bash
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_ANON_KEY=your_anon_key

# SendGrid Configuration (Required)
SENDGRID_API_KEY=SG.your_sendgrid_api_key
SENDGRID_FROM_EMAIL=noreply@phishschool.com

# Test Configuration
TEST_EMAIL_RECIPIENT=test@example.com

# Gemini AI Configuration
GEMINI_API_KEY=your_gemini_api_key
```

### 2. Supabase Setup

1. **Deploy Schema**:
   ```sql
   -- Run the contents of supabase_schema.sql in your Supabase SQL editor
   ```

2. **Enable Row Level Security**: The schema includes RLS policies for data security

3. **Test Connection**: Use the test script to verify connectivity

### 3. SendGrid Setup (Required)

1. **Create Account**: Sign up at [sendgrid.com](https://sendgrid.com)

2. **Generate API Key**:
   - Go to Settings → API Keys
   - Create a new API key with "Full Access"
   - Copy the key to your `.env` file

3. **Verify Sender Email**:
   - Go to Settings → Sender Authentication
   - Verify your domain or single sender email
   - Use the verified email as `SENDGRID_FROM_EMAIL`

### 4. Testing

Run the test script to verify everything works:

```bash
cd backend
python test_email_system.py
```

## Usage Examples

### Sending Campaign Emails

```python
from services.supabase_service import CampaignService
from services.email_service import get_email_service

# Create a campaign
campaign_service = CampaignService()
campaign_data = {
    "name": "Security Training Campaign",
    "email_frequency": "weekly",
    "difficulty_level": "medium",
    "preferred_themes": ["bank", "job"],
    "email_count": 5,
    "duration_days": 30
}

campaign = await campaign_service.create_campaign("user123", campaign_data)
```

### Manual Email Sending

```python
email_service = get_email_service()

email_data = {
    "email_type": "phishing",
    "subject": "Urgent: Verify Your Account",
    "sender_email": "security@bank.com",
    "recipient_email": "user@example.com",
    "body": "Please click the link to verify...",
    "phishing_indicators": ["Urgent language", "Generic greeting"],
    "explanation": "This uses urgency tactics typical of phishing",
    "click_tracking_id": "track-123"
}

success = await email_service.send_campaign_email(
    email_data=email_data,
    recipient_email="test@example.com"
)
```

### Email Tracking

```python
from services.supabase_service import TrackingService

tracking_service = TrackingService()

# Record a click
email_data = await tracking_service.record_email_click(
    tracking_id="track-123",
    ip_address="192.168.1.1",
    user_agent="Mozilla/5.0..."
)

# Get tracking stats
stats = await tracking_service.get_tracking_stats("track-123")
```

## Email Templates

The system automatically generates HTML and plain text versions of emails with:

- **Visual indicators** for phishing vs legitimate emails
- **Phishing indicators** highlighted
- **Educational explanations**
- **Tracking links** for analytics
- **Professional styling**

## Monitoring and Analytics

### Campaign Statistics
- Emails sent vs clicked
- Phishing detection rate
- User engagement metrics

### Email Tracking
- Click-through rates
- IP addresses and user agents
- Time-based analytics

## Troubleshooting

### Common Issues

1. **SendGrid API Key Invalid**:
   - Verify the API key is correct
   - Check API key permissions
   - Ensure sender email is verified

2. **Supabase Connection Failed**:
   - Verify URL and service role key
   - Check if schema is deployed
   - Ensure RLS policies allow access

3. **Email Delivery Issues**:
   - Check SendGrid activity feed for delivery status
   - Verify sender email is authenticated
   - Review SendGrid suppression lists

### Debug Mode

Enable debug logging by setting:
```bash
export PYTHONPATH=/path/to/backend
python -c "import logging; logging.basicConfig(level=logging.DEBUG)"
```

## Production Considerations

1. **Rate Limiting**: SendGrid has rate limits based on your plan
2. **Email Reputation**: Use verified domains and maintain good practices
3. **Monitoring**: Set up alerts for failed email deliveries
4. **Reliability**: SendGrid provides high deliverability and uptime
5. **Scaling**: SendGrid can handle high volume email sending

## Security Notes

- Never commit API keys to version control
- Use environment variables for all sensitive data
- Implement proper authentication for email endpoints
- Monitor for unusual email sending patterns
