from fastapi import APIRouter, HTTPException, status, Depends, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import List, Optional
import json

from database import get_database

router = APIRouter()
security = HTTPBearer()

# Mock job data - in a real app, this would come from job APIs
MOCK_JOBS = [
    {
        "id": "1",
        "title": "Software Engineer",
        "company": "TechCorp Canada",
        "location": "Toronto, ON",
        "type": "Full-time",
        "salary": "$80,000 - $120,000",
        "description": "We are looking for a skilled software engineer...",
        "requirements": ["Python", "JavaScript", "React", "3+ years experience"],
        "posted_date": "2024-01-15"
    },
    {
        "id": "2",
        "title": "Data Analyst",
        "company": "DataFlow Inc",
        "location": "Vancouver, BC",
        "type": "Full-time",
        "salary": "$70,000 - $90,000",
        "description": "Join our data team to analyze business metrics...",
        "requirements": ["SQL", "Python", "Excel", "Statistics"],
        "posted_date": "2024-01-14"
    },
    {
        "id": "3",
        "title": "Marketing Manager",
        "company": "Growth Marketing",
        "location": "Montreal, QC",
        "type": "Full-time",
        "salary": "$75,000 - $95,000",
        "description": "Lead our marketing initiatives...",
        "requirements": ["Marketing", "Digital Marketing", "Leadership"],
        "posted_date": "2024-01-13"
    }
]

@router.get("/search")
async def search_jobs(
    title: Optional[str] = Query(None, description="Job title to search for"),
    location: Optional[str] = Query(None, description="Location to search in"),
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Search for jobs based on title and location."""
    try:
        # In a real implementation, this would call job APIs
        # For now, we'll filter the mock data
        filtered_jobs = MOCK_JOBS
        
        if title:
            filtered_jobs = [job for job in filtered_jobs 
                           if title.lower() in job["title"].lower()]
        
        if location:
            filtered_jobs = [job for job in filtered_jobs 
                           if location.lower() in job["location"].lower()]
        
        return {
            "jobs": filtered_jobs,
            "total": len(filtered_jobs),
            "filters": {
                "title": title,
                "location": location
            }
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error searching jobs: {str(e)}"
        )

@router.get("/{job_id}")
async def get_job_details(
    job_id: str,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get detailed information about a specific job."""
    try:
        # Find job in mock data
        job = next((job for job in MOCK_JOBS if job["id"] == job_id), None)
        
        if not job:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Job not found"
            )
        
        return job
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving job details: {str(e)}"
        )

@router.get("/recommendations")
async def get_job_recommendations(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get job recommendations based on user profile."""
    try:
        # In a real implementation, this would analyze user skills and preferences
        # For now, return a subset of mock jobs
        return {
            "recommendations": MOCK_JOBS[:2],
            "reason": "Based on your profile and skills"
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error getting recommendations: {str(e)}"
        ) 