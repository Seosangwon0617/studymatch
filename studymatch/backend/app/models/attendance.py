from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import Integer, String, Enum as SAEnum
from app.database import Base
from datetime import date
import enum

class AttendanceStatus(str, enum.Enum):
    ON_TIME = "ON_TIME"
    LATE = "LATE"
    ABSENT = "ABSENT"

class Attendance(Base):
    __tablename__ = "attendance"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    group_id: Mapped[int] = mapped_column(Integer, index=True)
    user_id: Mapped[int] = mapped_column(Integer, index=True)
    session_date: Mapped[date] = mapped_column()  # uses Python date type
    status: Mapped[AttendanceStatus] = mapped_column(SAEnum(AttendanceStatus))
