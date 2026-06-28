/**
 * 酷狗音乐 Provider 适配器
 * 直接调用酷狗公开 API（无需自己部署后端）
 * 接口参考：https://github.com/MakcRe/KuGouMusicApi
 */
import { httpGet } from "../http.js";
import type { ProviderAdapter, RemoteTrack } from "../types.js";

const KG_API = "http://mobilecdn.kugou.com/api/v3";
const KG_SEARCH = "http://msearchcdn.kugou.com/api/v3/search/song";
const KG_LYRIC = "https://wwwapi.kugou.com/yy/index.php";

export const kugouProvider: ProviderAdapter = {
  async search(keyword, page = 1) {
    const url = `${KG_SEARCH}?keyword=${encodeURIComponent(keyword)}&page=${page}&pagesize=30&showtype=10&version=9108`;
    const data = await httpGet(url);
    const list = data?.data?.info ?? [];
    const total = data?.data?.total ?? 0;
    const tracks: RemoteTrack[] = list.map((s: any) => ({
      provider: "kugou",
      providerId: s.hash,
      name: s.songname || "",
      artist: s.singername || "",
      album: s.album_name || "",
      cover: s.album_id ? `https://imge.kugou.com/stdmusic/150/${s.album_id}.jpg` : undefined,
      durationMs: (s.duration || 0) * 1000,
    }));
    return { tracks, total };
  },

  async getDetail(trackId) {
    const url = `${KG_API}/song/info?hash=${trackId}`;
    const data = await httpGet(url);
    const s = data?.data;
    if (!s) return null;
    return {
      provider: "kugou",
      providerId: trackId,
      name: s.song_name || "",
      artist: s.singername || "",
      album: s.album_name || "",
      cover: s.img || undefined,
      durationMs: (s.timelength || 0) * 1000,
    };
  },

  async getUrl(trackId) {
    // 酷狗需要 hash + album_id 才能拿到 url，先用 hash 试
    const url = `${KG_API}/song/url?hash=${trackId}&br=320`;
    const data = await httpGet(url);
    const d = data?.data?.items?.[0];
    return d?.url || null;
  },

  async getLyric(trackId) {
    const url = `${KG_LYRIC}?r=play/getdata&hash=${trackId}`;
    const data = await httpGet(url);
    return data?.data?.lyrics || data?.data?.lyric || null;
  },

  async parsePlaylist(input) {
    // 酷狗 specialid：纯数字或 https://www.kugou.com/yy/special/single/1234567.html
    let pid = input.trim();
    const m = pid.match(/(\d+)/);
    if (m) pid = m[1];
    if (!/^\d+$/.test(pid)) return null;

    const url = `${KG_API}/special/info?specialid=${pid}`;
    const data = await httpGet(url);
    const pl = data?.data;
    if (!pl) return null;
    return {
      provider: "kugou",
      providerPlaylistId: pid,
      name: pl.specialname || "未命名歌单",
      cover: pl.imgurl?.replace("/{size}", "/150") || undefined,
      creator: pl.nickname,
      trackCount: pl.songcount,
    };
  },

  async fetchPlaylistTracks(playlistId) {
    const url = `${KG_API}/special/song?specialid=${playlistId}&page=1&pagesize=1000`;
    const data = await httpGet(url);
    const list = data?.data?.info ?? [];
    return list.map((s: any) => ({
      provider: "kugou" as const,
      providerId: s.hash,
      name: s.songname || "",
      artist: s.singername || "",
      album: s.album_name || "",
      cover: s.album_id ? `https://imge.kugou.com/stdmusic/150/${s.album_id}.jpg` : undefined,
      durationMs: (s.duration || 0) * 1000,
    }));
  },
};
