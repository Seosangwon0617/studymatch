import { useEffect, useRef, useState } from "react";
import { api } from "./api"; // adjust path

export default function Chat({ token }) {
  const [rooms, setRooms] = useState([]);
  const [active, setActive] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const wsRef = useRef(null);

  const loadRooms = async () => {
    try {
      const data = await api("/chat/rooms", { token });
      setRooms(data);
      if (data.length && !active) setActive(data[0]);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { loadRooms(); }, []);

  useEffect(() => {
    const run = async () => {
      if (!active) return;
      const hist = await api(`/chat/rooms/${active.id}/messages`, { token });
      setMessages(hist);
      const base = window.location.origin.replace(/^http/, "ws");
      const ws = new WebSocket(`${base}/ws/rooms/${active.id}?token=${encodeURIComponent(token)}`);
      wsRef.current = ws;
      ws.onmessage = (ev) => {
        try { const msg = JSON.parse(ev.data); setMessages((p) => [...p, msg]); } catch {}
      };
    };
    run();
    return () => { if (wsRef.current) { wsRef.current.close(); wsRef.current = null; } };
  }, [active, token]);

  const send = () => {
    if (wsRef.current && input.trim()) { wsRef.current.send(input.trim()); setInput(""); }
  };

  return (
    <div className="grid grid-cols-12 gap-4">
      <div className="col-span-4 border rounded-2xl p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="font-semibold">내 채팅방</div>
          <button className="px-2 py-1 border rounded-xl" onClick={loadRooms}>새로고침</button>
        </div>
        <div className="space-y-2">
          {rooms.map((r) => (
            <div key={r.id}>
              <button onClick={() => setActive(r)} className={`w-full text-left px-3 py-2 rounded-xl border ${active && active.id === r.id ? "bg-gray-100" : ""}`}>
                #{r.id} · {r.name}
              </button>
            </div>
          ))}
          {rooms.length === 0 && <div className="text-sm text-gray-500">참여 중인 그룹의 채팅방이 없습니다.</div>}
        </div>
      </div>
      <div className="col-span-8 border rounded-2xl p-3 flex flex-col h-[60vh]">
        <div className="font-semibold mb-2">{active ? `Room #${active.id} · ${active.name}` : "채팅방을 선택하세요"}</div>
        <div className="flex-1 overflow-auto space-y-2">
          {messages.map((m) => (
            <div key={m.id} className="p-2 rounded-xl bg-gray-50">
              <div className="text-xs text-gray-500">user:{m.user_id} · {new Date(m.created_at).toLocaleTimeString()}</div>
              <div>{m.content}</div>
            </div>
          ))}
        </div>
        <div className="mt-2 flex gap-2">
          <input className="flex-1 border rounded-xl px-3 py-2" value={input} onChange={(e)=>setInput(e.target.value)} placeholder="메시지를 입력..." />
          <button className="px-4 py-2 border rounded-xl" onClick={send}>전송</button>
        </div>
      </div>
    </div>
  );
}
