import json
import asyncio
from typing import Dict, Set, Optional
from fastapi import WebSocket, WebSocketDisconnect
from bson import ObjectId

class ConnectionManager:
    def __init__(self):
        # Store active connections: {user_id: WebSocket}
        self.active_connections: Dict[str, WebSocket] = {}
        # Store user chat rooms: {user_id: set of friend_ids}
        self.user_chat_rooms: Dict[str, Set[str]] = {}

    async def connect(self, websocket: WebSocket, user_id: str):
        await websocket.accept()
        self.active_connections[user_id] = websocket
        self.user_chat_rooms[user_id] = set()
        print(f"User {user_id} connected")

    def disconnect(self, user_id: str):
        if user_id in self.active_connections:
            del self.active_connections[user_id]
        if user_id in self.user_chat_rooms:
            del self.user_chat_rooms[user_id]
        print(f"User {user_id} disconnected")

    async def send_personal_message(self, message: dict, user_id: str):
        if user_id in self.active_connections:
            try:
                await self.active_connections[user_id].send_text(json.dumps(message))
            except Exception as e:
                print(f"Error sending message to {user_id}: {e}")
                self.disconnect(user_id)

    async def send_chat_message(self, message: dict, sender_id: str, receiver_id: str):
        """Send a chat message to both sender and receiver if they're online"""
        # Send to receiver
        await self.send_personal_message(message, receiver_id)
        # Send to sender (for confirmation)
        await self.send_personal_message(message, sender_id)

    def get_online_users(self) -> Set[str]:
        return set(self.active_connections.keys())

manager = ConnectionManager() 