// studymatch-web/src/api.js
export const api = async (path, { method = "GET", token, body } = {}) => {
  const base = import.meta.env.VITE_API_BASE || "http://localhost:8000";
  const url = path.startsWith("/") ? base + path : `${base}/${path}`;

  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  // 204 No Content 대비
  if (res.status === 204) return null;

  let data;
  try {
    data = await res.json();
  } catch {
    throw new Error(`Invalid JSON from ${url} (${res.status})`);
  }
  if (!res.ok) {
    const msg = data?.detail || res.statusText;
    throw new Error(`API ${res.status}: ${msg}`);
  }
  return data;
};
