from fastapi import APIRouter, HTTPException, status, Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from datetime import datetime

from models.user import UserUpdate, UserResponse
from utils.auth import get_current_user_id
from database import get_database

router = APIRouter()
security = HTTPBearer()

@router.get("/profile", response_model=UserResponse)
async def get_profile(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    request: Request = None
):
    """Get current user's profile."""
    try:
        user_id = get_current_user_id(credentials.credentials)
        
        # Get database directly from app state
        db = request.app.mongodb
        
        user = await db.users.find_one({"_id": ObjectId(user_id)})
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Convert ObjectId to string for the response
        user["_id"] = str(user["_id"])
        
        return UserResponse(**user)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving profile: {str(e)}"
        )

@router.put("/profile")
async def update_profile(
    user_data: UserUpdate,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    request: Request = None
):
    """Update current user's profile."""
    try:
        user_id = get_current_user_id(credentials.credentials)
        
        # Get database directly from app state
        db = request.app.mongodb
        
        # Prepare update data (only include non-None fields)
        update_data = {}
        if user_data.name is not None:
            update_data["name"] = user_data.name
        if user_data.location is not None:
            update_data["location"] = user_data.location
        if user_data.job_preference is not None:
            update_data["job_preference"] = user_data.job_preference
        if user_data.origin_country is not None:
            update_data["origin_country"] = user_data.origin_country
        
        update_data["updated_at"] = datetime.utcnow()
        
        if not update_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No fields to update"
            )
        
        result = await db.users.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": update_data}
        )
        
        if result.modified_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        return {"message": "Profile updated successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating profile: {str(e)}"
        )

@router.delete("/account")
async def delete_account(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    request: Request = None
):
    """Delete current user's account."""
    try:
        user_id = get_current_user_id(credentials.credentials)
        
        # Get database directly from app state
        db = request.app.mongodb
        
        result = await db.users.delete_one({"_id": ObjectId(user_id)})
        
        if result.deleted_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        return {"message": "Account deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting account: {str(e)}"
        )

@router.get("/by-id/{user_id}", response_model=UserResponse)
async def get_user_by_id(
    user_id: str,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    request: Request = None
):
    """Get user profile by ID."""
    try:
        # Verify the requesting user is the same as the requested user
        requesting_user_id = get_current_user_id(credentials.credentials)
        
        if requesting_user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to access this profile"
            )
        
        # Get database directly from app state
        db = request.app.mongodb
        
        user = await db.users.find_one({"_id": ObjectId(user_id)})
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Convert ObjectId to string for the response
        user["_id"] = str(user["_id"])
        
        return UserResponse(**user)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving user: {str(e)}"
        )

@router.put("/by-id/{user_id}")
async def update_user_by_id(
    user_id: str,
    user_data: UserUpdate,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    request: Request = None
):
    """Update user profile by ID."""
    try:
        # Verify the requesting user is the same as the requested user
        requesting_user_id = get_current_user_id(credentials.credentials)
        
        if requesting_user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to update this profile"
            )
        
        # Get database directly from app state
        db = request.app.mongodb
        
        # Prepare update data (only include non-None fields)
        update_data = {}
        if user_data.name is not None:
            update_data["name"] = user_data.name
        if user_data.location is not None:
            update_data["location"] = user_data.location
        if user_data.job_preference is not None:
            update_data["job_preference"] = user_data.job_preference
        if user_data.origin_country is not None:
            update_data["origin_country"] = user_data.origin_country
        
        update_data["updated_at"] = datetime.utcnow()
        
        if not update_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No fields to update"
            )
        
        result = await db.users.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": update_data}
        )
        
        if result.modified_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        return {"message": "Profile updated successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating profile: {str(e)}"
        ) 