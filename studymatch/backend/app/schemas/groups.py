# app/schemas/groups.py
from __future__ import annotations
from typing import Optional, List, Dict
from datetime import time, date
from pydantic import BaseModel, Field

class GroupCreate(BaseModel):
    title: str
    desc: Optional[str] = None
    topic: str
    mode: str = "ONLINE"
    location: Optional[str] = None
    days_of_week: List[str] = Field(default_factory=list)
    # 요청은 문자열 "HH:MM:SS"로 받습니다.
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    need_roles: Dict[str, int] = Field(default_factory=dict)
    capacity: int = 4

class GroupOut(BaseModel):
    id: int
    owner_id: int
    title: str
    desc: Optional[str] = None
    topic: str
    mode: str
    location: Optional[str] = None
    days_of_week: List[str] = Field(default_factory=list)
    # 응답은 datetime.time 으로 직렬화 → "HH:MM:SS" 문자열로 나감
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    need_roles: Dict[str, int] = Field(default_factory=dict)
    capacity: int = 4
    status: str

    class Config:
        from_attributes = True  # SQLAlchemy 모델 → Pydantic 변환용
