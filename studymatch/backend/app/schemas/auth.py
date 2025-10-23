from pydantic import BaseModel, EmailStr

class RegisterReq(BaseModel):
    email: EmailStr
    password: str
    name: str | None = None

class TokenRes(BaseModel):
    access_token: str
    token_type: str = "bearer"

class LoginReq(BaseModel):
    email: EmailStr
    password: str
