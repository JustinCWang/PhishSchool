from fastapi import APIRouter, File, UploadFile

router = APIRouter()

@router.get("/")
async def get_upload_info():
    """Get information about file upload endpoints"""
    return {
        "message": "File upload endpoint",
        "description": "Upload .eml files for phishing analysis",
        "accepted_formats": [".eml"]
    }

@router.post("/eml")
async def upload_eml_file(file: UploadFile = File(...)):
    """
    Upload an .eml file for phishing analysis
    TODO: Implement .eml parsing and analysis
    """
    # TODO: Parse EML file and analyze with Gemini API
    return {"status": "not_implemented", "filename": file.filename}

