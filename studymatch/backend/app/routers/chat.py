# app/routers/chat.py
from typing import List, Optional, Dict, Any

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.room import Room
from app.models.group import StudyGroup
from app.models.message import Message
from app.security import get_current_user
from app.models.user import User

router = APIRouter(prefix="/chat", tags=["chat"])

def get_group_or_404(db: Session, group_id: int) -> StudyGroup:
    group = db.query(StudyGroup).filter(StudyGroup.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    return group

@router.post("/rooms/from-group/{group_id}")
def ensure_room_from_group(group_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> Dict[str, Any]:
    group = get_group_or_404(db, group_id)
    # Only owner can spawn a room by default (adjust if needed)
    if group.owner_id and group.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only owner can create room for this group")

    room = db.query(Room).filter(Room.group_id == group.id).first()
    if room:
        return {"id": room.id, "name": room.name, "group_id": room.group_id}

    room = Room(name=f"{group.title}", group_id=group.id)
    db.add(room)
    db.commit()
    db.refresh(room)
    return {"id": room.id, "name": room.name, "group_id": room.group_id}

@router.get("/rooms")
def my_rooms(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> List[Dict[str, Any]]:
    # list rooms for groups owned by current user (simple policy)
    rooms = (
        db.query(Room)
        .join(StudyGroup, StudyGroup.id == Room.group_id)
        .filter(StudyGroup.owner_id == current_user.id)
        .all()
    )
    return [{"id": r.id, "name": r.name, "group_id": r.group_id} for r in rooms]

@router.post("/rooms/{room_id}/messages")
def send_message(room_id: int, payload: Dict[str, Any], db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> Dict[str, Any]:
    room = db.query(Room).get(room_id)
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    text = (payload or {}).get("text")
    if not text:
        raise HTTPException(status_code=422, detail="text is required")
    msg = Message(room_id=room.id, user_id=current_user.id, text=text)
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return {"id": msg.id, "room_id": msg.room_id, "user_id": msg.user_id, "text": msg.text, "created_at": str(msg.created_at)}

@router.get("/rooms/{room_id}/messages")
def list_messages(room_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> List[Dict[str, Any]]:
    room = db.query(Room).get(room_id)
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    rows = db.query(Message).filter(Message.room_id == room.id).order_by(Message.id.asc()).all()
    return [{"id": m.id, "room_id": m.room_id, "user_id": m.user_id, "text": m.text, "created_at": str(m.created_at)} for m in rows]
