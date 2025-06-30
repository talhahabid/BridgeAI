import json
import asyncio
import logging
from typing import Dict, Set, Optional
from fastapi import WebSocket, WebSocketDisconnect
from bson import ObjectId
from utils.chat_service import ChatService
from database import get_database_direct
from datetime import datetime

# Configure logging
logger = logging.getLogger(__name__)

class ConnectionManager:
    def __init__(self):
        # Store active connections: {user_id: WebSocket}
        self.active_connections: Dict[str, WebSocket] = {}
        # Store user chat rooms: {user_id: set of friend_ids}
        self.user_chat_rooms: Dict[str, Set[str]] = {}
        # Chat service for database operations
        self.chat_service = None

    async def _get_chat_service(self):
        """Get chat service instance with database connection"""
        if self.chat_service is None:
            db = await get_database_direct()
            self.chat_service = ChatService(db)
        return self.chat_service

    async def connect(self, websocket: WebSocket, user_id: str):
        await websocket.accept()
        self.active_connections[user_id] = websocket
        self.user_chat_rooms[user_id] = set()
        logger.info(f"User {user_id} connected")

    def disconnect(self, user_id: str):
        if user_id in self.active_connections:
            del self.active_connections[user_id]
        if user_id in self.user_chat_rooms:
            del self.user_chat_rooms[user_id]
        logger.info(f"User {user_id} disconnected")

    async def send_personal_message(self, message: dict, user_id: str):
        if user_id in self.active_connections:
            try:
                await self.active_connections[user_id].send_text(json.dumps(message))
            except Exception as e:
                logger.error(f"Error sending message to {user_id}: {e}")
                self.disconnect(user_id)

    async def send_chat_message(self, message: dict, sender_id: str, receiver_id: str):
        """Send a chat message to both sender and receiver if they're online"""
        # Send to receiver
        await self.send_personal_message(message, receiver_id)
        # Send to sender (for confirmation)
        await self.send_personal_message(message, sender_id)

    async def handle_chat_message(self, data: dict, sender_id: str):
        """Handle incoming chat message and save to database"""
        try:
            receiver_id = data.get('receiver_id')
            content = data.get('content')
            message_type = data.get('message_type', 'text')
            
            if not receiver_id or not content:
                return
            
            chat_service = await self._get_chat_service()
            
            # Create message object
            from models.chat import Message
            message = Message(
                sender_id=sender_id,
                receiver_id=receiver_id,
                content=content,
                message_type=message_type
            )
            
            # Save message to database
            message_id = await chat_service.save_message(message)
            
            # Get the saved message for response
            messages = await chat_service.get_messages(sender_id, receiver_id, limit=1)
            saved_message = messages[0] if messages else None
            
            if saved_message:
                # Prepare message for WebSocket
                message_data = {
                    'type': 'chat_message',
                    'id': saved_message.id,
                    'sender_id': sender_id,
                    'receiver_id': receiver_id,
                    'sender_name': saved_message.sender_name,
                    'content': content,
                    'message_type': message_type,
                    'created_at': saved_message.created_at,
                    'is_read': saved_message.is_read
                }
                
                # Send to both users
                await self.send_chat_message(message_data, sender_id, receiver_id)
            
        except Exception as e:
            logger.error(f"Error handling chat message: {e}")

    async def handle_mark_read(self, data: dict, user_id: str):
        """Handle mark as read request"""
        try:
            other_user_id = data.get('other_user_id')
            if not other_user_id:
                return
            
            chat_service = await self._get_chat_service()
            
            # Mark messages as read in database
            await chat_service.mark_messages_as_read(user_id, other_user_id)
            
            # Notify the other user that messages were read
            read_notification = {
                'type': 'messages_read',
                'read_by': user_id
            }
            
            await self.send_personal_message(read_notification, other_user_id)
            
        except Exception as e:
            logger.error(f"Error handling mark read: {e}")

    def get_online_users(self) -> Set[str]:
        return set(self.active_connections.keys())

manager = ConnectionManager() 