from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List

class RoomOut(BaseModel):
    id: int
    group_id: int
    title: str
    created_at: datetime

    class Config:
        from_attributes = True

class MessageOut(BaseModel):
    id: int
    room_id: int
    user_id: int
    content: str
    created_at: datetime

    class Config:
        from_attributes = True

class PostMessageReq(BaseModel):
    content: str
