# StudyMatch (Python/FastAPI)
Quickstart:

## Docker
```bash
docker compose up --build -d
# API: http://localhost:8000 (Swagger: /docs)
```

## Local (SQLite)
```bash
cd backend
python -m venv .venv && source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
export DATABASE_URL=sqlite+pysqlite:///./dev.db
uvicorn app.main:app --reload
```

## Auth flow
1) POST /auth/register { email, password, name } -> access_token
2) Use Authorization: Bearer <token>
3) GET /me, GET/PUT /me/profile

## Core endpoints
- POST /groups, GET /groups, GET /groups/{id}
- POST /groups/{id}/apply
- GET /match/recommendations
- WebSocket echo: ws://localhost:8000/ws/echo
