# app/security.py
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any

from fastapi import HTTPException, Depends, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from passlib.context import CryptContext
from sqlalchemy.orm import Session

# ----- Password hashing -----
# bcrypt 72바이트 제한 회피를 위해 bcrypt_sha256 우선
pwd_context = CryptContext(schemes=["bcrypt_sha256", "bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    if not isinstance(password, str):
        raise ValueError("password must be a string")
    return pwd_context.hash(password)

def verify_password(plain_password: str, password_hash: str) -> bool:
    try:
        return pwd_context.verify(plain_password, password_hash)
    except Exception:
        return False

# ----- Settings helper -----
try:
    from app.config import settings  # pydantic Settings
except Exception:
    settings = None

def _get_secret_and_algo():
    secret = None
    algo = None
    exp_min = None
    if settings:
        secret = getattr(settings, "JWT_SECRET", None) or getattr(settings, "SECRET_KEY", None)
        algo = getattr(settings, "JWT_ALGORITHM", None) or getattr(settings, "ALGORITHM", None)
        exp_min = getattr(settings, "ACCESS_TOKEN_EXPIRE_MINUTES", None)
    if not secret:
        secret = "changeme"  # 개발 기본값 (프로덕션에서는 환경변수 필수)
    if not algo:
        algo = "HS256"
    if not isinstance(exp_min, int) or exp_min <= 0:
        exp_min = 60  # 기본 60분
    return secret, algo, exp_min

# ----- JWT -----
def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    secret, algo, exp_min = _get_secret_and_algo()
    to_encode = data.copy()
    now = datetime.now(timezone.utc)
    expire = now + (expires_delta if expires_delta else timedelta(minutes=exp_min))
    to_encode.update({"exp": expire, "iat": now})
    return jwt.encode(to_encode, secret, algorithm=algo)

def decode_token(token: str) -> dict:
    secret, algo, _ = _get_secret_and_algo()
    try:
        payload = jwt.decode(token, secret, algorithms=[algo])
        return payload
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

# ----- FastAPI dependency: get_current_user -----
from app.db import get_db
from app.models.user import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    """
    Authorization: Bearer <token> 로 전달된 JWT를 디코드해 현재 유저를 반환.
    """
    payload = decode_token(token)
    sub = payload.get("sub")
    try:
        user_id = int(sub)
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid subject in token")
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user
