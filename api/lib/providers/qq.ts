/**
 * QQ 音乐 Provider 适配器
 * 依赖 jsososo/QQMusicApi 部署在本地（默认 http://localhost:3300）
 * 部署文档：https://github.com/jsososo/QQMusicApi
 *
 * 环境变量：
 *   QQ_API=http://localhost:3300  QQMusicApi 实例地址
 */
import { httpGet } from "../http.js";
import type { ProviderAdapter, RemoteTrack } from "../types.js";

const BASE = process.env.QQ_API || "http://localhost:3300";

export const qqProvider: ProviderAdapter = {
  async search(keyword, page = 1) {
    const url = `${BASE}/search?key=${encodeURIComponent(keyword)}&p=${page}&n=30`;
    const data = await httpGet(url);
    const list = data?.data?.list ?? [];
    const total = data?.data?.total_song_num ?? 0;
    const tracks: RemoteTrack[] = list.map((s: any) => ({
      provider: "qq",
      providerId: s.songmid,
      name: s.songname || "",
      artist: (s.singer || []).map((a: any) => a.name).join(" / "),
      album: s.albumname || "",
      cover: s.albummid ? `https://y.gtimg.cn/music/photo_new/T002R300x300M000${s.albummid}.jpg` : undefined,
      durationMs: (s.interval || 0) * 1000,
    }));
    return { tracks, total };
  },

  async getDetail(trackId) {
    const url = `${BASE}/song?songmid=${trackId}`;
    const data = await httpGet(url);
    const s = data?.data?.[0] || data?.data?.info;
    if (!s) return null;
    return {
      provider: "qq",
      providerId: s.songmid || trackId,
      name: s.songname || "",
      artist: (s.singer || []).map((a: any) => a.name).join(" / "),
      album: s.albumname || "",
      cover: s.albummid ? `https://y.gtimg.cn/music/photo_new/T002R300x300M000${s.albummid}.jpg` : undefined,
      durationMs: (s.interval || 0) * 1000,
    };
  },

  async getUrl(trackId) {
    // QQ 音乐的 VKey 接口
    const url = `${BASE}/song/url?songmid=${trackId}&type=128`;
    const data = await httpGet(url);
    const d = data?.data?.[0];
    return d?.url || null;
  },

  async getLyric(trackId) {
    const url = `${BASE}/lyric?songmid=${trackId}`;
    const data = await httpGet(url);
    return data?.data?.lyric || null;
  },

  async parsePlaylist(input) {
    // 支持：https://y.qq.com/n/ryqq/playlist/1234567 或纯数字 id
    let pid = input.trim();
    const m = pid.match(/playlist\/([A-Za-z0-9]+)/);
    if (m) pid = m[1];
    if (!pid) return null;

    const url = `${BASE}/playlist?id=${pid}`;
    const data = await httpGet(url);
    const pl = data?.data;
    if (!pl) return null;
    return {
      provider: "qq",
      providerPlaylistId: pid,
      name: pl.title || "未命名歌单",
      description: pl.desc || undefined,
      cover: pl.picurl || undefined,
      creator: pl.creator?.name,
      trackCount: pl.total_song_num,
    };
  },

  async fetchPlaylistTracks(playlistId) {
    const url = `${BASE}/playlist/songs?id=${playlistId}`;
    const data = await httpGet(url);
    const list = data?.data?.list ?? [];
    return list.map((s: any) => ({
      provider: "qq" as const,
      providerId: s.songmid,
      name: s.songname || "",
      artist: (s.singer || []).map((a: any) => a.name).join(" / "),
      album: s.albumname || "",
      cover: s.albummid ? `https://y.gtimg.cn/music/photo_new/T002R300x300M000${s.albummid}.jpg` : undefined,
      durationMs: (s.interval || 0) * 1000,
    }));
  },
};
