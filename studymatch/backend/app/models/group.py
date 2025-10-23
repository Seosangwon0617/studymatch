# app/models/group.py
from sqlalchemy import Column, Integer, String, JSON, Date, Time, ForeignKey
from sqlalchemy.orm import relationship

from app.database import Base

class StudyGroup(Base):
    __tablename__ = "study_groups"

    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    title = Column(String(255), nullable=False)
    desc = Column(String, nullable=True)
    topic = Column(String(50), nullable=False)
    mode = Column(String(20), nullable=False, default="ONLINE")
    location = Column(String(255), nullable=True)
    # store as comma-separated string for portability if ARRAY isn't configured
    days_of_week = Column(String(255), nullable=True)  # e.g., "MON,WED"
    start_time = Column(String(8), nullable=True)      # "HH:MM:SS"
    end_time = Column(String(8), nullable=True)
    start_date = Column(Date, nullable=True)
    end_date = Column(Date, nullable=True)
    need_roles = Column(JSON, nullable=True)
    capacity = Column(Integer, nullable=True)
    status = Column(String(20), nullable=False, default="OPEN")

    # Relationships
    rooms = relationship("Room", back_populates="group", cascade="all, delete-orphan")
