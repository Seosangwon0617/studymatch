# Backend Chat Patch (v4) — dynamic model import

- `Group`, `Membership`, `User` 모델의 **모듈명/클래스명**이 프로젝트마다 다른 상황을 대비해서
  런타임에 여러 후보에서 **동적으로 import** 합니다.
- 덕분에 잘못된 경로로 인해 서버가 import 단계에서 죽는 문제를 방지합니다.

## 적용
1) 압축을 백엔드 루트에 풀고 덮어쓰기
2) (이미 적용했다면 유지) `Group` 모델에
```python
room = relationship("Room", back_populates="group", uselist=False)
```
3) `app/main.py` 에
```python
from app.routers import chat
app.include_router(chat.router)
```
4) 재빌드
```bash
docker compose up --build -d
```

## 엔드포인트
- `POST /chat/rooms/from-group/{group_id}`
- `GET  /chat/rooms?token=ACCESS_TOKEN`
- `GET  /chat/rooms/{room_id}/messages?token=ACCESS_TOKEN`
- `WS   /ws/rooms/{room_id}?token=ACCESS_TOKEN`
