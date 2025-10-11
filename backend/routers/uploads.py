from fastapi import APIRouter, File, UploadFile, HTTPException
import email
from email import policy
from email.parser import BytesParser
import os
from typing import Optional
import google.generativeai as genai

router = APIRouter()

# Configure Gemini API
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

@router.get("/")
async def get_upload_info():
    """Get information about file upload endpoints"""
    return {
        "message": "File upload endpoint",
        "description": "Upload .eml files for phishing analysis",
        "accepted_formats": [".eml"]
    }

def parse_eml_file(content: bytes) -> dict:
    """Parse EML file and extract relevant information"""
    try:
        msg = BytesParser(policy=policy.default).parsebytes(content)
        
        # Extract email components
        from_addr = msg.get('From', '')
        to_addr = msg.get('To', '')
        subject = msg.get('Subject', '')
        date = msg.get('Date', '')
        
        # Get email body
        body = ""
        if msg.is_multipart():
            for part in msg.walk():
                if part.get_content_type() == "text/plain":
                    body = part.get_payload(decode=True).decode('utf-8', errors='ignore')
                    break
                elif part.get_content_type() == "text/html":
                    body = part.get_payload(decode=True).decode('utf-8', errors='ignore')
        else:
            body = msg.get_payload(decode=True).decode('utf-8', errors='ignore')
        
        return {
            "from": from_addr,
            "to": to_addr,
            "subject": subject,
            "date": date,
            "body": body[:2000],  # Limit body length
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse EML file: {str(e)}")

async def analyze_with_gemini(email_data: dict) -> dict:
    """Analyze email content using Gemini AI for phishing indicators"""
    try:
        if not GEMINI_API_KEY:
            return {
                "score": -1,
                "risk_level": "unknown",
                "indicators": ["Gemini API key not configured"],
                "explanation": "AI analysis unavailable - API key missing"
            }
        
        model = genai.GenerativeModel('gemini-1.5-flash')
        
        prompt = f"""Analyze this email for phishing indicators and provide a detailed assessment.

Email Details:
From: {email_data['from']}
To: {email_data['to']}
Subject: {email_data['subject']}
Date: {email_data['date']}

Body:
{email_data['body']}

Please analyze this email and provide:
1. A phishing risk score from 0-100 (0 = definitely safe, 100 = definitely phishing)
2. Risk level: "safe", "low", "medium", "high", or "critical"
3. List of specific phishing indicators found (if any)
4. A brief explanation of your assessment

Format your response as JSON with keys: score, risk_level, indicators (array), explanation"""

        response = model.generate_content(prompt)
        
        # Try to parse response as JSON
        import json
        import re
        
        response_text = response.text
        # Extract JSON from markdown code blocks if present
        json_match = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', response_text, re.DOTALL)
        if json_match:
            response_text = json_match.group(1)
        
        try:
            result = json.loads(response_text)
        except json.JSONDecodeError:
            # If JSON parsing fails, create structured response from text
            result = {
                "score": 50,
                "risk_level": "medium",
                "indicators": ["AI analysis completed but response format unexpected"],
                "explanation": response_text[:500]
            }
        
        return result
        
    except Exception as e:
        return {
            "score": -1,
            "risk_level": "unknown",
            "indicators": [f"Analysis error: {str(e)}"],
            "explanation": "Failed to complete AI analysis"
        }

@router.post("/eml")
async def upload_eml_file(file: UploadFile = File(...)):
    """
    Upload an .eml file for phishing analysis
    """
    # Validate file extension
    if not file.filename or not file.filename.endswith('.eml'):
        raise HTTPException(status_code=400, detail="Only .eml files are accepted")
    
    try:
        # Read file content
        content = await file.read()
        
        # Parse EML file
        email_data = parse_eml_file(content)
        
        # Analyze with Gemini
        analysis = await analyze_with_gemini(email_data)
        
        return {
            "status": "success",
            "filename": file.filename,
            "email_data": {
                "from": email_data["from"],
                "to": email_data["to"],
                "subject": email_data["subject"],
                "date": email_data["date"],
            },
            "analysis": analysis,
            "score": analysis.get("score", -1),
            "risk_level": analysis.get("risk_level", "unknown"),
            "indicators": analysis.get("indicators", []),
            "explanation": analysis.get("explanation", "")
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing file: {str(e)}")

