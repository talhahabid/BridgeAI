from fastapi import APIRouter, HTTPException, Depends, Request, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from bson import ObjectId

from utils.auth import get_current_user_id
from utils.chat_service import ChatService
from database import get_database

router = APIRouter()
security = HTTPBearer()

@router.get("/messages/{other_user_id}")
async def get_chat_messages(
    other_user_id: str,
    limit: int = Query(50, ge=1, le=100),
    skip: int = Query(0, ge=0),
    credentials: HTTPAuthorizationCredentials = Depends(security),
    request: Request = None
):
    """Get chat messages between current user and another user"""
    try:
        # Get current user
        current_user_id = get_current_user_id(credentials.credentials)
        
        # Get database and chat service
        db = await get_database(request)
        chat_service = ChatService(db)
        
        # Get messages
        messages = await chat_service.get_messages(current_user_id, other_user_id, limit, skip)
        
        return {
            "success": True,
            "messages": messages,
            "has_more": len(messages) == limit
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting messages: {str(e)}")

@router.get("/sessions")
async def get_chat_sessions(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    request: Request = None
):
    """Get all chat sessions for current user"""
    try:
        # Get current user
        current_user_id = get_current_user_id(credentials.credentials)
        
        # Get database and chat service
        db = await get_database(request)
        chat_service = ChatService(db)
        
        # Get chat sessions
        sessions = await chat_service.get_chat_sessions(current_user_id)
        
        return {
            "success": True,
            "sessions": sessions
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting chat sessions: {str(e)}")

@router.post("/mark-read/{other_user_id}")
async def mark_messages_as_read(
    other_user_id: str,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    request: Request = None
):
    """Mark messages from another user as read"""
    try:
        # Get current user
        current_user_id = get_current_user_id(credentials.credentials)
        
        # Get database and chat service
        db = await get_database(request)
        chat_service = ChatService(db)
        
        # Mark messages as read
        success = await chat_service.mark_messages_as_read(current_user_id, other_user_id)
        
        return {
            "success": success,
            "message": "Messages marked as read" if success else "No messages to mark as read"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error marking messages as read: {str(e)}")

@router.get("/unread-count")
async def get_unread_count(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    request: Request = None
):
    """Get total unread messages count for current user"""
    try:
        # Get current user
        current_user_id = get_current_user_id(credentials.credentials)
        
        # Get database and chat service
        db = await get_database(request)
        chat_service = ChatService(db)
        
        # Get unread count
        unread_count = await chat_service.get_unread_count(current_user_id)
        
        return {
            "success": True,
            "unread_count": unread_count
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting unread count: {str(e)}")

@router.delete("/messages/{message_id}")
async def delete_message(
    message_id: str,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    request: Request = None
):
    """Delete a message (soft delete)"""
    try:
        # Get current user
        current_user_id = get_current_user_id(credentials.credentials)
        
        # Get database
        db = await get_database(request)
        
        # Check if user owns the message
        message = await db.messages.find_one({"_id": ObjectId(message_id), "sender_id": current_user_id})
        if not message:
            raise HTTPException(status_code=404, detail="Message not found or not authorized")
        
        # Soft delete the message
        await db.messages.update_one(
            {"_id": ObjectId(message_id)},
            {"$set": {"is_deleted": True}}
        )
        
        return {
            "success": True,
            "message": "Message deleted successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting message: {str(e)}") 