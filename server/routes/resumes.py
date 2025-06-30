from fastapi import APIRouter, HTTPException, status, Depends, UploadFile, File, Request, Form, Query
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
import httpx
import subprocess
import json
from datetime import datetime
import logging

from utils.auth import get_current_user_id, get_current_user
from utils.pdf_parser import resume_parser
from utils.pdf_editor import pdf_editor
from database import get_database
from models.user import UserResponse

router = APIRouter()
security = HTTPBearer()
logger = logging.getLogger("ats_eval")

# Check if Groq service is available
def get_groq_service():
    try:
        from utils.groq_service import groq_service
        if groq_service is None:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="AI document generation service is not available. Please set GROQ_API_KEY environment variable."
            )
        return groq_service
    except ImportError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI document generation service is not available."
        )

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
        
        # Get database directly from app state
        db = request.app.mongodb
        
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
        
        # Save PDF to disk and store path
        resume_dir = os.path.join(os.getcwd(), "server", "resumes")
        os.makedirs(resume_dir, exist_ok=True)
        resume_path = os.path.join(resume_dir, f"{user_id}_{file.filename}")
        with open(resume_path, "wb") as f:
            f.write(file_content)

        # Update user's resume information - now including the PDF file path
        update_data = {
            "resume_text": clean_text,
            "resume_filename": file.filename,
            "resume_structured": structured_content,
            "resume_keywords": keywords,
            "resume_file_path": resume_path  # Save the path!
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
        
        # Get database directly from app state
        db = request.app.mongodb
        
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
        
        # Get database directly from app state
        db = request.app.mongodb
        
        # Remove resume data - including the PDF file
        update_data = {
            "resume_text": None,
            "resume_filename": None,
            "resume_structured": None,
            "resume_keywords": None,
            "resume_file_path": None  # Also remove the stored PDF file path
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
    request: Request,
    resume_file: UploadFile = File(...),
    job_description: str = Form(...),
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """
    Evaluate resume against job description using ATS scoring
    """
    try:
        # Verify user
        user_id = get_current_user_id(credentials.credentials)
        
        # Validate file type
        if not resume_file.filename or not resume_file.filename.lower().endswith('.pdf'):
            raise HTTPException(status_code=400, detail="Only PDF files are supported")
        
        # Save uploaded file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as temp_file:
            content = await resume_file.read()
            temp_file.write(content)
            temp_file_path = temp_file.name
        
        try:
            # Initialize Chrome driver with headless mode
            chrome_driver_path = os.path.join(os.getcwd(), "chrome_driver", "chromedriver.exe")
            if not os.path.exists(chrome_driver_path):
                raise HTTPException(status_code=500, detail="Chrome driver not found. ATS evaluation cannot proceed.")
            
            # Configure Chrome options for headless operation
            chrome_options = webdriver.ChromeOptions()
            chrome_options.add_argument("--headless")
            chrome_options.add_argument("--no-sandbox")
            chrome_options.add_argument("--disable-dev-shm-usage")
            chrome_options.add_argument("--disable-gpu")
            chrome_options.add_argument("--window-size=1920,1080")
            chrome_options.add_argument("--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36")

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
                
                return {
                    "success": True,
                    "feedback": feedback_list,
                    "resume_filename": resume_file.filename,
                    "job_description_preview": job_description[:100] + "..." if len(job_description) > 100 else job_description
                }
                
            finally:
                driver.quit()
                
        except Exception as web_error:
            raise HTTPException(status_code=500, detail=f"ATS evaluation failed: {str(web_error)}")
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"ATS evaluation failed: {str(e)}")
    finally:
        # Clean up temporary file if it exists
        if 'temp_file_path' in locals():
            try:
                os.unlink(temp_file_path)
            except:
                pass

@router.get("/ats-result/{user_id}")
async def get_ats_result(
    user_id: str,
    request: Request,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Get the latest ATS evaluation result for a user"""
    try:
        logger.info(f"Fetching ATS result for user {user_id}")
        current_user_id = get_current_user_id(credentials.credentials)
        if current_user_id != user_id:
            logger.warning(f"User {current_user_id} not authorized to access ATS result for {user_id}")
            raise HTTPException(status_code=403, detail="Not authorized to access this result")
        db = request.app.mongodb
        result = await db.ats_results.find_one(
            {"user_id": ObjectId(user_id)},
            sort=[("created_at", -1)]
        )
        if not result:
            logger.info(f"No ATS result found for user {user_id}")
            raise HTTPException(status_code=404, detail="No ATS evaluation result found")
        logger.info(f"ATS result found for user {user_id}")
        return {
            "success": True,
            "result": result["result"],
            "created_at": result["created_at"],
            "status": result["status"]
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving ATS result for user {user_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Error retrieving ATS result: {str(e)}")

@router.get("/download")
async def download_resume(
    request: Request,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Download the current user's resume file."""
    try:
        # Verify user
        user_id = get_current_user_id(credentials.credentials)
        
        # Get database directly from app state
        db = request.app.mongodb
        
        # Get user's resume data
        user = await db.users.find_one({"_id": ObjectId(user_id)})
        if not user or not user.get("resume_filename"):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No resume found"
            )
        
        # Get the stored PDF file path
        resume_file_path = user.get("resume_file_path")
        if not resume_file_path or not os.path.exists(resume_file_path):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Resume file not found"
            )
        
        filename = user.get("resume_filename", "resume.pdf")
        
        # Return the PDF file directly
        return FileResponse(
            path=resume_file_path,
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

@router.post("/generate-documents")
async def generate_tailored_documents(
    request: Request,
    job_description: str = Form(...),
    document_type: str = Form(..., description="cover_letter, optimized_resume, or both"),
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """
    Generate AI-powered tailored documents (cover letter and/or optimized resume)
    """
    try:
        # Verify user
        user_id = get_current_user_id(credentials.credentials)
        
        # Get database directly from app state
        db = request.app.mongodb
        
        # Get user's resume data
        user = await db.users.find_one({"_id": ObjectId(user_id)})
        if not user or not user.get("resume_text"):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No resume found. Please upload a resume first."
            )
        
        # Extract user information
        user_info = {
            "name": user.get("name", ""),
            "location": user.get("location", ""),
            "job_preference": user.get("job_preference", ""),
            "origin_country": user.get("origin_country", ""),
            "resume_text": user.get("resume_text", ""),
            "resume_keywords": user.get("resume_keywords", [])
        }
        
        generated_files = []
        
        # Generate cover letter if requested
        if document_type in ["cover_letter", "both"]:
            cover_letter_content = await generate_cover_letter(user_info, job_description)
            cover_letter_pdf = await create_latex_pdf(cover_letter_content, "cover_letter", user_info["name"])
            generated_files.append({
                "type": "cover_letter",
                "filename": f"{user_info['name'].replace(' ', '_')}_Cover_Letter.pdf",
                "path": cover_letter_pdf
            })
        
        # Generate optimized resume if requested
        if document_type in ["optimized_resume", "both"]:
            optimized_resume_content = await generate_optimized_resume(user_info, job_description)
            optimized_resume_pdf = await create_latex_pdf(optimized_resume_content, "resume", user_info["name"])
            generated_files.append({
                "type": "optimized_resume",
                "filename": f"{user_info['name'].replace(' ', '_')}_Optimized_Resume.pdf",
                "path": optimized_resume_pdf
            })
        
        return {
            "success": True,
            "message": f"Generated {len(generated_files)} document(s) successfully",
            "files": generated_files
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating documents: {str(e)}"
        )

async def generate_cover_letter(user_info: Dict[str, Any], job_description: str) -> str:
    """Generate a tailored cover letter using Groq AI"""
    
    try:
        response = await get_groq_service().generate_cover_letter(user_info, job_description)
        return response
    except Exception as e:
        # Fallback cover letter template
        return f"""
Dear Hiring Manager,

I am writing to express my strong interest in the position you have advertised. As a {user_info['job_preference']} with experience from {user_info['origin_country']}, I am excited about the opportunity to contribute to your team in {user_info['location']}, Canada.

My background includes {', '.join(user_info['resume_keywords'][:5])}, which I believe align well with the requirements of this position. I am particularly drawn to this opportunity because it represents the kind of role where I can make meaningful contributions while continuing to grow professionally in the Canadian market.

I am confident that my skills and experience would be valuable to your organization, and I am excited about the possibility of joining your team. I would welcome the opportunity to discuss how my background, skills, and enthusiasm would make me a valuable addition to your company.

Thank you for considering my application. I look forward to the possibility of speaking with you about this opportunity.

Sincerely,
{user_info['name']}
"""

async def generate_optimized_resume(user_info: Dict[str, Any], job_description: str) -> str:
    """Generate an optimized resume using Groq AI"""
    
    try:
        response = await get_groq_service().generate_optimized_resume(user_info, job_description)
        return response
    except Exception as e:
        # Fallback optimized resume
        return f"""
{user_info['name'].upper()}
{user_info['location']}, Canada

PROFESSIONAL SUMMARY
Experienced {user_info['job_preference']} with background from {user_info['origin_country']}. Skilled in {', '.join(user_info['resume_keywords'][:3])} with a proven track record of delivering results in dynamic environments.

SKILLS
{', '.join(user_info['resume_keywords'])}

EXPERIENCE
[Optimized experience based on job requirements]

EDUCATION
[Relevant education and certifications]

ADDITIONAL INFORMATION
• Adaptable professional with international experience
• Strong cross-cultural communication skills
• Committed to continuous learning and professional development
"""

async def create_latex_pdf(content: str, document_type: str, user_name: str) -> str:
    """Create a PDF using ReportLab instead of LaTeX"""
    
    try:
        if document_type == "cover_letter":
            pdf_path = pdf_editor.create_cover_letter_pdf(content, user_name, f"{user_name}_Cover_Letter.pdf")
        else:  # resume
            pdf_path = pdf_editor.create_resume_pdf(content, user_name, f"{user_name}_Optimized_Resume.pdf")
        
        return pdf_path
        
    except Exception as e:
        # Fallback: create a simple text file
        with tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.txt') as temp_file:
            temp_file.write(content)
            return temp_file.name

@router.get("/preview-generated/{file_path:path}")
async def preview_generated_document(
    request: Request,
    file_path: str,
    token: str = Query(..., description="Authentication token")
):
    """Preview a generated document in iframe"""
    try:
        # Verify user using token from query parameter
        user_id = get_current_user_id(token)
        
        # Check if the file exists
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="Generated document not found")
        
        # Get filename from path
        filename = os.path.basename(file_path)
        
        # Return the PDF file with proper headers for iframe preview
        return FileResponse(
            path=file_path,
            filename=filename,
            media_type='application/pdf',
            headers={
                'Content-Disposition': f'inline; filename="{filename}"',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization'
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error previewing document: {str(e)}")

@router.get("/download-generated/{file_path:path}")
async def download_generated_document(
    file_path: str,
    request: Request,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Download a generated document"""
    try:
        # Verify user
        user_id = get_current_user_id(credentials.credentials)
        
        # Check if the file exists
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="Generated document not found")
        
        # Get filename from path
        filename = os.path.basename(file_path)
        
        # Return the PDF file for download
        return FileResponse(
            path=file_path,
            filename=filename,
            media_type='application/pdf',
            headers={
                'Content-Disposition': f'attachment; filename="{filename}"'
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error downloading document: {str(e)}")

@router.get("/preview")
async def preview_resume(
    request: Request,
    token: str = Query(..., description="Authentication token")
):
    """Preview the uploaded resume PDF in an iframe"""
    try:
        user_id = get_current_user_id(token)
        
        # Get database directly from app state
        db = request.app.mongodb
        
        user = await db.users.find_one({"_id": ObjectId(user_id)})
        if not user or not user.get("resume_file_path"):
            raise HTTPException(status_code=404, detail="Resume file not found")
        
        file_path = user["resume_file_path"]
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="Resume file not found")
        
        filename = os.path.basename(file_path)
        return FileResponse(
            path=file_path,
            filename=filename,
            media_type='application/pdf',
            headers={
                'Content-Disposition': f'inline; filename="{filename}"',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization'
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error previewing resume: {str(e)}")

async def perform_basic_ats_analysis(resume_file: UploadFile, job_description: str, temp_file_path: str) -> dict:
    """Perform basic ATS analysis when web scraping fails"""
    try:
        # Read the resume content
        with open(temp_file_path, 'rb') as f:
            resume_content = f.read()
        
        # Parse the PDF to extract text
        parse_result = resume_parser.extract_text_from_pdf(resume_content)
        resume_text = str(parse_result.get('full_text', '')) if parse_result.get('parsed_successfully') else ''
        
        # Basic keyword matching
        job_keywords = set(job_description.lower().split())  # type: ignore
        resume_keywords = set(resume_text.lower().split())
        
        # Calculate basic match percentage
        common_keywords = job_keywords.intersection(resume_keywords)
        match_percentage = len(common_keywords) / len(job_keywords) * 100 if job_keywords else 0
        
        # Generate basic feedback
        feedback = [
            f"Basic ATS Analysis Results:",
            f"Keyword Match: {len(common_keywords)} out of {len(job_keywords)} keywords found",
            f"Match Percentage: {match_percentage:.1f}%",
            "",
            "Recommendations:",
            "• Ensure your resume includes relevant keywords from the job description",
            "• Use industry-standard terminology",
            "• Include specific skills and technologies mentioned in the job posting",
            "• Keep formatting simple and ATS-friendly",
            "• Avoid graphics, tables, or complex layouts"
        ]
        
        if common_keywords:
            feedback.append(f"• Found keywords: {', '.join(list(common_keywords)[:10])}")
        
        return {
            "success": True,
            "feedback": feedback,
            "resume_filename": resume_file.filename,
            "job_description_preview": job_description[:100] + "..." if len(job_description) > 100 else job_description,
            "match_percentage": round(match_percentage, 1),
            "analysis_type": "basic"
        }
        
    finally:
        # Clean up temporary file
        try:
            os.unlink(temp_file_path)
        except:
            pass 