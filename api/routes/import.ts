/**
 * 网易云 / QQ / 酷狗 歌单导入路由
 *   POST /api/import/parse    解析歌单链接（不导入）
 *   POST /api/import/run      执行导入（解析 + 拉曲目 + 入库 + 创建本地歌单）
 */
import { Router, type Request, type Response } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth, type AuthPayload } from "../lib/auth.js";
import { detectProvider, providers } from "../lib/providers/index.js";

const router = Router();
router.use(requireAuth);

/** 解析歌单链接 */
router.post("/parse", async (req: Request & { auth?: AuthPayload }, res: Response) => {
  const { input } = req.body || {};
  if (!input) {
    res.status(400).json({ success: false, error: "input 必填" });
    return;
  }
  const provider = detectProvider(input);
  if (!provider) {
    res.status(400).json({ success: false, error: "无法识别歌单来源（请粘贴网易云/QQ/酷狗的歌单链接）" });
    return;
  }
  try {
    const pl = await providers[provider].parsePlaylist(input);
    if (!pl) {
      res.status(404).json({ success: false, error: "歌单不存在或无权访问" });
      return;
    }
    res.json({ success: true, data: pl });
  } catch (e) {
    res.status(500).json({ success: false, error: (e as Error).message });
  }
});

/** 执行导入：解析 → 拉全部曲目 → 创建本地歌单 → upsert 曲目 → 加入歌单 */
router.post("/run", async (req: Request & { auth?: AuthPayload }, res: Response) => {
  const { input, name, description, cover } = req.body || {};
  if (!input) {
    res.status(400).json({ success: false, error: "input 必填" });
    return;
  }
  const provider = detectProvider(input);
  if (!provider) {
    res.status(400).json({ success: false, error: "无法识别歌单来源" });
    return;
  }
  let log;
  try {
    // 创建导入日志
    log = await prisma.importLog.create({
      data: {
        userId: req.auth!.uid,
        source: provider,
        sourcePlaylistId: input,
        status: "running",
      },
    });

    // 解析歌单元信息
    const remote = await providers[provider].parsePlaylist(input);
    if (!remote) throw new Error("歌单解析失败");

    // 创建本地歌单
    const playlist = await prisma.playlist.create({
      data: {
        userId: req.auth!.uid,
        name: name || remote.name || "导入的歌单",
        description: description || remote.description || `从${provider}导入 · ${remote.creator || ""}`,
        cover: cover || remote.cover || null,
        source: provider,
        sourceId: remote.providerPlaylistId,
      },
    });

    // 拉取全部曲目
    const tracks = await providers[provider].fetchPlaylistTracks(remote.providerPlaylistId);
    let added = 0;
    for (let i = 0; i < tracks.length; i++) {
      const t = tracks[i];
      const track = await prisma.track.upsert({
        where: { provider_providerId: { provider: t.provider, providerId: t.providerId } },
        update: {
          name: t.name,
          artist: t.artist,
          album: t.album,
          cover: t.cover,
          durationMs: t.durationMs,
        },
        create: {
          provider: t.provider,
          providerId: t.providerId,
          name: t.name,
          artist: t.artist,
          album: t.album,
          cover: t.cover,
          durationMs: t.durationMs,
        },
      });
      await prisma.playlistTrack.upsert({
        where: { playlistId_trackId: { playlistId: playlist.id, trackId: track.id } },
        update: {},
        create: { playlistId: playlist.id, trackId: track.id, sort: i + 1 },
      });
      added++;
    }

    await prisma.importLog.update({
      where: { id: log.id },
      data: {
        targetPlaylistId: playlist.id,
        trackCount: added,
        status: "success",
        endedAt: new Date(),
      },
    });

    res.json({
      success: true,
      data: { playlistId: playlist.id, trackCount: added, playlistName: playlist.name },
    });
  } catch (e) {
    if (log) {
      await prisma.importLog.update({
        where: { id: log.id },
        data: { status: "failed", detail: (e as Error).message, endedAt: new Date() },
      });
    }
    res.status(500).json({ success: false, error: (e as Error).message });
  }
});

/** 我的导入历史 */
router.get("/logs", async (req: Request & { auth?: AuthPayload }, res: Response) => {
  const logs = await prisma.importLog.findMany({
    where: { userId: req.auth!.uid },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  res.json({ success: true, data: logs });
});

export default router;
