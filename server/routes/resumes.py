from fastapi import APIRouter, HTTPException, status, Depends, UploadFile, File, Request, Form
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import FileResponse
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
import os
from typing import Dict, Any, Optional
import tempfile
from selenium.webdriver.chrome.service import Service
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time

from utils.auth import get_current_user_id, get_current_user
from utils.pdf_parser import resume_parser
from database import get_database
from models.user import UserResponse

router = APIRouter()
security = HTTPBearer()

@router.post("/upload")
async def upload_resume(
    file: UploadFile = File(...),
    credentials: HTTPAuthorizationCredentials = Depends(security),
    request: Request = None
):
    """Upload and parse a PDF resume."""
    try:
        # Verify user
        user_id = get_current_user_id(credentials.credentials)
        
        # Get database
        db = await get_database(request)
        
        # Check file type
        if not file.filename.lower().endswith('.pdf'):
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
        
        # Update user's resume information - now including the PDF file
        update_data = {
            "resume_text": clean_text,
            "resume_filename": file.filename,
            "resume_structured": structured_content,
            "resume_keywords": keywords,
            "resume_file": file_content  # Store the actual PDF file as binary data
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
    credentials: HTTPAuthorizationCredentials = Depends(security),
    request: Request = None
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
    credentials: HTTPAuthorizationCredentials = Depends(security),
    request: Request = None
):
    """Remove the current user's resume."""
    try:
        # Verify user
        user_id = get_current_user_id(credentials.credentials)
        
        # Get database
        db = await get_database(request)
        
        # Remove resume data - including the PDF file
        update_data = {
            "resume_text": None,
            "resume_filename": None,
            "resume_structured": None,
            "resume_keywords": None,
            "resume_file": None  # Also remove the stored PDF file
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

@router.post("/ats-evaluate")
async def evaluate_resume_ats(
    resume_file: UploadFile = File(...),
    job_description: str = Form(...),
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Evaluate resume against job description using ATS scoring
    """
    try:
        # Validate file type
        if not resume_file.filename.lower().endswith('.pdf'):
            raise HTTPException(status_code=400, detail="Only PDF files are supported")
        
        # Save uploaded file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as temp_file:
            content = await resume_file.read()
            temp_file.write(content)
            temp_file_path = temp_file.name
        
        # Initialize Chrome driver
        chrome_driver_path = os.path.join(os.getcwd(), "chrome_driver", "chromedriver.exe")
        if not os.path.exists(chrome_driver_path):
            raise HTTPException(status_code=500, detail="Chrome driver not found")
        
        # Configure Chrome options for headless operation
        chrome_options = webdriver.ChromeOptions()
        chrome_options.add_argument("--headless")  # Run in background
        chrome_options.add_argument("--no-sandbox")  # Required for some environments
        chrome_options.add_argument("--disable-dev-shm-usage")  # Disable shared memory
        chrome_options.add_argument("--disable-gpu")  # Disable GPU acceleration
        chrome_options.add_argument("--window-size=1920,1080")  # Set window size
        chrome_options.add_argument("--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")  # Set user agent
        chrome_options.add_argument("--disable-extensions")  # Disable extensions
        chrome_options.add_argument("--disable-plugins")  # Disable plugins
        chrome_options.add_argument("--disable-images")  # Disable images for faster loading
        chrome_options.add_argument("--log-level=3")  # Minimize logging
        chrome_options.add_experimental_option("excludeSwitches", ["enable-logging"])  # Disable logging
        chrome_options.add_experimental_option('useAutomationExtension', False)  # Disable automation extension
        
        service = Service(chrome_driver_path)
        driver = webdriver.Chrome(service=service, options=chrome_options)
        
        try:
            # Navigate to Hugging Face ATS screener
            driver.get("https://huggingface.co/spaces/santu24/ATS-Resume-Screener")
            
            # Wait for iframe and switch to it
            wait = WebDriverWait(driver, 15)
            iframe = wait.until(EC.presence_of_element_located((By.ID, "iFrameResizer0")))
            driver.switch_to.frame(iframe)
            
            # Input job description
            job_description_textarea = wait.until(EC.presence_of_element_located((By.ID, "text_area_1")))
            job_description_textarea.clear()
            job_description_textarea.send_keys(job_description)
            
            # Upload resume
            resume_input = wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, '[data-testid="stFileUploaderDropzoneInput"]')))
            resume_input.send_keys(temp_file_path)
            time.sleep(3)
            
            # Click percentage match button
            percentage_match_btn = driver.find_elements(By.CSS_SELECTOR, ".st-emotion-cache-7ym5gk.ef3psqc12")[1]
            percentage_match_btn.click()
            
            # Wait for analysis results
            elements = wait.until(lambda d: len(d.find_elements(By.CSS_SELECTOR, ".st-emotion-cache-vdokb0.e1nzilvr4")) > 5)
            analysis_div = driver.find_elements(By.CSS_SELECTOR, ".st-emotion-cache-vdokb0.e1nzilvr4")[4]
            p_tags = analysis_div.find_elements(By.TAG_NAME, "p")
            
            # Extract feedback
            feedback_list = []
            for p in p_tags:
                feedback_list.append(p.text)
            
            # Clean up temporary file
            os.unlink(temp_file_path)
            
            return {
                "success": True,
                "feedback": feedback_list,
                "resume_filename": resume_file.filename,
                "job_description_preview": job_description[:100] + "..." if len(job_description) > 100 else job_description
            }
            
        finally:
            driver.quit()
            
    except Exception as e:
        # Clean up temporary file if it exists
        if 'temp_file_path' in locals():
            try:
                os.unlink(temp_file_path)
            except:
                pass
        
        raise HTTPException(status_code=500, detail=f"ATS evaluation failed: {str(e)}")

@router.get("/download")
async def download_resume(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    request: Request = None
):
    """Download the current user's resume file."""
    try:
        # Verify user
        user_id = get_current_user_id(credentials.credentials)
        
        # Get database
        db = await get_database(request)
        
        # Get user's resume data
        user = await db.users.find_one({"_id": ObjectId(user_id)})
        if not user or not user.get("resume_filename"):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No resume found"
            )
        
        # Get the stored PDF file
        resume_file = user.get("resume_file")
        if not resume_file:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Resume file not found"
            )
        
        filename = user.get("resume_filename", "resume.pdf")
        
        # Create a temporary file with the PDF content
        with tempfile.NamedTemporaryFile(mode='wb', delete=False, suffix='.pdf') as temp_file:
            temp_file.write(resume_file)
            temp_file_path = temp_file.name
        
        return FileResponse(
            path=temp_file_path,
            filename=filename,
            media_type='application/pdf'
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error downloading resume: {str(e)}"
        ) 