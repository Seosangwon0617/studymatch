from __future__ import annotations
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware   # ✅ 추가
from app.database import init_db
from app.routers import auth, users, groups, applications, match, chat

app = FastAPI(title="studymatch", version="0.1.0")

# ✅ CORS 허용
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    init_db()

@app.get("/")
def root():
    return {"ok": True, "service": "studymatch", "version": "0.1.0"}

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(groups.router)
app.include_router(applications.router)
app.include_router(match.router)
app.include_router(chat.router)
