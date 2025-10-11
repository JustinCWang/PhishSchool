from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import phishing, training, uploads, generate

# Initialize FastAPI app
app = FastAPI(
    title="PhishSchool API",
    description="Backend API for PhishSchool - A phishing education and detection platform",
    version="1.0.0"
)

# Configure CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(phishing.router, prefix="/api/phishing", tags=["phishing"])
app.include_router(training.router, prefix="/api/training", tags=["training"])
app.include_router(uploads.router, prefix="/api/uploads", tags=["uploads"])
app.include_router(generate.router, prefix="/api/generate", tags=["generate"])

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

