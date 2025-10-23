from pydantic import BaseModel, EmailStr

class UserOut(BaseModel):
    id: int
    email: EmailStr
    name: str | None
    class Config:
        from_attributes = True

class ProfileIn(BaseModel):
    bio: str | None = None
    location: str | None = None
    is_online_only: bool = False
    timezone: str | None = None
    language: str | None = None
    skills: dict = {}
    interests: list[str] = []
    level: str | None = None
    availability: list[dict] = []
    goal: str | None = None
    desired_duration_weeks: int | None = None

class ProfileOut(ProfileIn):
    user_id: int
    class Config:
        from_attributes = True
