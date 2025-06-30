#!/usr/bin/env python3
"""
Test script to verify imports work correctly with updated dependencies
"""
import sys
import traceback

def test_imports():
    """Test all critical imports"""
    print("Testing imports...")
    
    try:
        print("✓ Testing FastAPI import...")
        from fastapi import FastAPI
        print("  FastAPI imported successfully")
        
        print("✓ Testing Pydantic import...")
        from pydantic import BaseModel, Field, ConfigDict
        print("  Pydantic imported successfully")
        
        print("✓ Testing model imports...")
        from models.user import UserBase, UserCreate, UserResponse
        print("  User models imported successfully")
        
        from models.friends import FriendRequest, ChatMessage
        print("  Friends models imported successfully")
        
        from models.chat import Message, ChatSession
        print("  Chat models imported successfully")
        
        print("✓ Testing database import...")
        from database import get_database
        print("  Database imported successfully")
        
        print("✓ Testing route imports...")
        from routes import auth, users, resumes, jobs, qualifications, friends, websocket, chat
        print("  All routes imported successfully")
        
        print("✓ Testing main app import...")
        from main import app
        print("  Main app imported successfully")
        
        print("\n🎉 All imports successful! The application should work correctly.")
        return True
        
    except Exception as e:
        print(f"\n❌ Import failed: {e}")
        print(f"Error type: {type(e).__name__}")
        print("Full traceback:")
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = test_imports()
    sys.exit(0 if success else 1) 