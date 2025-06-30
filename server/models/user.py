from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional, List
from datetime import datetime
from bson import ObjectId

class PyObjectId(ObjectId):
    @classmethod
    def __get_pydantic_core_schema__(cls, source_type, handler):
        return handler(ObjectId)
    
    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid ObjectId")
        return ObjectId(v)

class UserBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    location: str = Field(..., description="Canadian province")
    job_preference: str = Field(..., description="Desired job title")
    origin_country: Optional[str] = Field(None, description="Country of origin")

class UserCreate(UserBase):
    password: str = Field(..., min_length=8)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    location: Optional[str] = Field(None, description="Canadian province")
    job_preference: Optional[str] = Field(None, description="Desired job title")
    origin_country: Optional[str] = Field(None, description="Country of origin")

class UserInDB(UserBase):
    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )
    
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    hashed_password: str
    resume_text: Optional[str] = None
    resume_filename: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    is_active: bool = True

class UserResponse(BaseModel):
    model_config = ConfigDict(
        populate_by_name=True,
        json_encoders={ObjectId: str}
    )
    
    id: Optional[str] = Field(None, alias="_id")
    name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    location: str = Field(..., description="Canadian province")
    job_preference: str = Field(..., description="Desired job title")
    origin_country: Optional[str] = Field(None, description="Country of origin")
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    resume_text: Optional[str] = None
    resume_filename: Optional[str] = None
    resume_structured: Optional[dict] = None
    resume_keywords: Optional[List[str]] = None
    qualification_path: Optional[dict] = None
    is_active: Optional[bool] = True 