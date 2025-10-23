# app/models/room.py
from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship

from app.database import Base

class Room(Base):
    __tablename__ = "rooms"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), nullable=False)
    group_id = Column(Integer, ForeignKey("study_groups.id", ondelete="CASCADE"), nullable=False)

    # Relationships
    group = relationship("StudyGroup", back_populates="rooms")
    messages = relationship("Message", back_populates="room", cascade="all, delete-orphan")
