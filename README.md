# PhishSchool

BostonHacks2025 "Protect Noobs!" Track Project 

PhishSchool is a friendly, hands‑on platform that helps people learn to spot and avoid phishing. It combines quick practice, on‑demand detection, and optional training campaigns so users can build real, lasting instincts against scams.

Why this matters: phishing preys on trust and urgency. Many at‑risk users (students, seniors, new employees) don’t receive consistent training. PhishSchool closes that gap by making security skills accessible, engaging, and repeatable.

## What you can do

- **Learn**: Practice identifying phishing vs. legitimate content across realistic email and SMS scenarios. Get instant explanations, indicators, and keep score to track progress.
- **Detect**: Upload a `.eml` email file or a screenshot (PNG/JPG/WEBP/GIF) to get an AI‑assisted phishing score, risk level, key indicators, and a plain‑English explanation.
- **Campaign**: Opt into safe, simulated phishing emails at your chosen frequency (daily/weekly/monthly). Build habits over time and monitor improvement.

## How it’s organized

- **Learn**: Interactive drills that generate phishing and legitimate messages with varying difficulty. Great for quick reps and building intuition.
- **Detect**: A detector tool for analyzing real messages you’re unsure about. Helpful for just‑in‑time decisions.
- **Campaign**: Scheduled training emails that keep users sharp and provide longitudinal feedback.

## Run it locally

Frontend (Vite + React):

```bash
cd client
npm install
npm run dev
```

Backend (FastAPI):

```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # macOS/Linux
pip install -r requirements.txt  # uses backend/requirements.txt
python3 main.py
```

Defaults allow the frontend (http://localhost:5173) to call the backend (http://localhost:8000). You can adjust environment variables like `VITE_API_BASE_URL`, `VITE_SUPABASE_URL`, and `VITE_SUPABASE_ANON_KEY` as needed.

## Live app

- Web app: https://phish-school.vercel.app
- Backend API (default fallback in client): https://phishschoolbackend.vercel.app/api
