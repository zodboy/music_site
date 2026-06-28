/**
 * 网易云音乐 Provider 适配器
 * 依赖 NeteaseCloudMusicApi（binaryify 版）部署在本地（默认 http://localhost:3000）
 * 部署文档：https://github.com/Binaryify/NeteaseCloudMusicApi
 *
 * 需要环境变量：
 *   NETEASE_API=http://localhost:3000  NeteaseCloudMusicApi 实例地址
 *   NETEASE_COOKIE=xxx                  可选：登录后的 Cookie（用于 VIP 歌曲/私人歌单）
 */
import { httpGet } from "../http.js";
import type { ProviderAdapter, RemotePlaylist, RemoteTrack } from "../types.js";

const BASE = process.env.NETEASE_API || "http://localhost:3000";
const COOKIE = process.env.NETEASE_COOKIE || "";

function withCookie(headers: Record<string, string> = {}): Record<string, string> {
  return COOKIE ? { Cookie: COOKIE, ...headers } : headers;
}

export const neteaseProvider: ProviderAdapter = {
  async search(keyword, page = 1) {
    const url = `${BASE}/search?keywords=${encodeURIComponent(keyword)}&limit=30&offset=${(page - 1) * 30}`;
    const data = await httpGet(url, withCookie());
    const songs = data?.result?.songs ?? [];
    const total = data?.result?.songCount ?? 0;
    const tracks: RemoteTrack[] = songs.map((s: any) => ({
      provider: "netease",
      providerId: String(s.id),
      name: s.name || "",
      artist: (s.artists || []).map((a: any) => a.name).join(" / "),
      album: s.album?.name || "",
      cover: s.album?.artist?.img1v1Url || s.album?.picUrl || undefined,
      durationMs: (s.duration || 0) as number,
    }));
    return { tracks, total };
  },

  async getDetail(trackId) {
    const url = `${BASE}/song/detail?ids=${trackId}`;
    const data = await httpGet(url, withCookie());
    const s = data?.songs?.[0];
    if (!s) return null;
    return {
      provider: "netease",
      providerId: String(s.id),
      name: s.name || "",
      artist: (s.ar || []).map((a: any) => a.name).join(" / "),
      album: s.al?.name || "",
      cover: s.al?.picUrl || undefined,
      durationMs: s.dt || 0,
    };
  },

  async getUrl(trackId) {
    // br=320000 表示 320kbps；VIP 歌曲需要 Cookie
    const url = `${BASE}/song/url?id=${trackId}&br=320000`;
    const data = await httpGet(url, withCookie());
    const d = data?.data?.[0];
    return d?.url || null;
  },

  async getLyric(trackId) {
    const url = `${BASE}/lyric?id=${trackId}`;
    const data = await httpGet(url, withCookie());
    return data?.lrc?.lyric || null;
  },

  async parsePlaylist(input) {
    // 支持的输入：
    //   1. https://music.163.com/#/playlist?id=1234567
    //   2. 1234567（纯数字）
    let pid = input.trim();
    const m = pid.match(/id=(\d+)/);
    if (m) pid = m[1];
    if (!/^\d+$/.test(pid)) return null;

    const url = `${BASE}/playlist/detail?id=${pid}`;
    const data = await httpGet(url, withCookie());
    const pl = data?.playlist;
    if (!pl) return null;
    return {
      provider: "netease",
      providerPlaylistId: pid,
      name: pl.name || "未命名歌单",
      description: pl.description || undefined,
      cover: pl.coverImgUrl || undefined,
      creator: pl.creator?.nickname,
      trackCount: pl.trackCount,
    };
  },

  async fetchPlaylistTracks(playlistId) {
    const url = `${BASE}/playlist/detail?id=${playlistId}&n=1000`;
    const data = await httpGet(url, withCookie());
    const tracks: any[] = data?.playlist?.tracks ?? [];
    return tracks.map((s: any) => ({
      provider: "netease" as const,
      providerId: String(s.id),
      name: s.name || "",
      artist: (s.ar || []).map((a: any) => a.name).join(" / "),
      album: s.al?.name || "",
      cover: s.al?.picUrl || undefined,
      durationMs: s.dt || 0,
    }));
  },
};
