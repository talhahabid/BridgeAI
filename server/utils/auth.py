import os
from dotenv import load_dotenv
import jwt
from datetime import datetime, timedelta, timezone
from typing import Optional
from passlib.context import CryptContext
import logging
load_dotenv()
# Configure logging
logger = logging.getLogger(__name__)

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT Configuration
ALGORITHM = "HS256"
SECRET_KEY = os.getenv("JWT_SECRET")
if not SECRET_KEY:
    raise ValueError("JWT_SECRET environment variable is required for production")

ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash."""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Hash a password."""
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create a JWT access token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(token: str) -> Optional[str]:
    """Verify and decode a JWT token."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            return None
        return user_id
    except jwt.PyJWTError as e:
        logger.warning(f"JWT verification failed: {e}")
        return None

def get_current_user_id(token: str) -> str:
    """Get current user ID from token, raising exception if invalid."""
    user_id = verify_token(token)
    if user_id is None:
        raise ValueError("Invalid token")
    return user_id

def get_current_user(credentials: str) -> dict:
    """Get current user from credentials."""
    if not credentials:
        raise ValueError("No credentials provided")
    
    try:
        token = credentials.split(" ", 1)[1]
        user_id = get_current_user_id(token)
        return {"id": user_id}
    except (IndexError, ValueError) as e:
        logger.error(f"Authentication error: {e}")
        raise ValueError("Invalid authentication credentials") 