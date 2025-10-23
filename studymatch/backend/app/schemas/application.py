from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ApplicationCreate(BaseModel):
    message: Optional[str] = None

class ApplicationOut(BaseModel):
    id: int
    group_id: int
    user_id: int
    message: Optional[str] = None
    status: str
    created_at: datetime

    class Config:
        from_attributes = True
