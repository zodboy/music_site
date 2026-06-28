/**
 * 曲目信息 + 播放 URL + 歌词 路由
 *   GET /api/track/url?provider=netease&id=xxx        获取播放 URL（带本地缓存 + 过期刷新）
 *   GET /api/track/lyric?provider=netease&id=xxx      获取歌词
 *   GET /api/track/detail?provider=netease&id=xxx     获取歌曲详情
 */
import { Router, type Request, type Response } from "express";
import { prisma } from "../lib/prisma.js";
import { providers } from "../lib/providers/index.js";
import type { Provider } from "../lib/types.js";

const router = Router();

const URL_CACHE_TTL = 30 * 60 * 1000; // 30 分钟
const LYRIC_CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 天

router.get("/url", async (req: Request, res: Response) => {
  const provider = String(req.query.provider) as Provider;
  const id = String(req.query.id || "");
  if (!providers[provider] || !id) {
    res.status(400).json({ success: false, error: "provider / id 必填" });
    return;
  }
  try {
    // 先查 DB 缓存
    const track = await prisma.track.findUnique({
      where: { provider_providerId: { provider, providerId: id } },
    });
    const now = new Date();
    if (track?.urlCache && track.urlExpireAt && track.urlExpireAt > now) {
      res.json({ success: true, data: { url: track.urlCache, cached: true } });
      return;
    }
    // 调用 provider 获取新 URL
    const url = await providers[provider].getUrl(id);
    if (!url) {
      res.status(404).json({ success: false, error: "暂无可用播放地址（可能 VIP / 下架 / Cookie 失效）" });
      return;
    }
    // 写回缓存
    if (track) {
      await prisma.track.update({
        where: { id: track.id },
        data: { urlCache: url, urlExpireAt: new Date(now.getTime() + URL_CACHE_TTL) },
      });
    }
    res.json({ success: true, data: { url, cached: false } });
  } catch (e) {
    res.status(500).json({ success: false, error: (e as Error).message });
  }
});

router.get("/lyric", async (req: Request, res: Response) => {
  const provider = String(req.query.provider) as Provider;
  const id = String(req.query.id || "");
  if (!providers[provider] || !id) {
    res.status(400).json({ success: false, error: "provider / id 必填" });
    return;
  }
  try {
    const track = await prisma.track.findUnique({
      where: { provider_providerId: { provider, providerId: id } },
    });
    const now = new Date();
    if (track?.lyricCache && track.updatedAt && now.getTime() - track.updatedAt.getTime() < LYRIC_CACHE_TTL) {
      res.json({ success: true, data: { lyric: track.lyricCache, cached: true } });
      return;
    }
    const lyric = await providers[provider].getLyric(id);
    if (track && lyric) {
      await prisma.track.update({
        where: { id: track.id },
        data: { lyricCache: lyric },
      });
    }
    res.json({ success: true, data: { lyric: lyric || "", cached: false } });
  } catch (e) {
    res.status(500).json({ success: false, error: (e as Error).message });
  }
});

router.get("/detail", async (req: Request, res: Response) => {
  const provider = String(req.query.provider) as Provider;
  const id = String(req.query.id || "");
  if (!providers[provider] || !id) {
    res.status(400).json({ success: false, error: "provider / id 必填" });
    return;
  }
  try {
    const r = await providers[provider].getDetail(id);
    if (!r) {
      res.status(404).json({ success: false, error: "曲目不存在" });
      return;
    }
    res.json({ success: true, data: r });
  } catch (e) {
    res.status(500).json({ success: false, error: (e as Error).message });
  }
});

export default router;
