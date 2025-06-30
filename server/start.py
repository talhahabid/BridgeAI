#!/usr/bin/env python3
"""
Production startup script for ImmigrantJobFinder API
"""
import os
import uvicorn
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def main():
    """Start the FastAPI application with production settings"""
    
    # Get configuration from environment variables
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", "8000"))
    debug = os.getenv("DEBUG", "false").lower() == "true"
    
    # Validate required environment variables
    required_vars = ["MONGODB_URI", "JWT_SECRET"]
    missing_vars = [var for var in required_vars if not os.getenv(var)]
    
    if missing_vars:
        print(f"Error: Missing required environment variables: {', '.join(missing_vars)}")
        print("Please check your .env file or environment configuration.")
        exit(1)
    
    # Production settings
    if not debug:
        # Disable debug mode for production
        os.environ["DEBUG"] = "false"
    
    print(f"Starting ImmigrantJobFinder API on {host}:{port}")
    print(f"Debug mode: {debug}")
    
    # Start the server
    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        reload=debug,
        log_level="info" if not debug else "debug",
        access_log=True,
        workers=1  # For production, consider using multiple workers
    )

if __name__ == "__main__":
    main() 