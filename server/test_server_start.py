import asyncio
import sys
import os

# Add the server directory to the path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

async def test_server_start():
    """Test if the server can start and basic functionality works"""
    print("🧪 Testing Server Startup...")
    
    try:
        # Test database connection
        from database import get_database_direct
        db = await get_database_direct()
        print("✅ Database connection successful")
        
        # Test chat service creation
        from utils.chat_service import ChatService
        chat_service = ChatService(db)
        print("✅ Chat service created successfully")
        
        # Test chat models
        from models.chat import Message
        test_message = Message(
            sender_id="test_user_1",
            receiver_id="test_user_2",
            content="Test message",
            message_type="text"
        )
        print("✅ Chat models working")
        
        # Test WebSocket manager
        from websocket_manager import manager
        print("✅ WebSocket manager initialized")
        
        print("\n🎉 Server components are working correctly!")
        print("📝 Note: GROQ service is optional and will show a warning if API key is not set")
        
    except Exception as e:
        print(f"❌ Error during server startup test: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_server_start()) 