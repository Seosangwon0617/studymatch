from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.security import get_current_user
from app.schemas.match import MatchItem
from app.matching.engine import compute_scores
from app.models.user import User

router = APIRouter(prefix="/match", tags=["match"])

@router.get("/recommendations", response_model=list[MatchItem])
def recommendations(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    scores = compute_scores(db, user)
    return [MatchItem(**s) for s in scores]
