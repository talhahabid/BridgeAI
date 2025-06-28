from fastapi import APIRouter, HTTPException, status, Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from motor.motor_asyncio import AsyncIOMotorDatabase
from datetime import timedelta
import os

from models.user import UserCreate, UserLogin, UserResponse
from utils.auth import get_password_hash, verify_password, create_access_token
from database import get_database

router = APIRouter()
security = HTTPBearer()

@router.post("/signup", response_model=dict)
async def signup(user_data: UserCreate, request: Request):
    """Register a new user."""
    try:
        print(f"Starting signup for email: {user_data.email}")
        
        db = await get_database(request)
        print(f"Database object: {db}")
        
        # Check if user already exists
        existing_user = await db.users.find_one({"email": user_data.email})
        print(f"Existing user check result: {existing_user}")
        
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        # Hash password
        hashed_password = get_password_hash(user_data.password)
        print("Password hashed successfully")
        
        # Create user document
        user_doc = {
            "name": user_data.name,
            "email": user_data.email,
            "hashed_password": hashed_password,
            "location": user_data.location,
            "job_preference": user_data.job_preference,
            "origin_country": user_data.origin_country,
            "resume_text": None,
            "resume_filename": None
        }
        print(f"User document created: {user_doc}")
        
        # Insert user into database
        result = await db.users.insert_one(user_doc)
        print(f"User inserted with ID: {result.inserted_id}")
        
        # Create access token
        access_token = create_access_token(
            data={"sub": str(result.inserted_id)},
            expires_delta=timedelta(minutes=30)
        )
        print("Access token created successfully")
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user_id": str(result.inserted_id),
            "message": "User created successfully"
        }
        
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        print(f"Error in signup: {str(e)}")
        print(f"Error type: {type(e)}")
        import traceback
        print(f"Full traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating user: {str(e)}"
        )

@router.post("/login", response_model=dict)
async def login(user_data: UserLogin, request: Request):
    """Login user and return JWT token."""
    try:
        db = await get_database(request)
        
        # Find user by email
        user = await db.users.find_one({"email": user_data.email})
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password"
            )
        
        # Verify password
        if not verify_password(user_data.password, user["hashed_password"]):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password"
            )
        
        # Check if user is active
        if not user.get("is_active", True):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Account is deactivated"
            )
        
        # Create access token
        access_token = create_access_token(
            data={"sub": str(user["_id"])},
            expires_delta=timedelta(minutes=30)
        )
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user_id": str(user["_id"]),
            "message": "Login successful"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error during login: {str(e)}"
        )

@router.post("/verify-token")
async def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Verify if the provided JWT token is valid."""
    from utils.auth import verify_token as verify_jwt_token
    
    token = credentials.credentials
    user_id = verify_jwt_token(token)
    
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )
    
    return {"valid": True, "user_id": user_id} 