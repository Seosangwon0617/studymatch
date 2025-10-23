# app/models/membership.py
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import Integer, Enum as SAEnum, ForeignKey, UniqueConstraint, DateTime
from app.database import Base
from datetime import datetime, timezone
import enum

class Role(str, enum.Enum):
    MEMBER = "MEMBER"
    OWNER = "OWNER"

class Membership(Base):
    __tablename__ = "memberships"
    __table_args__ = (UniqueConstraint("group_id", "user_id", name="uq_member_group_user"), )
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    group_id: Mapped[int] = mapped_column(Integer, ForeignKey("study_groups.id", ondelete="CASCADE"), index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True)
    role: Mapped[Role] = mapped_column(SAEnum(Role), default=Role.MEMBER)
    joined_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    # ✅ 관계 추가
    user = relationship("User", back_populates="memberships")
    group = relationship("StudyGroup", back_populates="memberships")
