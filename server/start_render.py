#!/usr/bin/env python3
"""
Render deployment startup script
"""
import os
import uvicorn

if __name__ == "__main__":
    # Get port from environment variable (Render provides this)
    port = int(os.getenv("PORT", "8000"))
    
    print(f"Starting server on port {port}")
    
    # Start the server bound to all interfaces
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        reload=False,
        log_level="info"
    ) 