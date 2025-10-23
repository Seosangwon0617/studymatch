from pydantic_settings import BaseSettings
from pydantic import Field, validator
from typing import List, Optional
import os, json

class Settings(BaseSettings):
    DATABASE_URL: str = Field(default="postgresql+psycopg://postgres:postgres@db:5432/postgres")
    JWT_SECRET: str = Field(default="dev-secret")
    JWT_ALG: str = Field(default="HS256")
    CORS_ORIGINS: List[str] | None = Field(default=None)
    REDIS_URL: Optional[str] = Field(default=None)

    @validator("CORS_ORIGINS", pre=True)
    def parse_cors(cls, v):
        if v is None:
            return ["*"]
        if isinstance(v, list):
            return v
        s = str(v).strip()
        if s == "*":
            return ["*"]
        # accept JSON list or comma-separated
        try:
            return json.loads(s)
        except Exception:
            return [p.strip() for p in s.split(",") if p.strip()]

settings = Settings()
