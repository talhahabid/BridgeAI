from fastapi import APIRouter, HTTPException, status, Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from datetime import datetime
from typing import Dict, Any, List

from utils.auth import get_current_user_id
from utils.gemini_service import GeminiService
from database import get_database

router = APIRouter()
security = HTTPBearer()
gemini_service = GeminiService()

# Mock qualification pathways data
QUALIFICATION_PATHWAYS = {
    "doctor": {
        "title": "Medical Doctor",
        "province_pathways": {
            "ontario": {
                "steps": [
                    {
                        "id": 1,
                        "title": "Medical Council of Canada Qualifying Examination (MCCQE)",
                        "description": "Pass the MCCQE Part I and Part II",
                        "duration": "6-12 months",
                        "cost": "$2,500 - $3,500",
                        "institution": "Medical Council of Canada",
                        "completed": False
                    },
                    {
                        "id": 2,
                        "title": "Provincial Medical Registration",
                        "description": "Apply for registration with the College of Physicians and Surgeons of Ontario",
                        "duration": "2-4 months",
                        "cost": "$1,200 - $2,000",
                        "institution": "CPSO",
                        "completed": False
                    },
                    {
                        "id": 3,
                        "title": "Residency Program",
                        "description": "Complete a residency program in your specialty",
                        "duration": "2-7 years",
                        "cost": "Paid position",
                        "institution": "Various hospitals",
                        "completed": False
                    }
                ],
                "interim_jobs": [
                    "Medical Assistant",
                    "Healthcare Administrator",
                    "Medical Researcher",
                    "Health Policy Analyst"
                ]
            }
        }
    },
    "engineer": {
        "title": "Professional Engineer",
        "province_pathways": {
            "ontario": {
                "steps": [
                    {
                        "id": 1,
                        "title": "Academic Assessment",
                        "description": "Have your engineering degree assessed by Professional Engineers Ontario",
                        "duration": "2-3 months",
                        "cost": "$200 - $500",
                        "institution": "PEO",
                        "completed": False
                    },
                    {
                        "id": 2,
                        "title": "Professional Practice Exam",
                        "description": "Pass the Professional Practice Exam",
                        "duration": "3-6 months",
                        "cost": "$300 - $600",
                        "institution": "PEO",
                        "completed": False
                    },
                    {
                        "id": 3,
                        "title": "Work Experience",
                        "description": "Complete 48 months of engineering work experience",
                        "duration": "4 years",
                        "cost": "None",
                        "institution": "Various employers",
                        "completed": False
                    }
                ],
                "interim_jobs": [
                    "Engineering Technician",
                    "CAD Designer",
                    "Project Coordinator",
                    "Technical Sales"
                ]
            }
        }
    }
}

@router.get("/pathway/{job_type}")
async def get_qualification_pathway(
    job_type: str,
    province: str = "ontario",
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get qualification pathway for a specific job type and province."""
    try:
        pathway = QUALIFICATION_PATHWAYS.get(job_type.lower())
        if not pathway:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"No pathway found for job type: {job_type}"
            )
        
        province_pathway = pathway["province_pathways"].get(province.lower())
        if not province_pathway:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"No pathway found for province: {province}"
            )
        
        # Calculate progress
        total_steps = len(province_pathway["steps"])
        completed_steps = sum(1 for step in province_pathway["steps"] if step.get("completed", False))
        progress_percentage = (completed_steps / total_steps) * 100 if total_steps > 0 else 0
        
        return {
            "job_title": pathway["title"],
            "province": province,
            "steps": province_pathway["steps"],
            "interim_jobs": province_pathway["interim_jobs"],
            "progress": {
                "completed": completed_steps,
                "total": total_steps,
                "percentage": round(progress_percentage, 1)
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving pathway: {str(e)}"
        )

@router.put("/pathway/{job_type}/step/{step_id}")
async def update_step_status(
    job_type: str,
    step_id: int,
    completed: bool,
    province: str = "ontario",
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Update the completion status of a pathway step."""
    try:
        pathway = QUALIFICATION_PATHWAYS.get(job_type.lower())
        if not pathway:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"No pathway found for job type: {job_type}"
            )
        
        province_pathway = pathway["province_pathways"].get(province.lower())
        if not province_pathway:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"No pathway found for province: {province}"
            )
        
        # Find and update the step
        step_found = False
        for step in province_pathway["steps"]:
            if step["id"] == step_id:
                step["completed"] = completed
                step_found = True
                break
        
        if not step_found:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Step {step_id} not found"
            )
        
        # Recalculate progress
        total_steps = len(province_pathway["steps"])
        completed_steps = sum(1 for step in province_pathway["steps"] if step.get("completed", False))
        progress_percentage = (completed_steps / total_steps) * 100 if total_steps > 0 else 0
        
        return {
            "message": f"Step {step_id} marked as {'completed' if completed else 'incomplete'}",
            "progress": {
                "completed": completed_steps,
                "total": total_steps,
                "percentage": round(progress_percentage, 1)
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating step: {str(e)}"
        )

@router.get("/available-jobs")
async def get_available_job_types(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get list of available job types with qualification pathways."""
    try:
        job_types = []
        for job_type, pathway in QUALIFICATION_PATHWAYS.items():
            job_types.append({
                "type": job_type,
                "title": pathway["title"],
                "available_provinces": list(pathway["province_pathways"].keys())
            })
        
        return {"job_types": job_types}
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving job types: {str(e)}"
        )

@router.post("/generate")
async def generate_qualification_path(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    request: Request = None
):
    """Generate a qualification path for the current user using Gemini AI."""
    try:
        user_id = get_current_user_id(credentials.credentials)
        
        # Get database directly from app state
        db = request.app.mongodb
        
        # Get user data
        user = await db.users.find_one({"_id": ObjectId(user_id)})
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Check if user has required data
        if not user.get('job_preference'):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Job preference is required to generate qualification path"
            )
        
        if not user.get('location'):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Location (province) is required to generate qualification path"
            )
        
        # Prepare user data for Gemini
        user_data = {
            'job_preference': user.get('job_preference', ''),
            'origin_country': user.get('origin_country', ''),
            'location': user.get('location', ''),
            'resume_text': user.get('resume_text', ''),
            'resume_keywords': user.get('resume_keywords', [])
        }
        
        # Generate qualification path using Gemini
        result = await gemini_service.generate_qualification_path(user_data)
        
        if not result.get('success'):
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to generate qualification path: {result.get('error', 'Unknown error')}"
            )
        
        # Save the qualification path to the user's profile
        qualification_data = {
            'qualification_path': result['qualification_path'],
            'generated_at': result['generated_at'],
            'raw_response': result.get('raw_response', ''),
            'progress': {
                'completed_steps': [],
                'total_steps': len(result['qualification_path'].get('steps', [])),
                'completion_percentage': 0,
                'started_at': datetime.utcnow().isoformat(),
                'last_updated': datetime.utcnow().isoformat()
            }
        }
        
        # Update user with qualification path
        await db.users.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {"qualification_path": qualification_data}}
        )
        
        return {
            "message": "Qualification path generated successfully",
            "qualification_path": result['qualification_path'],
            "progress": qualification_data['progress']
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating qualification path: {str(e)}"
        )

@router.get("/path")
async def get_qualification_path(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    request: Request = None
):
    """Get the current user's qualification path and progress."""
    try:
        user_id = get_current_user_id(credentials.credentials)
        
        # Get database directly from app state
        db = request.app.mongodb
        
        # Get user data
        user = await db.users.find_one({"_id": ObjectId(user_id)})
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        qualification_data = user.get('qualification_path')
        if not qualification_data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No qualification path found. Generate one first."
            )
        
        return {
            "qualification_path": qualification_data['qualification_path'],
            "progress": qualification_data['progress'],
            "generated_at": qualification_data['generated_at']
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving qualification path: {str(e)}"
        )

@router.put("/progress")
async def update_progress(
    step_number: int,
    completed: bool,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    request: Request = None
):
    """Update the progress of a specific step in the qualification path."""
    try:
        user_id = get_current_user_id(credentials.credentials)
        
        # Get database directly from app state
        db = request.app.mongodb
        
        # Get user data
        user = await db.users.find_one({"_id": ObjectId(user_id)})
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        qualification_data = user.get('qualification_path')
        if not qualification_data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No qualification path found"
            )
        
        progress = qualification_data['progress']
        completed_steps = progress.get('completed_steps', [])
        
        # Update completed steps
        if completed and step_number not in completed_steps:
            completed_steps.append(step_number)
        elif not completed and step_number in completed_steps:
            completed_steps.remove(step_number)
        
        # Calculate new progress
        total_steps = progress.get('total_steps', 0)
        completion_percentage = (len(completed_steps) / total_steps * 100) if total_steps > 0 else 0
        
        # Update progress
        updated_progress = {
            'completed_steps': completed_steps,
            'total_steps': total_steps,
            'completion_percentage': round(completion_percentage, 1),
            'started_at': progress.get('started_at'),
            'last_updated': datetime.utcnow().isoformat()
        }
        
        # Update user with new progress
        await db.users.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {"qualification_path.progress": updated_progress}}
        )
        
        return {
            "message": "Progress updated successfully",
            "progress": updated_progress
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating progress: {str(e)}"
        )

@router.delete("/path")
async def delete_qualification_path(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    request: Request = None
):
    """Delete the current user's qualification path."""
    try:
        user_id = get_current_user_id(credentials.credentials)
        
        # Get database directly from app state
        db = request.app.mongodb
        
        # Remove qualification path from user
        result = await db.users.update_one(
            {"_id": ObjectId(user_id)},
            {"$unset": {"qualification_path": ""}}
        )
        
        if result.modified_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No qualification path found to delete"
            )
        
        return {"message": "Qualification path deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting qualification path: {str(e)}"
        ) 