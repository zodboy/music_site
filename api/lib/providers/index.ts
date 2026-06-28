/**
 * 多源音乐 Provider 注册中心
 * 统一对外暴露：search / getDetail / getUrl / getLyric / parsePlaylist / fetchPlaylistTracks
 * 调用时根据 provider 字段路由到对应适配器
 */
import type { Provider, ProviderAdapter, RemoteTrack } from "../types.js";
import { neteaseProvider } from "./netease.js";
import { qqProvider } from "./qq.js";
import { kugouProvider } from "./kugou.js";

export const providers: Record<Provider, ProviderAdapter> = {
  netease: neteaseProvider,
  qq: qqProvider,
  kugou: kugouProvider,
};

/** 从输入字符串智能识别 provider（先看 URL 特征，再回退） */
export function detectProvider(input: string): Provider | null {
  const s = input.toLowerCase();
  if (s.includes("music.163.com") || s.includes("163cn")) return "netease";
  if (s.includes("y.qq.com") || s.includes("qq.com")) return "qq";
  if (s.includes("kugou.com") || s.includes("kugou")) return "kugou";
  return null;
}

/** 多源并发搜索，合并去重，按 provider 分组返回 */
export async function multiSearch(
  keyword: string,
  sources: Provider[] = ["netease", "qq", "kugou"],
): Promise<{ bySource: Record<Provider, RemoteTrack[]>; total: number }> {
  const results = await Promise.allSettled(
    sources.map(async (p) => {
      const r = await providers[p].search(keyword, 1);
      return { provider: p, tracks: r.tracks };
    }),
  );
  const bySource: Record<Provider, RemoteTrack[]> = { netease: [], qq: [], kugou: [] };
  let total = 0;
  for (const r of results) {
    if (r.status === "fulfilled") {
      bySource[r.value.provider] = r.value.tracks;
      total += r.value.tracks.length;
    }
  }
  return { bySource, total };
}
