# Kakao-style Chat Patch (studymatch-web)

이 패치는 카카오톡 느낌의 채팅 UI를 추가합니다.

## 포함 파일
- `src/pages/Chat.jsx` : 카톡 스타일 말풍선, 날짜 구분선, 타임스탬프, 좌측 채팅방 목록

## 백엔드 엔드포인트 가정
- 방 목록: `GET /chat/rooms`
- 메시지 이력: `GET /chat/rooms/:roomId/messages`
- WebSocket: `WS /ws/rooms/:roomId?token=...`
- 메시지 페이로드 예시:
  ```json
  { "id": 1, "room_id": 10, "user_id": 1, "content": "안녕하세요", "created_at": "2025-10-14T12:00:00Z" }
  ```

## App.jsx 수정 안내

1) Chat 페이지 import
```jsx
import Chat from "./pages/Chat";
```

2) 탭 버튼 추가 (예시)
```jsx
<button onClick={() => setTab("chat")} className={tab==="chat" ? "font-bold" : ""}>
  Chat
</button>
```

3) 렌더 스위치 추가
```jsx
{tab === "chat" && <Chat token={token} />}
```

> `token`은 로그인 성공 후 받은 액세스 토큰 문자열입니다.

## 환경변수(.env) (선택)
프론트에서 API 베이스를 지정하고 싶으면 Vite 환경변수 사용:
```
VITE_API_BASE=http://localhost:8000
```

## 스타일
TailwindCSS 클래스 기반입니다. 별도 CSS는 필요 없습니다.

## 실행
```bash
npm install
npm run dev
```
브라우저에서 http://localhost:5173 열고 Chat 탭을 사용하세요.
