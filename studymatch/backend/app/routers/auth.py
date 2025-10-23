from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.profile import Profile
from app.schemas.auth import RegisterReq, TokenRes, LoginReq
from app.security import hash_password, verify_password, create_access_token

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/register", response_model=TokenRes)
def register(payload: RegisterReq, db: Session = Depends(get_db)):
    exists = db.query(User).filter(User.email == payload.email).first()
    if exists:
        raise HTTPException(status_code=400, detail="Email already registered")
    user = User(email=payload.email, password_hash=hash_password(payload.password), name=payload.name)
    db.add(user)
    db.flush()
    prof = Profile(user_id=user.id, interests=[], availability=[])
    db.add(prof)
    db.commit()
    token = create_access_token({"sub": str(user.id)})
    return TokenRes(access_token=token)

@router.post("/login", response_model=TokenRes)
def login(payload: LoginReq, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_access_token({"sub": str(user.id)})
    return TokenRes(access_token=token)
