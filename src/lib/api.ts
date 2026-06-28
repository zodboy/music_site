import type { Playlist, RemoteTrack, User } from "./types";

const TOKEN_KEY = "music_token";
const USER_KEY = "music_user";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setAuth(token: string, user: User) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getStoredUser(): User | null {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY) || "null");
  } catch {
    return null;
  }
}

// In Tauri desktop build, set VITE_API_BASE to absolute URL of deployed API.
// In web build (same-origin), keep relative "/api".
const API_BASE = (import.meta.env.VITE_API_BASE as string) || "/api";

async function req(path: string, init?: RequestInit) {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init?.headers as Record<string, string>),
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${path}`, { ...init, headers });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error(body.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  // 鉴权
  register: (username: string, password: string) =>
    req("/auth/register", { method: "POST", body: JSON.stringify({ username, password }) }),
  login: (username: string, password: string) =>
    req("/auth/login", { method: "POST", body: JSON.stringify({ username, password }) }),
  me: () => req("/auth/me"),

  // 搜索（多源）
  search: (kw: string, sources = "netease,qq,kugou") =>
    req(`/search?kw=${encodeURIComponent(kw)}&sources=${sources}`),

  // 曲目 URL（带缓存）
  trackUrl: (provider: string, id: string) =>
    req(`/track/url?provider=${provider}&id=${encodeURIComponent(id)}`),
  trackLyric: (provider: string, id: string) =>
    req(`/track/lyric?provider=${provider}&id=${encodeURIComponent(id)}`),

  // 歌单 CRUD
  playlists: () => req("/playlists"),
  createPlaylist: (name: string, description?: string, cover?: string) =>
    req("/playlists", { method: "POST", body: JSON.stringify({ name, description, cover }) }),
  playlistDetail: (id: number) => req(`/playlists/${id}`),
  updatePlaylist: (id: number, data: { name?: string; description?: string; cover?: string }) =>
    req(`/playlists/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deletePlaylist: (id: number) => req(`/playlists/${id}`, { method: "DELETE" }),
  addTrackToPlaylist: (id: number, track: RemoteTrack) =>
    req(`/playlists/${id}/tracks`, { method: "POST", body: JSON.stringify({ track }) }),
  removeTrackFromPlaylist: (id: number, trackId: number) =>
    req(`/playlists/${id}/tracks/${trackId}`, { method: "DELETE" }),

  // 收藏
  favorites: () => req("/favorite"),
  favorite: (provider: string, id: string, track: RemoteTrack) =>
    req(`/favorite/${provider}/${encodeURIComponent(id)}`, { method: "POST", body: JSON.stringify({ track }) }),
  unfavorite: (provider: string, id: string) =>
    req(`/favorite/${provider}/${encodeURIComponent(id)}`, { method: "DELETE" }),

  // 播放历史
  history: () => req("/history"),
  reportHistory: (track: RemoteTrack & { progressMs?: number }) =>
    req("/history", { method: "POST", body: JSON.stringify({ track }) }),

  // 网易云/QQ/酷狗 歌单导入
  parseImport: (input: string) =>
    req("/import/parse", { method: "POST", body: JSON.stringify({ input }) }),
  runImport: (input: string, name?: string, description?: string, cover?: string) =>
    req("/import/run", { method: "POST", body: JSON.stringify({ input, name, description, cover }) }),
  importLogs: () => req("/import/logs"),
};

export type Api = typeof api;
export type PlaylistListResult = Playlist[];
