// src/pages/Chat.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { api } from "../api";

/** 시간/날짜 유틸 */
const fmtTime = (iso) => {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
};
const fmtDateKey = (iso) => {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString();
  } catch {
    return "Unknown";
  }
};

/** 프로필 이니셜 */
const initials = (name = "") => {
  const t = name.trim();
  if (!t) return "U";
  const parts = t.split(/\s+/);
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? "U";
  return (parts[0][0] + parts[1][0]).toUpperCase();
};

/** WS 베이스 (Vite .env 지원 + 로컬 기본값) */
const wsBase = () => {
  const http = (import.meta.env.VITE_API_BASE || "http://localhost:8000");
  return http.replace(/^http/i, "ws");
};

export default function Chat({ token }) {
  const [me, setMe] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [active, setActive] = useState(null);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [loadingMsg, setLoadingMsg] = useState(false);

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [connecting, setConnecting] = useState(false);

  const wsRef = useRef(null);
  const endRef = useRef(null);

  /** 내 프로필 / 방 목록 */
  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const profile = await api("/me", { token });
        setMe(profile);
      } catch (e) {
        console.error(e);
      }
    })();
  }, [token]);

  useEffect(() => {
    if (!token) return;
    setLoadingRooms(true);
    api("/chat/rooms", { token })
      .then((data) => {
        setRooms(data || []);
        if (!active && data && data.length) setActive(data[0]);
      })
      .catch((e) => console.error(e))
      .finally(() => setLoadingRooms(false));
  }, [token]);

  /** 메시지 이력 + WebSocket */
  useEffect(() => {
    if (!active || !token) return;

    let closed = false;
    const open = async () => {
      setLoadingMsg(true);
      try {
        const hist = await api(`/chat/rooms/${active.id}/messages`, { token });
        setMessages(hist || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingMsg(false);
      }

      setConnecting(true);
      const ws = new WebSocket(`${wsBase()}/ws/rooms/${active.id}?token=${encodeURIComponent(token)}`);
      wsRef.current = ws;

      ws.onopen = () => setConnecting(false);
      ws.onclose = () => {
        if (!closed) {
          // 간단한 재연결 (옵션)
          setTimeout(() => {
            if (!closed) open();
          }, 1500);
        }
      };
      ws.onerror = (e) => console.error("WS error", e);
      ws.onmessage = (ev) => {
        try {
          const msg = JSON.parse(ev.data);
          setMessages((prev) => [...prev, msg]);
        } catch {
          // 혹시 서버에서 잘못 온 경우 무시
        }
      };
    };

    open();

    return () => {
      closed = true;
      if (wsRef.current) {
        try {
          wsRef.current.close();
        } catch {}
        wsRef.current = null;
      }
      setMessages([]);
    };
  }, [active, token]);

  /** 스크롤을 항상 아래로 */
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loadingMsg]);

  /** 날짜 별로 그룹핑 */
  const grouped = useMemo(() => {
    const map = new Map();
    for (const m of messages) {
      const key = fmtDateKey(m.created_at);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(m);
    }
    return Array.from(map.entries()); // [ [dateKey, msgs], ... ]
  }, [messages]);

  /** 전송 (우리 WS 서버는 plain text 기대) */
  const send = () => {
    if (!wsRef.current || !input.trim()) return;
    wsRef.current.send(input.trim());
    setInput("");
  };

  /** 방 새로고침 */
  const reloadRooms = () => {
    if (!token) return;
    setLoadingRooms(true);
    api("/chat/rooms", { token })
      .then(setRooms)
      .catch(console.error)
      .finally(() => setLoadingRooms(false));
  };

  return (
    <div className="h-[calc(100vh-64px)] grid grid-cols-12 gap-0 bg-[#e9ecef]">
      {/* 좌측: 방 목록 (카톡 리스트 느낌) */}
      <aside className="col-span-4 bg-white border-r border-gray-200 flex flex-col">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-yellow-300 flex items-center justify-center font-semibold">
              {initials(me?.name || me?.email || "Me")}
            </div>
            <div className="leading-tight">
              <div className="font-semibold">{me?.name || "나"}</div>
              <div className="text-xs text-gray-500">{me?.email || ""}</div>
            </div>
          </div>
          <button
            onClick={reloadRooms}
            className="text-sm px-3 py-1.5 rounded-xl border border-gray-200 hover:bg-gray-50"
          >
            새로고침
          </button>
        </div>

        <div className="px-3 py-2">
          <input
            className="w-full bg-gray-100 rounded-2xl px-3 py-2 text-sm outline-none"
            placeholder="대화 검색"
            onChange={() => {}}
          />
        </div>

        <div className="flex-1 overflow-auto">
          {loadingRooms && (
            <div className="p-4 text-sm text-gray-500">채팅방을 불러오는 중...</div>
          )}
          {!loadingRooms && rooms.length === 0 && (
            <div className="p-4 text-sm text-gray-500">참여 중인 채팅방이 없습니다.</div>
          )}
          {!loadingRooms &&
            rooms.map((r) => {
              const activeSel = active?.id === r.id;
              return (
                <button
                  key={r.id}
                  onClick={() => setActive(r)}
                  className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 ${activeSel ? "bg-gray-100" : ""}`}
                >
                  <div className="w-12 h-12 rounded-2xl bg-yellow-200 flex items-center justify-center font-bold">
                    {r.name?.[0]?.toUpperCase() || "R"}
                  </div>
                  <div className="flex-1 text-left">
                    <div className="flex items-center justify-between">
                      <div className="font-semibold truncate">{r.name || `Room #${r.id}`}</div>
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      그룹 #{r.group_id}
                    </div>
                  </div>
                </button>
              );
            })}
        </div>
      </aside>

      {/* 우측: 채팅창 (카카오톡 버블) */}
      <section className="col-span-8 flex flex-col">
        {/* 상단바 */}
        <div className="h-14 bg-[#fef01b] flex items-center px-4 border-b border-yellow-200">
          <div className="font-semibold">
            {active ? (active.name || `Room #${active.id}`) : "채팅"}
          </div>
          <div className="ml-auto text-xs text-gray-700">
            {connecting ? "연결 중..." : "연결됨"}
          </div>
        </div>

        {/* 메시지 리스트 */}
        <div className="flex-1 overflow-auto px-3 py-4">
          {loadingMsg && <div className="text-sm text-gray-500 px-2">메시지를 불러오는 중...</div>}

          {!loadingMsg && active && grouped.map(([dateKey, items]) => (
            <div key={dateKey} className="mb-4">
              {/* 날짜 구분선 */}
              <div className="flex items-center my-3">
                <div className="flex-1 h-px bg-gray-300" />
                <div className="px-3 text-[11px] text-gray-500">{dateKey}</div>
                <div className="flex-1 h-px bg-gray-300" />
              </div>

              {/* 버블들 */}
              {items.map((m) => {
                const mine = me && Number(m.user_id) === Number(me.id);
                return (
                  <div
                    key={m.id}
                    className={`flex items-end mb-2 ${mine ? "justify-end" : "justify-start"}`}
                  >
                    {!mine && (
                      <div className="mr-2">
                        <div className="w-8 h-8 rounded-full bg-yellow-300 flex items-center justify-center text-xs font-bold">
                          {initials(String(m.user_id))}
                        </div>
                      </div>
                    )}

                    <div className={`max-w-[70%] ${mine ? "items-end" : "items-start"} flex flex-col`}>
                      {!mine && (
                        <div className="text-[11px] text-gray-500 mb-1">user:{m.user_id}</div>
                      )}
                      <div
                        className={`px-3 py-2 rounded-2xl leading-relaxed break-words ${
                          mine
                            ? "bg-[#ffe812] rounded-tr-sm"
                            : "bg-white border border-gray-200 rounded-tl-sm"
                        }`}
                      >
                        {m.content}
                      </div>
                      <div className={`text-[10px] mt-1 ${mine ? "text-right" : "text-left"} text-gray-400`}>
                        {fmtTime(m.created_at)}
                      </div>
                    </div>

                    {mine && <div className="ml-2 w-8" />}
                  </div>
                );
              })}
            </div>
          ))}
          <div ref={endRef} />
        </div>

        {/* 입력창 */}
        <div className="h-16 bg-white border-t border-gray-200 px-3 flex items-center gap-2">
          <button
            type="button"
            className="w-9 h-9 rounded-full bg-gray-100 grid place-items-center text-gray-600"
            title="추가기능(파일/이모티콘 등)"
            onClick={() => alert("추가기능은 나중에 붙일게요 :)")}
          >
            +
          </button>
          <input
            className="flex-1 bg-gray-100 rounded-2xl px-4 py-2 outline-none"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="메시지를 입력하세요"
            onKeyDown={(e) => (e.key === "Enter" ? send() : null)}
          />
          <button
            type="button"
            onClick={send}
            className="px-4 py-2 rounded-2xl bg-[#ffe812] hover:brightness-95 font-semibold"
          >
            전송
          </button>
        </div>
      </section>
    </div>
  );
}
