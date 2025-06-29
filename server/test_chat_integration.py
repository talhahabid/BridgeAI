import asyncio
import os
import sys
from datetime import datetime
from bson import ObjectId

# Add the server directory to the path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import get_database_direct
from utils.chat_service import ChatService
from models.chat import Message

async def test_chat_integration():
    """Test the chat database integration"""
    print("🧪 Testing Chat Database Integration...")
    
    try:
        # Get database connection
        db = await get_database_direct()
        print("✅ Database connection successful")
        
        # Create chat service
        chat_service = ChatService(db)
        print("✅ Chat service created")
        
        # Get real user IDs from the database
        users = await db.users.find().limit(2).to_list(length=2)
        if len(users) < 2:
            print("❌ Need at least 2 users in the database for testing")
            return
        
        user1_id = str(users[0]["_id"])
        user2_id = str(users[1]["_id"])
        
        print(f"📋 Using test users: {user1_id} and {user2_id}")
        
        # Test 1: Save a message
        print("\n📝 Testing message save...")
        test_message = Message(
            sender_id=user1_id,
            receiver_id=user2_id,
            content="Hello! This is a test message from the integration test.",
            message_type="text"
        )
        
        message_id = await chat_service.save_message(test_message)
        print(f"✅ Message saved with ID: {message_id}")
        
        # Test 2: Get messages
        print("\n📨 Testing message retrieval...")
        messages = await chat_service.get_messages(user1_id, user2_id, limit=10)
        print(f"✅ Retrieved {len(messages)} messages")
        
        for msg in messages:
            print(f"  - {msg.sender_name}: {msg.content[:50]}...")
        
        # Test 3: Get chat sessions
        print("\n💬 Testing chat sessions...")
        sessions = await chat_service.get_chat_sessions(user1_id)
        print(f"✅ Retrieved {len(sessions)} chat sessions")
        
        for session in sessions:
            print(f"  - Session with participants: {session.participant_names}")
            print(f"    Unread count: {session.unread_count}")
        
        # Test 4: Get unread count
        print("\n🔢 Testing unread count...")
        unread_count = await chat_service.get_unread_count(user1_id)
        print(f"✅ Total unread messages: {unread_count}")
        
        # Test 5: Mark messages as read
        print("\n✅ Testing mark as read...")
        success = await chat_service.mark_messages_as_read(user1_id, user2_id)
        print(f"✅ Mark as read successful: {success}")
        
        # Test 6: Check unread count after marking as read
        unread_count_after = await chat_service.get_unread_count(user1_id)
        print(f"✅ Unread count after marking as read: {unread_count_after}")
        
        print("\n🎉 All tests completed successfully!")
        
    except Exception as e:
        print(f"❌ Error during testing: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_chat_integration()) 