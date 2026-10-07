import jwt
import bcrypt
from datetime import datetime, timedelta
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy import select
from sqlalchemy.orm import joinedload
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.models import User, Employee, AuditLog

security = HTTPBearer(auto_error=False)

ALGORITHM = "HS256"

def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
    except Exception:
        return False

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials or token expired.",
            headers={"WWW-Authenticate": "Bearer"},
        )

async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: AsyncSession = Depends(get_db)
) -> User:
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token required.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = credentials.credentials
    payload = decode_access_token(token)
    user_id: Optional[str] = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token payload.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    stmt = (
        select(User)
        .options(
            joinedload(User.employee).joinedload(Employee.department),
            joinedload(User.employee).joinedload(Employee.designation),
            joinedload(User.employee).joinedload(Employee.manager)
        )
        .where(User.id == user_id, User.is_active == True)
    )
    res = await db.execute(stmt)
    user = res.scalar_one_or_none()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account inactive or not found.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user

async def require_hr(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != "HR":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: HR administrative privilege required."
        )
    return current_user

async def log_audit_action(
    db: AsyncSession,
    actor_id: Optional[str],
    actor_name: str,
    action: str,
    entity: str,
    entity_id: Optional[str] = None,
    details: Optional[str] = None,
    ip_address: Optional[str] = "127.0.0.1"
):
    try:
        log = AuditLog(
            actor_id=actor_id,
            actor_name=actor_name,
            action=action,
            entity=entity,
            entity_id=entity_id,
            details=details,
            ip_address=ip_address,
            timestamp=datetime.utcnow()
        )
        db.add(log)
        await db.commit()
    except Exception as e:
        # Never fail main transaction due to logging
        pass
