from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query, Request
import json
from datetime import datetime
import logging

from websocket_manager import manager
from utils.auth import verify_token
from utils.chat_service import ChatService
from models.chat import Message
from database import get_database

# Configure logging
logger = logging.getLogger(__name__)

router = APIRouter()

@router.websocket("/ws/chat/{user_id}")
async def websocket_endpoint(
    websocket: WebSocket, 
    user_id: str,
    token: str = Query(...),
    request: Request = None
):
    # Verify the token
    verified_user_id = verify_token(token)
    if not verified_user_id or verified_user_id != user_id:
        await websocket.close(code=4001, reason="Unauthorized")
        return
    
    await manager.connect(websocket, user_id)
    try:
        while True:
            # Receive message from client
            data = await websocket.receive_text()
            message_data = json.loads(data)
            
            # Handle different message types
            if message_data.get("type") == "chat_message":
                await manager.handle_chat_message(message_data, user_id)
            elif message_data.get("type") == "typing":
                await handle_typing_indicator(message_data, user_id)
            elif message_data.get("type") == "mark_read":
                await manager.handle_mark_read(message_data, user_id)
            elif message_data.get("type") == "heartbeat":
                await manager.handle_heartbeat(user_id)
                
    except WebSocketDisconnect:
        manager.disconnect(user_id)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        manager.disconnect(user_id)

async def handle_typing_indicator(message_data: dict, sender_id: str):
    """Handle typing indicators"""
    try:
        receiver_id = message_data.get("receiver_id")
        is_typing = message_data.get("is_typing", False)
        
        if not receiver_id:
            return
        
        # Send typing indicator to receiver
        typing_message = {
            "type": "typing_indicator",
            "sender_id": sender_id,
            "is_typing": is_typing
        }
        
        await manager.send_personal_message(typing_message, receiver_id)
        
    except Exception as e:
        logger.error(f"Error handling typing indicator: {e}")

@router.get("/online-users")
async def get_online_users():
    """Get list of online users"""
    return {"online_users": list(manager.get_online_users())} 