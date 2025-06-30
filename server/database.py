from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from pymongo import MongoClient
import os
from fastapi import Request
from typing import Optional
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

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
        mongodb_uri = os.getenv("MONGODB_URI")
        if not mongodb_uri:
            raise RuntimeError("MONGODB_URI environment variable not set.")
        db.client = AsyncIOMotorClient(mongodb_uri)
        db.database = db.client.immigrant_job_finder
    return db.database

async def connect_to_mongo():
    mongodb_uri = os.getenv("MONGODB_URI")
    if not mongodb_uri:
        raise RuntimeError("MONGODB_URI environment variable not set.")
    db.client = AsyncIOMotorClient(mongodb_uri)  # type: ignore
    db.database = db.client.immigrant_job_finder  # type: ignore

async def close_mongo_connection():
    if db.client:
        db.client.close() 