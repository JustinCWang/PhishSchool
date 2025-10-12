# SendGrid Setup Guide for PhishSchool

## Overview

Your PhishSchool application is now configured to use **SendGrid only** for email delivery. This guide will walk you through setting up SendGrid from scratch.

## Step 1: Create SendGrid Account

1. **Go to SendGrid**: Visit [https://sendgrid.com](https://sendgrid.com)
2. **Sign Up**: Click "Start for Free" and create your account
3. **Choose Plan**: Start with the free plan (100 emails/day)
4. **Verify Email**: Check your email and verify your account

## Step 2: Generate API Key

1. **Login to SendGrid Dashboard**
2. **Navigate to Settings**: Click on "Settings" in the left sidebar
3. **Go to API Keys**: Click "API Keys"
4. **Create New Key**: Click "Create API Key"
5. **Choose Permissions**: Select "Full Access" for complete functionality
6. **Name Your Key**: Give it a descriptive name like "PhishSchool API Key"
7. **Copy the Key**: **IMPORTANT** - Copy the API key immediately (you won't see it again)

## Step 3: Verify Sender Email

### Option A: Single Sender Verification (Recommended for Testing)

1. **Go to Settings**: Click "Settings" in the left sidebar
2. **Sender Authentication**: Click "Sender Authentication"
3. **Single Sender Verification**: Click "Verify a Single Sender"
4. **Fill Form**:
   - **From Name**: PhishSchool
   - **From Email**: `your-gmail@gmail.com` (Yes, you can use Gmail!)
   - **Reply To**: `support@phishschool.com` (or your Gmail)
   - **Company Address**: Your company address
   - **City**: Your city
   - **Country**: Your country
5. **Verify Email**: Check your Gmail inbox and click the verification link

**Important**: The "from" email must be a real, verified email address. Gmail works perfectly for this!

### Option B: Domain Authentication (Recommended for Production)

1. **Go to Settings**: Click "Settings" in the left sidebar
2. **Sender Authentication**: Click "Sender Authentication"
3. **Domain Authentication**: Click "Authenticate Your Domain"
4. **Enter Domain**: Enter your domain (e.g., `phishschool.com`)
5. **Follow DNS Instructions**: Add the required DNS records to your domain
6. **Verify**: SendGrid will verify your domain

## Step 4: Configure Environment Variables

Create a `.env` file in your `backend` directory:

```bash
# SendGrid Configuration
SENDGRID_API_KEY=SG.your_actual_api_key_here
SENDGRID_FROM_EMAIL=your-gmail@gmail.com

# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Test Configuration (this will be replaced by actual user emails)
TEST_EMAIL_RECIPIENT=your-test-email@example.com

# Gemini AI Configuration
GEMINI_API_KEY=your_gemini_api_key
```

**Important**: 
- Replace `SG.your_actual_api_key_here` with your actual SendGrid API key
- Replace `your-gmail@gmail.com` with your verified Gmail address
- The `TEST_EMAIL_RECIPIENT` is only used for testing - in production, emails go to the logged-in user's email

## How Dynamic Email Recipients Work

Your PhishSchool application now automatically sends emails to the **logged-in user's email address** from Supabase:

1. **User Authentication**: When a user logs in, their email is stored in the `users` table
2. **Campaign Creation**: Campaigns are linked to the user's ID
3. **Email Sending**: When emails are sent, the system:
   - Looks up the campaign's user_id
   - Gets the user's email from the `users` table
   - Sends the email to that specific user's email address

**No more hardcoded test emails!** Each user receives their phishing training emails at their actual email address.

## Step 5: Test Your Setup

### Quick Test
Run the SendGrid validator:
```bash
cd backend
python validate_sendgrid.py
```

### Full System Test
Run the complete email system test:
```bash
python test_email_system.py
```

### Manual Test
Start your backend server:
```bash
python -m uvicorn main:app --reload
```

## Step 6: SendGrid Dashboard Features

### Activity Feed
- **Location**: Dashboard → Activity
- **Purpose**: Monitor email delivery, opens, clicks, bounces
- **Use**: Track campaign performance and troubleshoot issues

### Suppression Lists
- **Location**: Settings → Suppressions
- **Purpose**: Manage bounced emails, unsubscribes, spam reports
- **Use**: Maintain good sender reputation

### Statistics
- **Location**: Dashboard → Statistics
- **Purpose**: View email metrics, delivery rates, engagement
- **Use**: Analyze campaign effectiveness

## Troubleshooting Common Issues

### 1. "Invalid API Key" Error
**Solution**:
- Verify the API key is correct (starts with `SG.`)
- Check for extra spaces or characters
- Ensure the key has "Full Access" permissions

### 2. "Sender Not Verified" Error
**Solution**:
- Complete sender verification process
- Check your email for verification link
- Wait a few minutes after verification

### 3. "Email Not Delivered" Issue
**Solution**:
- Check SendGrid Activity feed for delivery status
- Verify recipient email is valid
- Check suppression lists
- Review email content for spam triggers

### 4. "Rate Limit Exceeded" Error
**Solution**:
- Check your SendGrid plan limits
- Upgrade plan if needed
- Implement rate limiting in your code

## Production Considerations

### 1. Domain Authentication
- **Why**: Improves deliverability and sender reputation
- **How**: Complete domain authentication in SendGrid
- **Benefit**: Higher inbox placement rates

### 2. Monitoring Setup
- **Activity Feed**: Monitor daily email activity
- **Webhooks**: Set up webhooks for real-time events
- **Alerts**: Configure alerts for high bounce rates

### 3. Email Content Best Practices
- **Avoid Spam Triggers**: Don't use excessive caps, spam words
- **Proper Formatting**: Use proper HTML structure
- **Unsubscribe Links**: Include unsubscribe links
- **Sender Information**: Use verified sender information

### 4. Scaling Considerations
- **Free Plan**: 100 emails/day
- **Essentials**: $19.95/month for 50,000 emails
- **Pro**: $89.95/month for 100,000 emails
- **Monitor Usage**: Track your email volume

## Security Best Practices

1. **API Key Security**:
   - Never commit API keys to version control
   - Use environment variables
   - Rotate keys regularly

2. **Email Content**:
   - Validate all email inputs
   - Sanitize user-generated content
   - Use HTTPS for all communications

3. **Rate Limiting**:
   - Implement rate limiting in your application
   - Monitor for unusual sending patterns
   - Set up alerts for suspicious activity

## Next Steps

1. **Complete Setup**: Follow all steps above
2. **Test Thoroughly**: Use the test scripts
3. **Monitor Activity**: Check SendGrid dashboard regularly
4. **Scale as Needed**: Upgrade plan when you exceed limits

Your PhishSchool application is now ready to send professional, tracked emails through SendGrid!
