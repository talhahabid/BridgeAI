import os
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase

from models.chat import Message, ChatSession, ChatMessageResponse, ChatSessionResponse

# Configure logging
logger = logging.getLogger(__name__)

class ChatService:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.messages = db.messages
        self.chat_sessions = db.chat_sessions
        self.users = db.users
    
    async def save_message(self, sender_id: str, receiver_id: str, content: str) -> Dict[str, Any]:
        """Save a chat message to the database"""
        try:
            message_data = {
                "sender_id": ObjectId(sender_id),
                "receiver_id": ObjectId(receiver_id),
                "content": content,
                "timestamp": datetime.utcnow(),
                "read": False
            }
            
            result = await self.messages.insert_one(message_data)
            
            # Update or create chat session
            await self._update_chat_session(sender_id, receiver_id, content)
            
            return {
                "id": str(result.inserted_id),
                "sender_id": sender_id,
                "receiver_id": receiver_id,
                "content": content,
                "timestamp": message_data["timestamp"].isoformat(),
                "read": False
            }
            
        except Exception as e:
            logger.error(f"Error saving message: {e}")
            raise
    
    async def get_messages(self, user1_id: str, user2_id: str, limit: int = 50) -> List[Dict[str, Any]]:
        """Get chat messages between two users"""
        try:
            cursor = self.messages.find({
                "$or": [
                    {"sender_id": ObjectId(user1_id), "receiver_id": ObjectId(user2_id)},
                    {"sender_id": ObjectId(user2_id), "receiver_id": ObjectId(user1_id)}
                ]
            }).sort("timestamp", -1).limit(limit)
            
            messages = await cursor.to_list(length=limit)
            
            # Mark messages as read
            await self._mark_messages_as_read(user1_id, user2_id)
            
            return [
                {
                    "id": str(msg["_id"]),
                    "sender_id": str(msg["sender_id"]),
                    "receiver_id": str(msg["receiver_id"]),
                    "content": msg["content"],
                    "timestamp": msg["timestamp"].isoformat(),
                    "read": msg["read"]
                }
                for msg in reversed(messages)  # Reverse to get chronological order
            ]
            
        except Exception as e:
            logger.error(f"Error getting messages: {e}")
            raise
    
    async def mark_messages_as_read(self, user_id: str, sender_id: str) -> bool:
        """Mark messages from a specific sender as read"""
        try:
            result = await self.messages.update_many(
                {
                    "sender_id": ObjectId(sender_id),
                    "receiver_id": ObjectId(user_id),
                    "read": False
                },
                {"$set": {"read": True}}
            )
            
            # Update unread count
            await self._update_unread_count(user_id)
            
            return result.modified_count > 0
            
        except Exception as e:
            logger.error(f"Error marking messages as read: {e}")
            raise
    
    async def get_chat_sessions(self, user_id: str) -> List[Dict[str, Any]]:
        """Get all chat sessions for a user"""
        try:
            # Get all chat sessions where the user is a participant
            cursor = self.chat_sessions.find({
                "$or": [
                    {"participant1": ObjectId(user_id)},
                    {"participant2": ObjectId(user_id)}
                ]
            })
            
            sessions = await cursor.to_list(length=None)
            
            result = []
            for session in sessions:
                # Determine the other participant
                other_participant_id = str(session["participant2"]) if str(session["participant1"]) == user_id else str(session["participant1"])
                
                # Get the other user's name
                other_user = await self.users.find_one({"_id": ObjectId(other_participant_id)})
                other_user_name = other_user["name"] if other_user else "Unknown User"
                
                result.append({
                    "id": str(session["_id"]),
                    "participant_id": other_participant_id,
                    "participant_name": other_user_name,
                    "last_message": session.get("last_message", ""),
                    "last_activity": session.get("last_activity", "").isoformat() if session.get("last_activity") else "",
                    "unread_count": session.get("unread_count", 0)
                })
            
            return result
            
        except Exception as e:
            logger.error(f"Error getting chat sessions: {e}")
            raise
    
    async def get_unread_count(self, user_id: str) -> int:
        """Get total unread message count for a user"""
        try:
            count = await self.messages.count_documents({
                "receiver_id": ObjectId(user_id),
                "read": False
            })
            
            return count
            
        except Exception as e:
            logger.error(f"Error getting unread count: {e}")
            raise
    
    async def _update_chat_session(self, sender_id: str, receiver_id: str, content: str):
        """Update or create a chat session"""
        try:
            # Find existing session
            session = await self.chat_sessions.find_one({
                "$or": [
                    {"participant1": ObjectId(sender_id), "participant2": ObjectId(receiver_id)},
                    {"participant1": ObjectId(receiver_id), "participant2": ObjectId(sender_id)}
                ]
            })
            
            session_data = {
                "participant1": ObjectId(sender_id),
                "participant2": ObjectId(receiver_id),
                "last_message": content,
                "last_activity": datetime.utcnow()
            }
            
            if session:
                # Update existing session
                await self.chat_sessions.update_one(
                    {"_id": session["_id"]},
                    {"$set": session_data}
                )
            else:
                # Create new session
                await self.chat_sessions.insert_one(session_data)
                
        except Exception as e:
            logger.error(f"Error updating chat session: {e}")
    
    async def _mark_messages_as_read(self, user_id: str, sender_id: str):
        """Mark messages as read and update unread count"""
        try:
            await self.messages.update_many(
                {
                    "sender_id": ObjectId(sender_id),
                    "receiver_id": ObjectId(user_id),
                    "read": False
                },
                {"$set": {"read": True}}
            )
            
            # Update unread count in chat session
            await self.chat_sessions.update_one(
                {
                    "$or": [
                        {"participant1": ObjectId(user_id), "participant2": ObjectId(sender_id)},
                        {"participant1": ObjectId(sender_id), "participant2": ObjectId(user_id)}
                    ]
                },
                {"$set": {"unread_count": 0}}
            )
            
        except Exception as e:
            logger.error(f"Error updating unread count: {e}")
    
    async def _update_unread_count(self, user_id: str):
        """Update unread count for all chat sessions of a user"""
        try:
            # Get all unread messages for the user
            unread_messages = await self.messages.find({
                "receiver_id": ObjectId(user_id),
                "read": False
            }).to_list(length=None)
            
            # Group by sender
            sender_counts = {}
            for msg in unread_messages:
                sender_id = str(msg["sender_id"])
                sender_counts[sender_id] = sender_counts.get(sender_id, 0) + 1
            
            # Update chat sessions
            for sender_id, count in sender_counts.items():
                await self.chat_sessions.update_one(
                    {
                        "$or": [
                            {"participant1": ObjectId(user_id), "participant2": ObjectId(sender_id)},
                            {"participant1": ObjectId(sender_id), "participant2": ObjectId(user_id)}
                        ]
                    },
                    {"$set": {"unread_count": count}}
                )
                
        except Exception as e:
            logger.error(f"Error updating unread count: {e}") 