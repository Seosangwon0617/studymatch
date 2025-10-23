from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import Integer, String, JSON, Boolean, ForeignKey
from app.database import Base

class Profile(Base):
    __tablename__ = "profiles"
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), primary_key=True)
    bio: Mapped[str | None] = mapped_column(String(500))
    location: Mapped[str | None] = mapped_column(String(120))
    is_online_only: Mapped[bool] = mapped_column(Boolean, default=False)
    timezone: Mapped[str | None] = mapped_column(String(64))
    language: Mapped[str | None] = mapped_column(String(32))
    skills: Mapped[dict] = mapped_column(JSON, default=dict)
    interests: Mapped[list] = mapped_column(JSON, default=list)
    level: Mapped[str | None] = mapped_column(String(16))  # BEGINNER|INTERMEDIATE|ADVANCED
    availability: Mapped[list] = mapped_column(JSON, default=list)
    goal: Mapped[str | None] = mapped_column(String(200))
    desired_duration_weeks: Mapped[int | None] = mapped_column(Integer)

    user = relationship("User", back_populates="profile")
