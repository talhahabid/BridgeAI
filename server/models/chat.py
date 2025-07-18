from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict
from bson import ObjectId

class Message(BaseModel):
    """Chat message model"""
    model_config = ConfigDict(
        json_encoders={
            datetime: lambda v: v.isoformat(),
            ObjectId: lambda v: str(v)
        }
    )
    
    id: Optional[str] = Field(default_factory=lambda: str(ObjectId()))
    sender_id: str
    receiver_id: str
    content: str
    message_type: str = "text"  # text, image, file
    created_at: datetime = Field(default_factory=datetime.utcnow)
    read_at: Optional[datetime] = None
    is_deleted: bool = False

class ChatSession(BaseModel):
    """Chat session between two users"""
    model_config = ConfigDict(
        json_encoders={
            datetime: lambda v: v.isoformat(),
            ObjectId: lambda v: str(v)
        }
    )
    
    id: Optional[str] = Field(default_factory=lambda: str(ObjectId()))
    participants: List[str]  # Array of user IDs
    last_message_id: Optional[str] = None
    last_activity: datetime = Field(default_factory=datetime.utcnow)
    unread_counts: dict = Field(default_factory=dict)  # {user_id: count}

class ChatMessageResponse(BaseModel):
    """Response model for chat messages"""
    model_config = ConfigDict(
        json_encoders={
            datetime: lambda v: v.isoformat()
        }
    )
    
    id: str
    sender_id: str
    receiver_id: str
    sender_name: str
    content: str
    message_type: str
    created_at: str
    is_read: bool

class ChatSessionResponse(BaseModel):
    """Response model for chat sessions"""
    id: str
    participants: List[str]
    participant_names: List[str]
    last_message: Optional[ChatMessageResponse]
    unread_count: int
    last_activity: str 