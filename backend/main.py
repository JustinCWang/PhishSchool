from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import uploads, generate, email, tracking

# Initialize FastAPI app
app = FastAPI(
    title="PhishSchool API",
    description="Backend API for PhishSchool - A phishing education and detection platform",
    version="1.0.0"
)

# Configure CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "https://phish-school.vercel.app",
        "https://phishschoolbackend.vercel.app",
    ],
    allow_origin_regex=r"https://.*\.vercel\.app$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
# Note: On Vercel, the app is mounted under "/api". Using non-"/api" prefixes here
# ensures the final public paths remain "/api/<route>" (no double "/api").
app.include_router(uploads.router, prefix="/uploads", tags=["uploads"])  
app.include_router(generate.router, prefix="/generate", tags=["generate"])  
app.include_router(email.router, prefix="/email", tags=["email"])  
app.include_router(tracking.router, prefix="", tags=["tracking"])  # exposes /track/*

@app.get("/")
async def root():
    """Root endpoint - API health check"""
    return {
        "message": "Welcome to PhishSchool API",
        "status": "healthy",
        "version": "1.0.0"
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

