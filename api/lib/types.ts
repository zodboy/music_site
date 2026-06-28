/**
 * 多源音乐 API 统一类型定义
 * 所有 provider 返回的 Track 都映射成统一格式
 */
export type Provider = "netease" | "qq" | "kugou";

export interface RemoteTrack {
  provider: Provider;
  providerId: string;
  name: string;
  artist: string;
  album: string;
  cover?: string;
  durationMs: number;
  url?: string;
  lyric?: string;
}

export interface RemotePlaylist {
  provider: Provider;
  providerPlaylistId: string;
  name: string;
  description?: string;
  cover?: string;
  creator?: string;
  trackCount?: number;
  tracks?: RemoteTrack[];
}

export interface ProviderAdapter {
  /** 搜索歌曲 */
  search(keyword: string, page?: number): Promise<{ tracks: RemoteTrack[]; total: number }>;
  /** 获取歌曲详情（含歌词） */
  getDetail(trackId: string): Promise<RemoteTrack | null>;
  /** 获取可播放 URL（短期有效） */
  getUrl(trackId: string): Promise<string | null>;
  /** 获取歌词 */
  getLyric(trackId: string): Promise<string | null>;
  /** 解析歌单（网易云链接 / QQ 链接 / 酷狗链接） */
  parsePlaylist(input: string): Promise<RemotePlaylist | null>;
  /** 拉取歌单内全部歌曲 */
  fetchPlaylistTracks(playlistId: string): Promise<RemoteTrack[]>;
}
