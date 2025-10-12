-- Campaign system tables for Supabase

-- Users table (stores user profile information)
CREATE TABLE IF NOT EXISTS users (
    user_id TEXT PRIMARY KEY,  -- Supabase auth.uid()
    email TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Campaigns table
CREATE TABLE IF NOT EXISTS campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed')),
    email_frequency TEXT DEFAULT 'weekly' CHECK (email_frequency IN ('daily', 'weekly', 'monthly')),
    difficulty_level TEXT DEFAULT 'medium' CHECK (difficulty_level IN ('easy', 'medium', 'hard')),
    preferred_themes TEXT[] DEFAULT ARRAY['bank', 'job', 'friend'],
    email_count INTEGER DEFAULT 10,
    duration_days INTEGER DEFAULT 30,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Campaign emails table
CREATE TABLE IF NOT EXISTS campaign_emails (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    email_type TEXT NOT NULL CHECK (email_type IN ('phishing', 'legitimate')),
    subject TEXT NOT NULL,
    sender_email TEXT NOT NULL,
    recipient_email TEXT NOT NULL,
    body TEXT NOT NULL,
    phishing_indicators TEXT[],
    explanation TEXT,
    scheduled_send_time TIMESTAMP WITH TIME ZONE NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE,
    clicked_at TIMESTAMP WITH TIME ZONE,
    click_tracking_id TEXT UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Email tracking table for analytics
CREATE TABLE IF NOT EXISTS email_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tracking_id TEXT NOT NULL,
    email_id UUID NOT NULL REFERENCES campaign_emails(id) ON DELETE CASCADE,
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    clicked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address TEXT,
    user_agent TEXT,
    phishing_reported BOOLEAN DEFAULT FALSE,
    reported_at TIMESTAMP WITH TIME ZONE
);

-- User email preferences table
CREATE TABLE IF NOT EXISTS user_email_preferences (
    user_id TEXT PRIMARY KEY,
    email_frequency TEXT DEFAULT 'weekly' CHECK (email_frequency IN ('daily', 'weekly', 'monthly')),
    difficulty_level TEXT DEFAULT 'medium' CHECK (difficulty_level IN ('easy', 'medium', 'hard')),
    preferred_themes TEXT[] DEFAULT ARRAY['bank', 'job', 'friend'],
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_campaigns_user_id ON campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_campaign_emails_campaign_id ON campaign_emails(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_emails_tracking_id ON campaign_emails(click_tracking_id);
CREATE INDEX IF NOT EXISTS idx_email_tracking_tracking_id ON email_tracking(tracking_id);
CREATE INDEX IF NOT EXISTS idx_email_tracking_email_id ON email_tracking(email_id);

-- Row Level Security (RLS) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_email_preferences ENABLE ROW LEVEL SECURITY;

-- Policies for campaigns table
CREATE POLICY "Users can view their own campaigns" ON campaigns
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own campaigns" ON campaigns
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own campaigns" ON campaigns
    FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own campaigns" ON campaigns
    FOR DELETE USING (auth.uid()::text = user_id);

-- Policies for campaign_emails table
CREATE POLICY "Users can view emails from their campaigns" ON campaign_emails
    FOR SELECT USING (
        campaign_id IN (
            SELECT id FROM campaigns WHERE user_id = auth.uid()::text
        )
    );

CREATE POLICY "System can insert campaign emails" ON campaign_emails
    FOR INSERT WITH CHECK (true);

CREATE POLICY "System can update campaign emails" ON campaign_emails
    FOR UPDATE USING (true);

-- Policies for email_tracking table
CREATE POLICY "Users can view tracking for their campaigns" ON email_tracking
    FOR SELECT USING (
        campaign_id IN (
            SELECT id FROM campaigns WHERE user_id = auth.uid()::text
        )
    );

CREATE POLICY "System can insert tracking data" ON email_tracking
    FOR INSERT WITH CHECK (true);

-- Policies for user_email_preferences table
CREATE POLICY "Users can view their own preferences" ON user_email_preferences
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own preferences" ON user_email_preferences
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own preferences" ON user_email_preferences
    FOR UPDATE USING (auth.uid()::text = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to automatically update updated_at
CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON campaigns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_email_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
