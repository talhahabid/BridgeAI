from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from typing import List
from datetime import datetime

from database import get_database
from models.friends import (
    FriendRequest, FriendRequestCreate, FriendRequestResponse,
    ChatMessage, ChatMessageCreate, ChatMessageResponse,
    UserWithJobPreference, PyObjectId
)
from utils.auth import get_current_user

router = APIRouter()

@router.get("/discover", response_model=List[UserWithJobPreference])
async def discover_users_with_same_job_preference(
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Discover users with the same job preference"""
    try:
        current_user_id = ObjectId(current_user["id"])
        
        # Get current user's job preference
        user = await db.users.find_one({"_id": current_user_id})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        job_preference = user.get("job_preference", "")
        if not job_preference:
            raise HTTPException(status_code=400, detail="Please set your job preference first")
        
        # Find users with the same job preference (excluding current user)
        users_cursor = db.users.find({
            "job_preference": job_preference,
            "_id": {"$ne": current_user_id}
        })
        
        users = await users_cursor.to_list(length=50)
        
        # Get friend requests for current user
        sent_requests = await db.friend_requests.find({
            "sender_id": current_user_id,
            "status": "pending"
        }).to_list(length=None)
        
        received_requests = await db.friend_requests.find({
            "receiver_id": current_user_id,
            "status": "pending"
        }).to_list(length=None)
        
        # Get accepted friend relationships
        friends = await db.friend_requests.find({
            "$or": [
                {"sender_id": current_user_id, "status": "accepted"},
                {"receiver_id": current_user_id, "status": "accepted"}
            ]
        }).to_list(length=None)
        
        # Create sets for quick lookup
        sent_request_ids = {str(req["receiver_id"]) for req in sent_requests}
        received_request_ids = {str(req["sender_id"]) for req in received_requests}
        friend_ids = set()
        for friend in friends:
            if str(friend["sender_id"]) == str(current_user_id):
                friend_ids.add(str(friend["receiver_id"]))
            else:
                friend_ids.add(str(friend["sender_id"]))
        
        # Build response
        result = []
        for user_doc in users:
            user_id_str = str(user_doc["_id"])
            result.append(UserWithJobPreference(
                id=user_id_str,
                name=user_doc["name"],
                job_preference=user_doc["job_preference"],
                location=user_doc["location"],
                origin_country=user_doc.get("origin_country"),
                is_friend=user_id_str in friend_ids,
                has_pending_request=user_id_str in received_request_ids,
                request_sent_by_me=user_id_str in sent_request_ids
            ))
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/request", response_model=FriendRequestResponse)
async def send_friend_request(
    request_data: FriendRequestCreate,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Send a friend request"""
    try:
        sender_id = ObjectId(current_user["id"])
        receiver_id = ObjectId(request_data.receiver_id)
        
        # Check if receiver exists
        receiver = await db.users.find_one({"_id": receiver_id})
        if not receiver:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Check if request already exists
        existing_request = await db.friend_requests.find_one({
            "$or": [
                {"sender_id": sender_id, "receiver_id": receiver_id},
                {"sender_id": receiver_id, "receiver_id": sender_id}
            ]
        })
        
        if existing_request:
            raise HTTPException(status_code=400, detail="Friend request already exists")
        
        # Create friend request
        friend_request = FriendRequest(
            sender_id=PyObjectId(str(sender_id)),
            receiver_id=PyObjectId(str(receiver_id))
        )
        
        result = await db.friend_requests.insert_one(friend_request.dict(by_alias=True))
        
        # Get sender name
        sender = await db.users.find_one({"_id": sender_id})
        
        return FriendRequestResponse(
            id=str(result.inserted_id),
            sender_id=str(sender_id),
            receiver_id=str(receiver_id),
            sender_name=sender["name"],
            receiver_name=receiver["name"],
            status="pending",
            created_at=friend_request.created_at
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/requests", response_model=List[FriendRequestResponse])
async def get_friend_requests(
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Get pending friend requests"""
    try:
        user_id = ObjectId(current_user["id"])
        
        # Get received requests
        requests_cursor = db.friend_requests.find({
            "receiver_id": user_id,
            "status": "pending"
        })
        
        requests = await requests_cursor.to_list(length=None)
        
        result = []
        for req in requests:
            # Get sender name
            sender = await db.users.find_one({"_id": req["sender_id"]})
            receiver = await db.users.find_one({"_id": req["receiver_id"]})
            
            result.append(FriendRequestResponse(
                id=str(req["_id"]),
                sender_id=str(req["sender_id"]),
                receiver_id=str(req["receiver_id"]),
                sender_name=sender["name"],
                receiver_name=receiver["name"],
                status=req["status"],
                created_at=req["created_at"]
            ))
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/request/{request_id}/accept")
async def accept_friend_request(
    request_id: str,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Accept a friend request"""
    print(f"Accepting friend request with ID: {request_id}")
    try:
        user_id = ObjectId(current_user["id"])
        request_obj_id = ObjectId(request_id)
        
        # Find and update the request
        result = await db.friend_requests.update_one(
            {
                "_id": request_obj_id,
                "receiver_id": user_id,
                "status": "pending"
            },
            {
                "$set": {
                    "status": "accepted",
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Friend request not found")
        
        return {"message": "Friend request accepted"}
        
    except Exception as e:
        print(f"Error accepting friend request: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/request/{request_id}/reject")
async def reject_friend_request(
    request_id: str,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Reject a friend request"""
    print(f"Rejecting friend request with ID: {request_id}")
    try:
        user_id = ObjectId(current_user["id"])
        request_obj_id = ObjectId(request_id)
        
        # Find and update the request
        result = await db.friend_requests.update_one(
            {
                "_id": request_obj_id,
                "receiver_id": user_id,
                "status": "pending"
            },
            {
                "$set": {
                    "status": "rejected",
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Friend request not found")
        
        return {"message": "Friend request rejected"}
        
    except Exception as e:
        print(f"Error rejecting friend request: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/friends", response_model=List[UserWithJobPreference])
async def get_friends(
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Get user's friends list"""
    try:
        user_id = ObjectId(current_user["id"])
        
        # Get accepted friend relationships
        friends_cursor = db.friend_requests.find({
            "$or": [
                {"sender_id": user_id, "status": "accepted"},
                {"receiver_id": user_id, "status": "accepted"}
            ]
        })
        
        friends = await friends_cursor.to_list(length=None)
        
        result = []
        for friend_rel in friends:
            # Determine the other user's ID
            if str(friend_rel["sender_id"]) == str(user_id):
                other_user_id = friend_rel["receiver_id"]
            else:
                other_user_id = friend_rel["sender_id"]
            
            # Get other user's details
            other_user = await db.users.find_one({"_id": other_user_id})
            if other_user:
                result.append(UserWithJobPreference(
                    id=str(other_user["_id"]),
                    name=other_user["name"],
                    job_preference=other_user["job_preference"],
                    location=other_user["location"],
                    origin_country=other_user.get("origin_country"),
                    is_friend=True,
                    has_pending_request=False,
                    request_sent_by_me=False
                ))
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/chat/message", response_model=ChatMessageResponse)
async def send_message(
    message_data: ChatMessageCreate,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Send a chat message (only to friends)"""
    try:
        sender_id = ObjectId(current_user["id"])
        receiver_id = ObjectId(message_data.receiver_id)
        
        # Check if they are friends
        friend_relationship = await db.friend_requests.find_one({
            "$or": [
                {"sender_id": sender_id, "receiver_id": receiver_id, "status": "accepted"},
                {"sender_id": receiver_id, "receiver_id": sender_id, "status": "accepted"}
            ]
        })
        
        if not friend_relationship:
            raise HTTPException(status_code=403, detail="You can only message friends")
        
        # Create message
        message = ChatMessage(
            sender_id=PyObjectId(str(sender_id)),
            receiver_id=PyObjectId(str(receiver_id)),
            content=message_data.content
        )
        
        result = await db.chat_messages.insert_one(message.dict(by_alias=True))
        
        # Get sender name
        sender = await db.users.find_one({"_id": sender_id})
        
        return ChatMessageResponse(
            _id=str(result.inserted_id),
            sender_id=str(sender_id),
            receiver_id=str(receiver_id),
            sender_name=sender["name"],
            content=message.content,
            created_at=message.created_at,
            is_read=message.is_read
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/chat/messages/{friend_id}", response_model=List[ChatMessageResponse])
async def get_chat_messages(
    friend_id: str,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Get chat messages with a friend"""
    try:
        user_id = ObjectId(current_user["id"])
        friend_obj_id = ObjectId(friend_id)
        
        # Check if they are friends
        friend_relationship = await db.friend_requests.find_one({
            "$or": [
                {"sender_id": user_id, "receiver_id": friend_obj_id, "status": "accepted"},
                {"sender_id": friend_obj_id, "receiver_id": user_id, "status": "accepted"}
            ]
        })
        
        if not friend_relationship:
            raise HTTPException(status_code=403, detail="You can only view messages with friends")
        
        # Get messages between the two users
        messages_cursor = db.chat_messages.find({
            "$or": [
                {"sender_id": user_id, "receiver_id": friend_obj_id},
                {"sender_id": friend_obj_id, "receiver_id": user_id}
            ]
        }).sort("created_at", 1)
        
        messages = await messages_cursor.to_list(length=None)
        
        # Mark messages as read
        await db.chat_messages.update_many(
            {
                "sender_id": friend_obj_id,
                "receiver_id": user_id,
                "is_read": False
            },
            {"$set": {"is_read": True}}
        )
        
        result = []
        for msg in messages:
            sender = await db.users.find_one({"_id": msg["sender_id"]})
            result.append(ChatMessageResponse(
                _id=str(msg["_id"]),
                sender_id=str(msg["sender_id"]),
                receiver_id=str(msg["receiver_id"]),
                sender_name=sender["name"],
                content=msg["content"],
                created_at=msg["created_at"],
                is_read=msg["is_read"]
            ))
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 