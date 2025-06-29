from fastapi import APIRouter, HTTPException, status, Depends, UploadFile, File, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
import os
from typing import Dict, Any

from utils.auth import get_current_user_id
from utils.pdf_parser import resume_parser
from database import get_database

router = APIRouter()
security = HTTPBearer()

@router.post("/upload")
async def upload_resume(
    request: Request,
    file: UploadFile = File(...),
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Upload and parse a PDF resume."""
    try:
        # Verify user
        user_id = get_current_user_id(credentials.credentials)
        
        # Get database
        db = await get_database(request)
        
        # Check file type
        if not file.filename or not file.filename.lower().endswith('.pdf'):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only PDF files are allowed"
            )
        
        # Check file size (max 10MB)
        if file.size and file.size > 10 * 1024 * 1024:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File size must be less than 10MB"
            )
        
        # Read file content
        file_content = await file.read()
        
        # Parse PDF
        parse_result = resume_parser.extract_text_from_pdf(file_content)
        
        if not parse_result.get('parsed_successfully', False):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to parse PDF: {parse_result.get('error', 'Unknown error')}"
            )
        
        # Clean and structure the text
        full_text = parse_result.get('full_text', '')
        if isinstance(full_text, str):
            clean_text = resume_parser.get_clean_text(full_text)
            keywords = resume_parser.extract_keywords(full_text)
        else:
            clean_text = ""
            keywords = []
        
        structured_content = parse_result.get('structured_content', {})
        if not isinstance(structured_content, dict):
            structured_content = {}
        
        # Update user's resume information
        update_data = {
            "resume_text": clean_text,
            "resume_filename": file.filename,
            "resume_structured": structured_content,
            "resume_keywords": keywords
        }
        
        await db.users.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": update_data}
        )
        
        return {
            "message": "Resume uploaded and parsed successfully",
            "filename": file.filename,
            "text_length": len(clean_text),
            "sections_found": list(structured_content.keys()),
            "keywords_extracted": keywords
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing resume: {str(e)}"
        )

@router.get("/content")
async def get_resume_content(
    request: Request,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Get the current user's parsed resume content."""
    try:
        # Verify user
        user_id = get_current_user_id(credentials.credentials)
        
        # Get database
        db = await get_database(request)
        
        # Get user's resume data
        user = await db.users.find_one({"_id": ObjectId(user_id)})
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        return {
            "resume_text": user.get("resume_text"),
            "resume_filename": user.get("resume_filename"),
            "resume_structured": user.get("resume_structured", {}),
            "resume_keywords": user.get("resume_keywords", []),
            "has_resume": bool(user.get("resume_text"))
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving resume: {str(e)}"
        )

@router.delete("/remove")
async def remove_resume(
    request: Request,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Remove the current user's resume."""
    try:
        # Verify user
        user_id = get_current_user_id(credentials.credentials)
        
        # Get database
        db = await get_database(request)
        
        # Remove resume data
        update_data = {
            "resume_text": None,
            "resume_filename": None,
            "resume_structured": None,
            "resume_keywords": None
        }
        
        result = await db.users.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": update_data}
        )
        
        if result.modified_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No resume found to remove"
            )
        
        return {"message": "Resume removed successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error removing resume: {str(e)}"
        ) 