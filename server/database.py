from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from pymongo import MongoClient
import os
from fastapi import Request

class Database:
    client: AsyncIOMotorClient = None
    database: AsyncIOMotorDatabase = None

db = Database()

async def get_database(request: Request) -> AsyncIOMotorDatabase:
    """Get database from FastAPI app state"""
    return request.app.mongodb

async def connect_to_mongo():
    db.client = AsyncIOMotorClient(os.getenv("MONGODB_URI"))
    db.database = db.client.immigrant_job_finder
    print("Connected to MongoDB")

async def close_mongo_connection():
    if db.client:
        db.client.close()
        print("Disconnected from MongoDB") 