from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.security import get_current_user
from app.schemas.user import UserOut, ProfileIn, ProfileOut
from app.models.user import User

router = APIRouter(prefix="/me", tags=["users"])

@router.get("", response_model=UserOut)
def me(user: User = Depends(get_current_user)):
    return user

@router.get("/profile", response_model=ProfileOut)
def get_profile(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    if not user.profile:
        raise HTTPException(404, "Profile not found")
    return user.profile

@router.put("/profile", response_model=ProfileOut)
def update_profile(payload: ProfileIn, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    prof = user.profile
    for k, v in payload.model_dict().items() if hasattr(payload, "model_dict") else payload.model_dump().items():
        setattr(prof, k, v)
    db.add(prof)
    db.commit()
    db.refresh(prof)
    return prof
