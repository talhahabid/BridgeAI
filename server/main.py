from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import os
import logging

from routes import auth, users, resumes, jobs, qualifications, friends, websocket, chat
from database import get_database

load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    try:
        # Get MongoDB URI from environment variable
        mongodb_uri = os.getenv("MONGODB_URI")
        if not mongodb_uri:
            raise ValueError("MONGODB_URI environment variable is required")
        
        logger.info("Connecting to MongoDB...")
        
        app.mongodb_client = AsyncIOMotorClient(mongodb_uri)  # type: ignore[attr-defined]
        
        # Test the connection
        await app.mongodb_client.admin.command('ping')  # type: ignore[attr-defined]
        logger.info("MongoDB connection successful")
        
        app.mongodb = app.mongodb_client.immigrant_job_finder  # type: ignore[attr-defined]
        
    except Exception as e:
        logger.error(f"Failed to connect to MongoDB: {e}")
        raise
    
    yield
    
    # Shutdown
    if hasattr(app, 'mongodb_client'):
        app.mongodb_client.close()  # type: ignore[attr-defined]
        logger.info("Disconnected from MongoDB")

app = FastAPI(
    title="ImmigrantJobFinder API",
    description="API for helping immigrants find jobs and become qualified in Canada",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware - configure for production
allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(users.router, prefix="/api/users", tags=["Users"])
app.include_router(resumes.router, prefix="/api/resumes", tags=["Resumes"])
app.include_router(jobs.router, prefix="/api/jobs", tags=["Jobs"])
app.include_router(qualifications.router, prefix="/api/qualifications", tags=["Qualifications"])
app.include_router(friends.router, prefix="/api/friends", tags=["Friends"])
app.include_router(websocket.router, tags=["WebSocket"])
app.include_router(chat.router, prefix="/api/chat", tags=["Chat"])

@app.get("/")
async def root():
    return {"message": "Welcome to ImmigrantJobFinder API"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"} 