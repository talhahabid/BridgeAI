from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from pymongo import MongoClient
import os
from fastapi import Request
from typing import Optional

class Database:
    client = None  # type: ignore
    database = None  # type: ignore

db = Database()

async def get_database(request: Request):
    """Get database from FastAPI app state"""
    return request.app.mongodb

async def get_database_direct():
    """Get database connection directly (for WebSocket manager and tests)"""
    if db.database is None:
        # Use hardcoded connection string since .env file reading has issues
        mongodb_uri = "mongodb+srv://new:123@cluster0.3c9nu6x.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
        db.client = AsyncIOMotorClient(mongodb_uri)
        db.database = db.client.immigrant_job_finder
        print("Direct database connection established")
    return db.database

async def connect_to_mongo():
    db.client = AsyncIOMotorClient(os.getenv("MONGODB_URI"))  # type: ignore
    db.database = db.client.immigrant_job_finder  # type: ignore
    print("Connected to MongoDB")

async def close_mongo_connection():
    if db.client:
        db.client.close()
        print("Disconnected from MongoDB") 