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
        # Store last heartbeat: {user_id: timestamp}
        self.last_heartbeat: Dict[str, datetime] = {}
        # Chat service for database operations
        self.chat_service = None
        # Heartbeat task
        self.heartbeat_task = None
        # Connection limits for Render
        self.max_connections = 100  # Adjust based on your Render plan

    async def _get_chat_service(self):
        """Get chat service instance with database connection"""
        if self.chat_service is None:
            db = await get_database_direct()
            self.chat_service = ChatService(db)
        return self.chat_service

    async def connect(self, websocket: WebSocket, user_id: str):
        # Check connection limits
        if len(self.active_connections) >= self.max_connections:
            logger.warning(f"Connection limit reached ({self.max_connections})")
            await websocket.close(code=1013, reason="Server overloaded")
            return False

        await websocket.accept()
        self.active_connections[user_id] = websocket
        self.user_chat_rooms[user_id] = set()
        self.last_heartbeat[user_id] = datetime.utcnow()
        logger.info(f"User {user_id} connected. Total connections: {len(self.active_connections)}")
        
        # Send connection confirmation
        await self.send_personal_message({
            "type": "connection_established",
            "user_id": user_id,
            "timestamp": datetime.utcnow().isoformat(),
            "connection_id": f"conn_{user_id}_{datetime.utcnow().timestamp()}"
        }, user_id)
        
        return True

    def disconnect(self, user_id: str):
        if user_id in self.active_connections:
            del self.active_connections[user_id]
        if user_id in self.user_chat_rooms:
            del self.user_chat_rooms[user_id]
        if user_id in self.last_heartbeat:
            del self.last_heartbeat[user_id]
        logger.info(f"User {user_id} disconnected. Total connections: {len(self.active_connections)}")

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

    async def handle_heartbeat(self, user_id: str):
        """Handle heartbeat from client"""
        self.last_heartbeat[user_id] = datetime.utcnow()
        await self.send_personal_message({
            "type": "heartbeat_ack",
            "timestamp": datetime.utcnow().isoformat()
        }, user_id)

    async def start_heartbeat_monitor(self):
        """Monitor connections and send heartbeat to clients"""
        while True:
            try:
                current_time = datetime.utcnow()
                disconnected_users = []
                
                for user_id, last_beat in self.last_heartbeat.items():
                    # If no heartbeat for 60 seconds, disconnect
                    if (current_time - last_beat).total_seconds() > 60:
                        logger.warning(f"User {user_id} heartbeat timeout, disconnecting")
                        disconnected_users.append(user_id)
                    else:
                        # Send heartbeat every 30 seconds
                        if (current_time - last_beat).total_seconds() > 30:
                            await self.send_personal_message({
                                "type": "heartbeat",
                                "timestamp": current_time.isoformat()
                            }, user_id)
                
                # Disconnect timed out users
                for user_id in disconnected_users:
                    self.disconnect(user_id)
                
                await asyncio.sleep(10)  # Check every 10 seconds
                
            except Exception as e:
                logger.error(f"Error in heartbeat monitor: {e}")
                await asyncio.sleep(10)

    async def handle_chat_message(self, data: dict, sender_id: str):
        """Handle incoming chat message and save to database"""
        try:
            receiver_id = data.get('receiver_id')
            content = data.get('content')
            message_type = data.get('message_type', 'text')
            
            if not receiver_id or not content:
                return
            
            chat_service = await self._get_chat_service()
            
            # Save message to database
            saved_message = await chat_service.save_message(sender_id, receiver_id, content)
            
            if saved_message:
                # Prepare message for WebSocket
                message_data = {
                    'type': 'chat_message',
                    'id': saved_message['id'],
                    'sender_id': sender_id,
                    'receiver_id': receiver_id,
                    'content': content,
                    'message_type': message_type,
                    'timestamp': saved_message['timestamp'],
                    'read': saved_message['read']
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

    def get_connection_count(self) -> int:
        return len(self.active_connections)

    def get_connection_stats(self) -> dict:
        """Get connection statistics for monitoring"""
        return {
            "total_connections": len(self.active_connections),
            "max_connections": self.max_connections,
            "online_users": list(self.active_connections.keys()),
            "last_heartbeat_count": len(self.last_heartbeat)
        }

manager = ConnectionManager() 