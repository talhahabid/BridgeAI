from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import json
from datetime import datetime

from websocket_manager import manager

router = APIRouter()

@router.websocket("/ws/chat/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    await manager.connect(websocket, user_id)
    try:
        while True:
            # Receive message from client
            data = await websocket.receive_text()
            message_data = json.loads(data)
            
            # Handle different message types
            if message_data.get("type") == "chat_message":
                await handle_chat_message(message_data, user_id)
            elif message_data.get("type") == "typing":
                await handle_typing_indicator(message_data, user_id)
                
    except WebSocketDisconnect:
        manager.disconnect(user_id)
    except Exception as e:
        print(f"WebSocket error: {e}")
        manager.disconnect(user_id)

async def handle_chat_message(message_data: dict, sender_id: str):
    """Handle incoming chat messages"""
    try:
        receiver_id = message_data.get("receiver_id")
        content = message_data.get("content")
        
        if not receiver_id or not content:
            return
        
        # Prepare message for WebSocket
        ws_message = {
            "type": "chat_message",
            "id": f"msg_{datetime.utcnow().timestamp()}",
            "sender_id": sender_id,
            "receiver_id": receiver_id,
            "sender_name": "You",  # We'll get this from frontend
            "content": content,
            "created_at": datetime.utcnow().isoformat(),
            "is_read": False
        }
        
        # Send to both users
        await manager.send_chat_message(ws_message, sender_id, receiver_id)
        
    except Exception as e:
        print(f"Error handling chat message: {e}")

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
        print(f"Error handling typing indicator: {e}")

@router.get("/online-users")
async def get_online_users():
    """Get list of online users"""
    return {"online_users": list(manager.get_online_users())} 