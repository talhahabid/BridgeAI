from pydantic import BaseModel, Field, ConfigDict
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

class FriendRequest(BaseModel):
    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )
    
    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    sender_id: PyObjectId
    receiver_id: PyObjectId
    status: str = Field(default="pending", description="pending, accepted, rejected")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class FriendRequestCreate(BaseModel):
    receiver_id: str

class FriendRequestResponse(BaseModel):
    model_config = ConfigDict(
        populate_by_name=True,
        json_encoders={ObjectId: str}
    )
    
    id: Optional[str] = Field(None)
    sender_id: str
    receiver_id: str
    sender_name: str
    receiver_name: str
    status: str
    created_at: datetime

class ChatMessage(BaseModel):
    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )
    
    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    sender_id: PyObjectId
    receiver_id: PyObjectId
    content: str = Field(..., min_length=1, max_length=1000)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    is_read: bool = Field(default=False)

class ChatMessageCreate(BaseModel):
    receiver_id: str
    content: str = Field(..., min_length=1, max_length=1000)

class ChatMessageResponse(BaseModel):
    model_config = ConfigDict(
        populate_by_name=True,
        json_encoders={ObjectId: str}
    )
    
    id: Optional[str] = Field(None, alias="_id")
    sender_id: str
    receiver_id: str
    sender_name: str
    content: str
    created_at: datetime
    is_read: bool

class UserWithJobPreference(BaseModel):
    id: str
    name: str
    job_preference: str
    location: str
    origin_country: Optional[str] = None
    is_friend: bool = False
    has_pending_request: bool = False
    request_sent_by_me: bool = False 