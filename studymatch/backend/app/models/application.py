from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import Integer, String, Enum as SAEnum, ForeignKey, DateTime, UniqueConstraint
from datetime import datetime, timezone
from app.database import Base
import enum

class ApplicationStatus(str, enum.Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"

class Application(Base):
    __tablename__ = "applications"
    __table_args__ = (UniqueConstraint("group_id", "user_id", name="uq_app_group_user"), )
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    group_id: Mapped[int] = mapped_column(Integer, ForeignKey("study_groups.id", ondelete="CASCADE"), index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True)
    message: Mapped[str | None] = mapped_column(String(500))
    status: Mapped[ApplicationStatus] = mapped_column(SAEnum(ApplicationStatus), default=ApplicationStatus.PENDING)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
