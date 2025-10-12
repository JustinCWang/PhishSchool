from sqlalchemy import Column, String, DateTime, Boolean, Text, ForeignKey, Integer, ARRAY
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime

Base = declarative_base()

class Campaign(Base):
    __tablename__ = "campaigns"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(String, nullable=False)  # Supabase user ID
    name = Column(String(255), nullable=False)
    status = Column(String(50), default="active")  # active, paused, completed
    email_frequency = Column(String(50), default="weekly")  # daily, weekly, monthly
    difficulty_level = Column(String(50), default="medium")  # easy, medium, hard
    preferred_themes = Column(ARRAY(String), default=["bank", "job", "friend"])
    email_count = Column(Integer, default=10)
    duration_days = Column(Integer, default=30)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    emails = relationship("CampaignEmail", back_populates="campaign", cascade="all, delete-orphan")

class CampaignEmail(Base):
    __tablename__ = "campaign_emails"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    campaign_id = Column(UUID(as_uuid=True), ForeignKey("campaigns.id"), nullable=False)
    email_type = Column(String(50), nullable=False)  # phishing, legitimate
    subject = Column(String(500), nullable=False)
    sender_email = Column(String(255), nullable=False)
    recipient_email = Column(String(255), nullable=False)
    body = Column(Text, nullable=False)
    phishing_indicators = Column(ARRAY(String), nullable=True)
    explanation = Column(Text, nullable=True)
    scheduled_send_time = Column(DateTime, nullable=False)
    sent_at = Column(DateTime, nullable=True)
    clicked_at = Column(DateTime, nullable=True)
    click_tracking_id = Column(String(255), unique=True, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    campaign = relationship("Campaign", back_populates="emails")

class UserEmailPreferences(Base):
    __tablename__ = "user_email_preferences"
    
    user_id = Column(String, primary_key=True)  # Supabase user ID
    email_frequency = Column(String(50), default="weekly")
    difficulty_level = Column(String(50), default="medium")
    preferred_themes = Column(ARRAY(String), default=["bank", "job", "friend"])
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
