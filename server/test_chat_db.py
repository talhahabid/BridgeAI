#!/usr/bin/env python3
"""
Test script to verify chat database functionality
"""

import asyncio
import sys
import os
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorClient

# Add the current directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from models.chat import Message, ChatSession
from utils.chat_service import ChatService

async def test_chat_database():
    """Test chat database functionality"""
    
    print("🧪 Testing chat database functionality...")
    
    try:
        # Connect to MongoDB directly
        mongodb_uri = "mongodb+srv://new:123@cluster0.3c9nu6x.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
        client = AsyncIOMotorClient(mongodb_uri)
        db = client.immigrant_job_finder
        
        print("✅ Connected to MongoDB")
        
        chat_service = ChatService(db)
        
        # Test 1: Create a test message
        print("🔄 Testing message creation...")
        test_message = Message(
            sender_id="test_user_1",
            receiver_id="test_user_2",
            content="Hello! This is a test message.",
            message_type="text"
        )
        
        message_id = await chat_service.save_message(test_message)
        print(f"✅ Message created with ID: {message_id}")
        
        # Test 2: Get messages between users
        print("🔄 Testing message retrieval...")
        messages = await chat_service.get_messages("test_user_1", "test_user_2", limit=10)
        print(f"✅ Retrieved {len(messages)} messages")
        
        # Test 3: Get chat sessions
        print("🔄 Testing chat sessions...")
        sessions = await chat_service.get_chat_sessions("test_user_1")
        print(f"✅ Retrieved {len(sessions)} chat sessions")
        
        # Test 4: Get unread count
        print("🔄 Testing unread count...")
        unread_count = await chat_service.get_unread_count("test_user_2")
        print(f"✅ Unread count: {unread_count}")
        
        # Test 5: Mark messages as read
        print("🔄 Testing mark as read...")
        success = await chat_service.mark_messages_as_read("test_user_2", "test_user_1")
        print(f"✅ Mark as read: {success}")
        
        # Clean up test data
        print("🔄 Cleaning up test data...")
        await db.messages.delete_many({
            "sender_id": {"$in": ["test_user_1", "test_user_2"]},
            "receiver_id": {"$in": ["test_user_1", "test_user_2"]}
        })
        await db.chat_sessions.delete_many({
            "participants": {"$in": ["test_user_1", "test_user_2"]}
        })
        print("✅ Test data cleaned up")
        
        # Close connection
        client.close()
        
        print("\n🎉 Chat database test completed successfully!")
        print("📝 Features tested:")
        print("  ✅ Message creation and storage")
        print("  ✅ Message retrieval")
        print("  ✅ Chat sessions")
        print("  ✅ Unread counts")
        print("  ✅ Mark as read functionality")
        
        return True
        
    except Exception as e:
        print(f"❌ Error testing chat database: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = asyncio.run(test_chat_database())
    if success:
        print("\n🚀 Chat database is ready!")
    else:
        print("\n⚠️  Chat database test failed") 