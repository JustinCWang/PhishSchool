"""FastAPI application entry for PhishSchool backend.

Configures CORS, mounts routers under both root and `/api`, and exposes
simple health endpoints for deploy environments.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import uploads, generate, email

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

# Include routers under both root and /api for deploy flexibility
for base_prefix in ("", "/api"):
    app.include_router(uploads.router, prefix=f"{base_prefix}/uploads", tags=["uploads"])  
    app.include_router(generate.router, prefix=f"{base_prefix}/generate", tags=["generate"])  
    app.include_router(email.router, prefix=f"{base_prefix}/email", tags=["email"])  

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

# Mirror health and root under /api as well
@app.get("/api")
async def api_root():
    return {
        "message": "Welcome to PhishSchool API",
        "status": "healthy",
        "version": "1.0.0"
    }

@app.get("/api/health")
async def api_health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

