import React, { useEffect, useMemo, useState } from "react";

import Chat from "./pages/Chat";

/**
 * StudyMatch Frontend — Single-file React SPA
 * - Tailwind classes for styling (no external UI deps required)
 * - Minimal client-side router
 * - Works against the FastAPI backend you have running on http://localhost:8000
 *
 * Pages
 *  - Login / Register
 *  - Profile (view/update)
 *  - Groups (list / create)
 *  - Recommendations (match)
 *
 * Notes
 *  - JWT is stored in localStorage under 'token'
 *  - Adjust API_BASE if you reverse-proxy
 */

const API_BASE = "http://localhost:8000";

function useToken() {
  const [token, setTokenState] = useState(() => localStorage.getItem("token") || "");
  const setToken = (t) => {
    setTokenState(t || "");
    if (t) localStorage.setItem("token", t);
    else localStorage.removeItem("token");
  };
  return { token, setToken };
}

async function api(path, { method = "GET", token, body } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `${res.status} ${res.statusText}`);
  }
  const ct = res.headers.get("content-type") || "";
  return ct.includes("application/json") ? res.json() : res.text();
}

function Field({ label, children }) {
  return (
    <label className="block mb-3">
      <div className="text-sm text-gray-600 mb-1">{label}</div>
      {children}
    </label>
  );
}

function Button({ children, className = "", ...props }) {
  return (
    <button
      className={
        "px-4 py-2 rounded-xl shadow-sm border border-gray-200 hover:shadow transition " +
        "bg-white hover:bg-gray-50 " +
        className
      }
      {...props}
    >
      {children}
    </button>
  );
}

function PrimaryButton({ children, className = "", ...props }) {
  return (
    <button
      className={("px-4 py-2 rounded-xl shadow-sm transition text-white " +
        "bg-indigo-600 hover:bg-indigo-700 ") + className}
      {...props}
    >
      {children}
    </button>
  );
}

function Nav({ tab, setTab, authed, onLogout }) {
  const Tab = ({ id, label }) => (
    <button
      onClick={() => setTab(id)}
      className={
        "px-3 py-2 rounded-lg text-sm " +
        (tab === id ? "bg-indigo-600 text-white" : "hover:bg-gray-100 text-gray-700")
      }
    >
      {label}
    </button>
  );
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="text-xl font-semibold">StudyMatch</div>
      <div className="flex items-center gap-2">
        <Tab id="home" label="Home" />
        {authed && <Tab id="profile" label="Profile" />}
        {authed && <Tab id="groups" label="Groups" />}
        {authed && <Tab id="match" label="Match" />}
      </div>
      <div>
        {authed ? (
          <Button onClick={onLogout}>Logout</Button>
        ) : (
          <></>
        )}
      </div>
    </div>
  );
}

function AuthPanel({ setToken }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      if (mode === "register") {
        await api("/auth/register", {
          method: "POST",
          body: { email, password, name },
        });
      }
      const data = await api("/auth/login", {
        method: "POST",
        body: { email, password },
      });
      setToken(data.access_token);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md w-full mx-auto p-6 bg-white rounded-2xl shadow">
      <div className="flex items-center justify-between mb-4">
        <div className="text-lg font-semibold">{mode === "login" ? "로그인" : "회원가입"}</div>
        <button className="text-sm text-indigo-600" onClick={() => setMode(mode === "login" ? "register" : "login")}>
          {mode === "login" ? "회원가입으로" : "로그인으로"}
        </button>
      </div>
      <form onSubmit={submit}>
        {mode === "register" && (
          <Field label="이름">
            <input className="w-full border rounded-xl px-3 py-2" value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
        )}
        <Field label="이메일">
          <input className="w-full border rounded-xl px-3 py-2" value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field label="비밀번호">
          <input type="password" className="w-full border rounded-xl px-3 py-2" value={password} onChange={(e) => setPassword(e.target.value)} />
        </Field>
        {err && <div className="text-red-600 text-sm mb-3 whitespace-pre-wrap">{err}</div>}
        <PrimaryButton className="w-full" disabled={loading}>{loading ? "처리 중..." : (mode === "login" ? "로그인" : "회원가입")}</PrimaryButton>
      </form>
    </div>
  );
}

function Home({ token }) {
  const [me, setMe] = useState(null);
  useEffect(() => {
    if (!token) return;
    api("/me", { token }).then(setMe).catch(() => {});
  }, [token]);
  return (
    <div className="space-y-3">
      <div className="text-2xl font-semibold">환영합니다 👋</div>
      <div className="text-gray-600">빠르게 스터디를 찾고 매칭해보세요.</div>
      {me && (
        <div className="p-4 bg-white rounded-2xl shadow border">
          <div className="font-medium">내 정보</div>
          <div className="text-sm text-gray-600">{me.email} · {me.name || "이름 없음"}</div>
        </div>
      )}
    </div>
  );
}

function Profile({ token }) {
  const [data, setData] = useState(null);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    api("/me/profile", { token })
      .then(setData)
      .catch(() => setData({
        location: "",
        is_online_only: false,
        language: "ko",
        level: "INTERMEDIATE",
        interests: ["python"],
        availability: [],
        goal: "",
        desired_duration_weeks: 8,
      }));
  }, [token]);

  const update = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErr("");
    try {
      const body = { ...data };
      const res = await api("/me/profile", { method: "PUT", token, body });
      setData(res);
    } catch (e) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (!data) return <div>로딩 중...</div>;

  return (
    <form className="grid gap-4 max-w-2xl" onSubmit={update}>
      <div className="text-xl font-semibold">프로필</div>
      <Field label="지역">
        <input className="w-full border rounded-xl px-3 py-2" value={data.location || ""} onChange={(e) => setData({ ...data, location: e.target.value })} />
      </Field>
      <div className="flex gap-4">
        <label className="inline-flex items-center gap-2">
          <input type="checkbox" className="scale-110" checked={!!data.is_online_only} onChange={(e) => setData({ ...data, is_online_only: e.target.checked })} />
          온라인만
        </label>
        <Field label="언어">
          <input className="border rounded-xl px-3 py-2" value={data.language || ""} onChange={(e) => setData({ ...data, language: e.target.value })} />
        </Field>
        <Field label="레벨">
          <select className="border rounded-xl px-3 py-2" value={data.level || ""} onChange={(e) => setData({ ...data, level: e.target.value })}>
            <option>BEGINNER</option>
            <option>INTERMEDIATE</option>
            <option>ADVANCED</option>
          </select>
        </Field>
      </div>
      <Field label="관심사(쉼표 구분)">
        <input className="w-full border rounded-xl px-3 py-2" value={(data.interests || []).join(", ")} onChange={(e) => setData({ ...data, interests: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })} />
      </Field>
      <Field label="목표">
        <input className="w-full border rounded-xl px-3 py-2" value={data.goal || ""} onChange={(e) => setData({ ...data, goal: e.target.value })} />
      </Field>
      <div className="flex items-center gap-2">
        <PrimaryButton disabled={saving}>{saving ? "저장 중..." : "저장"}</PrimaryButton>
        {err && <div className="text-sm text-red-600">{err}</div>}
      </div>
    </form>
  );
}

function Groups({ token }) {
  const [list, setList] = useState([]);
  const [topic, setTopic] = useState("python");
  const [err, setErr] = useState("");
  const [applied, setApplied] = useState([]);
  const [me, setMe] = useState(null);
  const [appsByGroup, setAppsByGroup] = useState({}); // { [groupId]: ApplicationOut[] }

  const load = async () => {
    setErr("");
    try {
      const q = topic ? `?topic=${encodeURIComponent(topic)}` : "";
      const data = await api(`/groups${q}`);
      setList(data);
    } catch (e) {
      setErr(e.message || String(e));
    }
  };

  useEffect(() => {
    load();
    if (token) api("/me", { token }).then(setMe).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const apply = async (groupId) => {
    setErr("");
    try {
      await api(`/applications/groups/${groupId}/apply`, {
        method: "POST",
        token,
        body: { message: "참여 희망합니다!" },
      });
      setApplied((prev) => Array.from(new Set([...prev, groupId])));
      alert("지원 완료!");
    } catch (e) {
      setErr(e.message || String(e));
    }
  };

  const showApps = async (groupId) => {
    try {
      const apps = await api(`/applications/groups/${groupId}`, { token });
      setAppsByGroup((prev) => ({ ...prev, [groupId]: apps }));
    } catch (e) {
      setErr(e.message || String(e));
    }
  };

  return (
    <>
      <div className="mb-3 flex items-center gap-2">
        <input
          className="border rounded-xl px-3 py-2"
          placeholder="토픽으로 검색 (예: python)"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
        />
        <Button onClick={load}>검색</Button>
        {err && (
          <div className="text-red-600 text-sm ml-2">
            {err}
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {list.map((g) => {
          const isOwner = me && me.id === g.owner_id;
          const infoLineParts = [];
          if (Array.isArray(g.days_of_week) && g.days_of_week.length > 0) {
            infoLineParts.push(g.days_of_week.join(", "));
          }
          if (g.start_time) {
            infoLineParts.push(g.start_time);
          }
          const infoLine = infoLineParts.join(" · ");

          return (
            <div key={g.id} className="p-4 border rounded-2xl bg-white shadow-sm">
              <div className="text-lg font-semibold">{g.title}</div>
              <div className="text-sm text-gray-600">
                #{g.id} · {g.topic} · {g.mode}
              </div>
              <div className="text-sm text-gray-600">{infoLine}</div>
              {g.desc && <div className="mt-2 text-gray-700">{g.desc}</div>}

              {/* 신청자 버튼 */}
              {!isOwner && token && (
                <PrimaryButton
                  className="mt-3"
                  onClick={() => apply(g.id)}
                  disabled={applied.includes(g.id)}
                >
                  {applied.includes(g.id) ? "지원 완료" : "지원하기"}
                </PrimaryButton>
              )}

              {/* 오너 전용: 신청 관리 */}
              {isOwner && token && (
                <div className="mt-3">
                  <Button onClick={() => showApps(g.id)}>신청 관리 보기</Button>

                  {Array.isArray(appsByGroup[g.id]) && (
                    <div className="mt-3 border-t pt-3 space-y-2">
                      {appsByGroup[g.id].length === 0 ? (
                        <div className="text-sm text-gray-500">신청이 아직 없습니다.</div>
                      ) : (
                        appsByGroup[g.id].map((a) => (
                          <div
                            key={a.id}
                            className="flex items-center justify-between bg-gray-50 p-2 rounded-xl"
                          >
                            <div className="text-sm">
                              #{a.id} · status:{" "}
                              <span className="font-medium">{a.status}</span>
                            </div>
                            <div className="flex gap-2">
                              <PrimaryButton
                                onClick={async () => {
                                  await api(`/applications/${a.id}/approve`, {
                                    method: "POST",
                                    token,
                                  });
                                  await showApps(g.id);
                                }}
                              >
                                승인
                              </PrimaryButton>
                              <Button
                                onClick={async () => {
                                  await api(`/applications/${a.id}/reject`, {
                                    method: "POST",
                                    token,
                                  });
                                  await showApps(g.id);
                                }}
                              >
                                거절
                              </Button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <CreateGroup token={token} onCreated={load} />
    </>
  );
}

function CreateGroup({ token, onCreated }) {
  const [form, setForm] = useState({
    title: "파이썬 알고리즘 스터디",
    desc: "백준/프로그래머스 주 2회",
    topic: "python",
    mode: "HYBRID",
    location: "Gangnam",
    days_of_week: ["MON", "WED"],
    start_time: "20:00:00",
    end_time: "22:00:00",
    need_roles: { facilitator: 1, reviewer: 1 },
    capacity: 5,
  });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErr("");
    try {
      await api("/groups", { method: "POST", token, body: form });
      onCreated?.();
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="p-4 border rounded-2xl bg-white shadow-sm grid gap-3" onSubmit={submit}>
      <div className="text-lg font-semibold">스터디 만들기</div>
      <div className="grid md:grid-cols-2 gap-3">
        <Field label="제목"><input className="w-full border rounded-xl px-3 py-2" value={form.title} onChange={(e)=>setForm({ ...form, title: e.target.value })} /></Field>
        <Field label="토픽"><input className="w-full border rounded-xl px-3 py-2" value={form.topic} onChange={(e)=>setForm({ ...form, topic: e.target.value })} /></Field>
        <Field label="모드">
          <select className="w-full border rounded-xl px-3 py-2" value={form.mode} onChange={(e)=>setForm({ ...form, mode: e.target.value })}>
            <option>ONLINE</option>
            <option>OFFLINE</option>
            <option>HYBRID</option>
          </select>
        </Field>
        <Field label="장소"><input className="w-full border rounded-xl px-3 py-2" value={form.location} onChange={(e)=>setForm({ ...form, location: e.target.value })} /></Field>
        <Field label="요일(쉼표)"><input className="w-full border rounded-xl px-3 py-2" value={form.days_of_week.join(", ")} onChange={(e)=>setForm({ ...form, days_of_week: e.target.value.split(",").map(s=>s.trim()).filter(Boolean) })} /></Field>
        <Field label="시작 시간"><input className="w-full border rounded-xl px-3 py-2" value={form.start_time} onChange={(e)=>setForm({ ...form, start_time: e.target.value })} placeholder="20:00 또는 20:00:00"/></Field>
        <Field label="종료 시간"><input className="w-full border rounded-xl px-3 py-2" value={form.end_time} onChange={(e)=>setForm({ ...form, end_time: e.target.value })} placeholder="22:00 또는 22:00:00"/></Field>
      </div>
      <Field label="설명"><textarea className="w-full border rounded-xl px-3 py-2" rows={3} value={form.desc} onChange={(e)=>setForm({ ...form, desc: e.target.value })} /></Field>
      <div className="flex items-center gap-3">
        <PrimaryButton disabled={loading}>{loading ? "생성 중..." : "생성"}</PrimaryButton>
        {err && <div className="text-sm text-red-600">{err}</div>}
      </div>
    </form>
  );
}

function Match({ token }) {
  const [items, setItems] = useState([]);
  const [err, setErr] = useState("");
  const load = async () => {
    setErr("");
    try {
      const data = await api("/match/recommendations", { token });
      setItems(data);
    } catch (e) {
      setErr(e.message);
    }
  };
  useEffect(() => { load(); }, []);

  return (
    <div className="grid gap-4">
      <div className="text-xl font-semibold">추천 스터디</div>
      {err && <div className="text-sm text-red-600">{err}</div>}
      <div className="grid md:grid-cols-2 gap-4">
        {items.map((it) => (
          <div key={it.group_id} className="p-4 border rounded-2xl bg-white shadow-sm">
            <div className="text-sm text-gray-600">Group #{it.group_id}</div>
            <div className="text-lg font-semibold">Score: {it.score}</div>
            <pre className="text-xs text-gray-600 mt-2 bg-gray-50 p-2 rounded-xl">{JSON.stringify(it.reason, null, 2)}</pre>
          </div>
        ))}
      </div>
      <Button onClick={load}>새로고침</Button>
    </div>
  );
}

export default function App() {
  const { token, setToken } = useToken();
  const [tab, setTab] = useState("home");

  const authed = !!token;

  const onLogout = () => {
    setToken("");
    setTab("home");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto p-6">
        <Nav tab={tab} setTab={setTab} authed={authed} onLogout={onLogout} />
        {!authed ? (
          <div className="grid md:grid-cols-2 gap-6 items-start">
            <div className="p-6 bg-white rounded-2xl shadow border">
              <Home token={token} />
            </div>
            <AuthPanel setToken={setToken} />
          </div>
        ) : (
          <div className="p-6 bg-white rounded-2xl shadow border">
            {tab === "home" && <Home token={token} />}
            {tab === "profile" && <Profile token={token} />}
            {tab === "groups" && <Groups token={token} />}
            {tab === "match" && <Match token={token} />}
          </div>
        )}
      </div>
    </div>
  );
}
