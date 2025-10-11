# PhishSchool Backend API

FastAPI backend for PhishSchool - A phishing education and detection platform.

## Quick Setup

### 1. Create Virtual Environment
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Mac/Linux
# OR
venv\Scripts\activate     # Windows
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Run the Server
```bash
python main.py
```

The API will be available at:
- **API**: http://localhost:8000
- **Interactive Docs**: http://localhost:8000/docs ← Use this to test endpoints!

## Testing the API

### Option 1: Interactive Docs (Recommended)
1. Open http://localhost:8000/docs in your browser
2. Click on any endpoint to expand it
3. Click "Try it out"
4. Fill in parameters and click "Execute"

### Option 2: cURL
```bash
# Health check
curl http://localhost:8000/health

# Get phishing info
curl http://localhost:8000/api/phishing/
```

### Option 3: From Frontend
```javascript
// In your React app
const response = await fetch('http://localhost:8000/api/phishing/');
const data = await response.json();
console.log(data);
```

## Creating a New API Endpoint

### Step 1: Choose or Create a Router
Routers are in the `routers/` directory. Choose an existing one or create a new file:
```
routers/
├── phishing.py   ← Phishing detection endpoints
├── training.py   ← Training scenarios
├── uploads.py    ← File uploads
└── your_new_router.py  ← Create new one here
```

### Step 2: Create Your Endpoint
Edit a router file (e.g., `routers/phishing.py`):

```python
from fastapi import APIRouter

router = APIRouter()

@router.get("/my-endpoint")
async def my_endpoint():
    """Description of what this endpoint does"""
    return {"message": "Hello from my endpoint!"}

@router.post("/analyze")
async def analyze_data(data: dict):
    """POST endpoint that accepts JSON data"""
    # Your logic here
    return {"received": data}
```

### Step 3: Register Router (if new file)
If you created a new router file, add it to `main.py`:

```python
from routers import phishing, training, uploads, your_new_router

# Add this line:
app.include_router(your_new_router.router, prefix="/api/your-route", tags=["your-tag"])
```

### Step 4: Test It!
1. Restart the server (Ctrl+C, then `python main.py`)
2. Go to http://localhost:8000/docs
3. Your new endpoint will appear in the list!

## Current Endpoints

### Root
- `GET /` - API welcome message
- `GET /health` - Health check

### Phishing Detection (`/api/phishing`)
- `GET /api/phishing/` - Info about phishing endpoints
- `POST /api/phishing/analyze` - Analyze email (TODO: implement)

### Training (`/api/training`)
- `GET /api/training/` - Info about training endpoints
- `GET /api/training/scenario` - Generate scenario (TODO: implement)
- `POST /api/training/opt-in` - Opt-in to training (TODO: implement)
- `POST /api/training/opt-out` - Opt-out of training (TODO: implement)

### Uploads (`/api/uploads`)
- `GET /api/uploads/` - Info about upload endpoints
- `POST /api/uploads/eml` - Upload .eml file (TODO: implement)

## Adding Dependencies

When you need a new package:

```bash
# Install it
pip install package-name

# Add it to requirements.txt
pip freeze | grep package-name >> requirements.txt
```

## Common Packages for This Project

```bash
# For Gemini AI
pip install google-generativeai

# For environment variables
pip install python-dotenv

# For Firebase
pip install firebase-admin

# For email parsing
pip install eml-parser
```

## Project Structure

```
backend/
├── main.py              # FastAPI app entry point
├── requirements.txt     # Python dependencies
├── README.md           # This file
└── routers/            # API route handlers
    ├── __init__.py
    ├── phishing.py     # Phishing detection
    ├── training.py     # Training scenarios
    └── uploads.py      # File uploads
```

## Tips

- **Auto-reload**: The server automatically reloads when you save changes
- **Docs always up-to-date**: The `/docs` page automatically updates with your code
- **CORS configured**: Frontend at localhost:5173 can already access this API
- **Type hints**: Use Python type hints for automatic validation and better docs

## Next Steps

1. Implement Gemini API integration for LLM features
2. Add Firebase authentication and database
3. Build out the phishing analysis logic
4. Implement email parsing for .eml files
5. Create the opt-in email sending system
