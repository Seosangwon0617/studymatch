from __future__ import annotations
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import time as dtime
from app.database import get_db
from app.security import get_current_user
from app.models.group import StudyGroup, Mode, GroupStatus
from app.schemas.groups import GroupCreate, GroupOut

router = APIRouter(prefix="/groups", tags=["groups"])

def _parse_time(s: str | None) -> dtime | None:
    if not s:
        return None
    try:
        h, m, sec = s.split(":")
        return dtime(int(h), int(m), int(sec))
    except Exception:
        raise HTTPException(status_code=422, detail=f"Invalid time format: {s}")

@router.post("", response_model=GroupOut)
def create_group(payload: GroupCreate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    grp = StudyGroup(
        owner_id=user.id,
        title=payload.title,
        desc=payload.desc,
        topic=payload.topic,
        mode=payload.mode or "ONLINE",
        location=payload.location,
        days_of_week=payload.days_of_week or [],
        start_time=_parse_time(payload.start_time),
        end_time=_parse_time(payload.end_time),
        need_roles=payload.need_roles or {},
        capacity=payload.capacity or 4,
        status="OPEN",
    )
    db.add(grp)
    db.commit()
    db.refresh(grp)
    return grp

@router.get("", response_model=list[GroupOut])
def list_groups(topic: str | None = None, mode: str | None = None, db: Session = Depends(get_db)):
    q = db.query(StudyGroup)
    if topic:
        q = q.filter(StudyGroup.topic == topic)
    if mode:
        q = q.filter(StudyGroup.mode == mode)
    return q.order_by(StudyGroup.id.desc()).all()

@router.get("/{group_id}", response_model=GroupOut)
def get_group(group_id: int, db: Session = Depends(get_db)):
    grp = db.get(StudyGroup, group_id)
    if not grp:
        raise HTTPException(status_code=404, detail="StudyGroup not found")
    return grp
