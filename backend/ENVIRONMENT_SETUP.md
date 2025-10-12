# Environment Variables Setup Guide

## Required Environment Variables

Create a `.env` file in the backend directory with the following variables:

### Supabase Configuration
```
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
SUPABASE_ANON_KEY=your_supabase_anon_key
```

### SendGrid Configuration (Required)
```
SENDGRID_API_KEY=your_sendgrid_api_key
SENDGRID_FROM_EMAIL=noreply@phishschool.com
```

### Test Configuration
```
TEST_EMAIL_RECIPIENT=test@example.com
```

### Gemini AI Configuration
```
GEMINI_API_KEY=your_gemini_api_key
```

## Setup Instructions

1. **Supabase Setup:**
   - Go to your Supabase project dashboard
   - Navigate to Settings > API
   - Copy the Project URL and Service Role Key
   - Run the SQL schema from `supabase_schema.sql` in the SQL editor

2. **SendGrid Setup:**
   - Create a SendGrid account at https://sendgrid.com
   - Generate an API key in Settings > API Keys
   - Verify your sender email address in Settings > Sender Authentication
   - Add the API key to your environment variables

## Testing

Run the backend server and test email functionality:
```bash
cd backend
python -m uvicorn main:app --reload
```
