export const api = async (path, { method="GET", token, body }={}) => {
  // ✅ 직접 localhost:8000 쓰지 말고
  const base = "/api";   // 프록시를 통해 우회
  const url = path.startsWith("/") ? base + path : `${base}/${path}`;
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(url, { method, headers, body: body ? JSON.stringify(body) : undefined });
  if (res.status === 204) return null;
  let data = null;
  try { data = await res.json(); } catch { throw new Error(`Invalid JSON from ${url} (${res.status})`); }
  if (!res.ok) throw new Error(data?.detail || res.statusText || `HTTP ${res.status}`);
  return data;
};
