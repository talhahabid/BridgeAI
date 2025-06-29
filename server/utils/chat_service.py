from datetime import datetime
from typing import List, Optional, Dict
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase

from models.chat import Message, ChatSession, ChatMessageResponse, ChatSessionResponse

class ChatService:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.messages = db.messages
        self.chat_sessions = db.chat_sessions
        self.users = db.users
    
    async def save_message(self, message: Message) -> str:
        """Save a message to the database"""
        try:
            # Convert to dict and remove id for MongoDB insertion
            message_dict = message.dict()
            if 'id' in message_dict:
                del message_dict['id']
            
            # Insert message
            result = await self.messages.insert_one(message_dict)
            message_id = str(result.inserted_id)
            
            # Update or create chat session
            await self._update_chat_session(message.sender_id, message.receiver_id, message_id)
            
            return message_id
            
        except Exception as e:
            print(f"Error saving message: {e}")
            raise
    
    async def get_messages(self, user1_id: str, user2_id: str, limit: int = 50, skip: int = 0) -> List[ChatMessageResponse]:
        """Get messages between two users"""
        try:
            # Find messages between the two users
            cursor = self.messages.find({
                "$or": [
                    {"sender_id": user1_id, "receiver_id": user2_id},
                    {"sender_id": user2_id, "receiver_id": user1_id}
                ],
                "is_deleted": False
            }).sort("created_at", -1).skip(skip).limit(limit)
            
            messages = await cursor.to_list(length=limit)
            
            # Get user names for sender names
            user_ids = {user1_id, user2_id}
            users = await self.users.find({"_id": {"$in": [ObjectId(uid) for uid in user_ids]}}).to_list(length=2)
            user_names = {str(user["_id"]): user.get("name", "Unknown") for user in users}
            
            # Convert to response format
            response_messages = []
            for msg in reversed(messages):  # Reverse to get chronological order
                response_messages.append(ChatMessageResponse(
                    id=str(msg["_id"]),
                    sender_id=msg["sender_id"],
                    receiver_id=msg["receiver_id"],
                    sender_name=user_names.get(msg["sender_id"], "Unknown"),
                    content=msg["content"],
                    message_type=msg["message_type"],
                    created_at=msg["created_at"].isoformat(),
                    is_read=msg.get("read_at") is not None
                ))
            
            return response_messages
            
        except Exception as e:
            print(f"Error getting messages: {e}")
            return []
    
    async def mark_messages_as_read(self, user_id: str, other_user_id: str) -> bool:
        """Mark messages as read"""
        try:
            result = await self.messages.update_many(
                {
                    "sender_id": other_user_id,
                    "receiver_id": user_id,
                    "read_at": None
                },
                {
                    "$set": {"read_at": datetime.utcnow()}
                }
            )
            
            # Update unread count in chat session
            await self._update_unread_count(user_id, other_user_id, 0)
            
            return result.modified_count > 0
            
        except Exception as e:
            print(f"Error marking messages as read: {e}")
            return False
    
    async def get_chat_sessions(self, user_id: str) -> List[ChatSessionResponse]:
        """Get all chat sessions for a user"""
        try:
            # Find chat sessions where user is a participant
            cursor = self.chat_sessions.find({
                "participants": user_id
            }).sort("last_activity", -1)
            
            sessions = await cursor.to_list(length=100)
            
            response_sessions = []
            for session in sessions:
                # Get participant names
                participant_ids = [pid for pid in session["participants"] if pid != user_id]
                users = await self.users.find({"_id": {"$in": [ObjectId(pid) for pid in participant_ids]}}).to_list(length=len(participant_ids))
                participant_names = [user.get("name", "Unknown") for user in users]
                
                # Get last message if exists
                last_message = None
                if session.get("last_message_id"):
                    last_msg = await self.messages.find_one({"_id": ObjectId(session["last_message_id"])})
                    if last_msg:
                        last_message = ChatMessageResponse(
                            id=str(last_msg["_id"]),
                            sender_id=last_msg["sender_id"],
                            receiver_id=last_msg["receiver_id"],
                            sender_name="Unknown",  # We'll get this from users
                            content=last_msg["content"],
                            message_type=last_msg["message_type"],
                            created_at=last_msg["created_at"].isoformat(),
                            is_read=last_msg.get("read_at") is not None
                        )
                
                response_sessions.append(ChatSessionResponse(
                    id=str(session["_id"]),
                    participants=session["participants"],
                    participant_names=participant_names,
                    last_message=last_message,
                    unread_count=session.get("unread_counts", {}).get(user_id, 0),
                    last_activity=session["last_activity"].isoformat()
                ))
            
            return response_sessions
            
        except Exception as e:
            print(f"Error getting chat sessions: {e}")
            return []
    
    async def get_unread_count(self, user_id: str) -> int:
        """Get total unread messages count for a user"""
        try:
            result = await self.messages.count_documents({
                "receiver_id": user_id,
                "read_at": None,
                "is_deleted": False
            })
            return result
        except Exception as e:
            print(f"Error getting unread count: {e}")
            return 0
    
    async def _update_chat_session(self, sender_id: str, receiver_id: str, message_id: str):
        """Update or create chat session"""
        try:
            participants = sorted([sender_id, receiver_id])
            
            # Find existing session
            session = await self.chat_sessions.find_one({"participants": participants})
            
            if session:
                # Update existing session
                await self.chat_sessions.update_one(
                    {"_id": session["_id"]},
                    {
                        "$set": {
                            "last_message_id": message_id,
                            "last_activity": datetime.utcnow()
                        },
                        "$inc": {f"unread_counts.{receiver_id}": 1}
                    }
                )
            else:
                # Create new session
                new_session = ChatSession(
                    participants=participants,
                    last_message_id=message_id,
                    unread_counts={receiver_id: 1}
                )
                await self.chat_sessions.insert_one(new_session.dict())
                
        except Exception as e:
            print(f"Error updating chat session: {e}")
    
    async def _update_unread_count(self, user_id: str, other_user_id: str, count: int):
        """Update unread count for a specific chat session"""
        try:
            participants = sorted([user_id, other_user_id])
            await self.chat_sessions.update_one(
                {"participants": participants},
                {"$set": {f"unread_counts.{user_id}": count}}
            )
        except Exception as e:
            print(f"Error updating unread count: {e}") 