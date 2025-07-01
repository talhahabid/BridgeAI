#!/usr/bin/env python3
"""
Script to initialize chat collections in MongoDB
Run this script once to ensure the required collections exist
"""

import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

async def init_chat_collections():
    """Initialize chat collections in MongoDB"""
    mongodb_uri = os.getenv("MONGODB_URI")
    if not mongodb_uri:
        print("Error: MONGODB_URI environment variable not set")
        return
    
    try:
        # Connect to MongoDB
        client = AsyncIOMotorClient(mongodb_uri)
        db = client.immigrant_job_finder
        
        # Create collections if they don't exist
        collections = ['messages', 'chat_sessions']
        
        for collection_name in collections:
            # Check if collection exists
            collection_names = await db.list_collection_names()
            if collection_name not in collection_names:
                # Create collection with a sample document
                if collection_name == 'messages':
                    await db.messages.insert_one({
                        "sender_id": "000000000000000000000000",  # Placeholder ObjectId
                        "receiver_id": "000000000000000000000000",  # Placeholder ObjectId
                        "content": "Initial message",
                        "timestamp": "2024-01-01T00:00:00Z",
                        "read": False
                    })
                    # Remove the placeholder document
                    await db.messages.delete_one({"content": "Initial message"})
                elif collection_name == 'chat_sessions':
                    await db.chat_sessions.insert_one({
                        "participant1": "000000000000000000000000",  # Placeholder ObjectId
                        "participant2": "000000000000000000000000",  # Placeholder ObjectId
                        "last_message": "Initial session",
                        "last_activity": "2024-01-01T00:00:00Z",
                        "unread_count": 0
                    })
                    # Remove the placeholder document
                    await db.chat_sessions.delete_one({"last_message": "Initial session"})
                
                print(f"Created collection: {collection_name}")
            else:
                print(f"Collection already exists: {collection_name}")
        
        # Create indexes for better performance
        await db.messages.create_index([("sender_id", 1), ("receiver_id", 1)])
        await db.messages.create_index([("timestamp", -1)])
        await db.messages.create_index([("receiver_id", 1), ("read", 1)])
        
        await db.chat_sessions.create_index([("participant1", 1), ("participant2", 1)])
        await db.chat_sessions.create_index([("last_activity", -1)])
        
        print("Chat collections initialized successfully!")
        
    except Exception as e:
        print(f"Error initializing chat collections: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(init_chat_collections()) 