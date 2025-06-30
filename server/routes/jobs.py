import os
import httpx
from fastapi import APIRouter, Query, HTTPException
from typing import Optional
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

router = APIRouter()

JSEARCH_API_URL = "https://jsearch.p.rapidapi.com/search"
RAPIDAPI_KEY = os.getenv("RAPIDAPI_KEY")

if not RAPIDAPI_KEY:
    # RapidAPI key not configured
    pass

HEADERS = {
    "x-rapidapi-key": RAPIDAPI_KEY,
    "x-rapidapi-host": "jsearch.p.rapidapi.com"
}

@router.get("/search")
async def search_jobs(
    title: Optional[str] = Query(None, description="Job title or keywords"),
    location: Optional[str] = Query(None, description="Job location"),
    page: int = Query(1, ge=1, description="Page number"),
    num_pages: int = Query(1, ge=1, le=10, description="Number of pages to fetch"),
    country: str = Query("ca", description="Country code (default: ca)"),
    date_posted: str = Query("all", description="Date posted filter (default: all)")
):
    """
    Search for jobs using RapidAPI JSearch
    """
    if not RAPIDAPI_KEY:
        raise HTTPException(status_code=500, detail="RapidAPI key not configured")
    
    # Build search query
    query_parts = []
    if title:
        query_parts.append(title)
    if location:
        query_parts.append(f"in {location}")
    
    if not query_parts:
        query_parts = ["software", "in Canada"]  # Default search
    
    search_query = " ".join(query_parts)
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(
                JSEARCH_API_URL, 
                params={
                    "query": search_query,
                    "page": str(page),
                    "num_pages": str(num_pages),
                    "country": country,
                    "date_posted": date_posted
                }, 
                headers=HEADERS
            )
            
            if response.status_code != 200:
                raise HTTPException(
                    status_code=response.status_code, 
                    detail=f"RapidAPI error: {response.text}"
                )

        data = response.json()
        
        # Extract and format job data
        jobs = data.get("data", [])
        formatted_jobs = []
        
        for job in jobs:
            formatted_job = {
                "job_title": job.get("job_title", "N/A"),
                "company_name": job.get("employer_name", "N/A"),
                "job_city": job.get("job_city", "N/A"),
                "job_state": job.get("job_state", "N/A"),
                "job_country": job.get("job_country", "N/A"),
                "job_apply_link": job.get("job_apply_link", ""),
                "job_description": job.get("job_description", "No description available"),
                "job_employment_type": job.get("job_employment_type", "N/A"),
                "job_salary": job.get("job_salary", "N/A"),
                "job_posted_at": job.get("job_posted_at", "N/A"),
                "job_required_skills": job.get("job_required_skills", []),
                "job_required_experience": job.get("job_required_experience", "N/A"),
                "job_required_education": job.get("job_required_education", "N/A")
            }
            formatted_jobs.append(formatted_job)
        
        return {
            "results": formatted_jobs,
            "total_results": len(formatted_jobs),
            "search_query": search_query,
            "page": page
        }

    except httpx.TimeoutException:
        raise HTTPException(status_code=408, detail="Request timeout")
    except httpx.RequestError as e:
        raise HTTPException(status_code=500, detail=f"Request error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.get("/health")
async def health_check():
    """
    Check if the job search API is working
    """
    return {
        "status": "healthy",
        "rapidapi_configured": bool(RAPIDAPI_KEY),
        "service": "job-search"
    }
