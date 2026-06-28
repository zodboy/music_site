/**
 * 歌单 CRUD 路由
 *   GET    /api/playlists                 我的歌单列表
 *   POST   /api/playlists                  创建歌单
 *   GET    /api/playlists/:id              歌单详情（含曲目）
 *   PUT    /api/playlists/:id              更新歌单元信息
 *   DELETE /api/playlists/:id              删除歌单
 *   POST   /api/playlists/:id/tracks       添加曲目
 *   DELETE /api/playlists/:id/tracks/:tid  移除曲目
 *   PUT    /api/playlists/:id/reorder       重排曲目
 */
import { Router, type Request, type Response } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth, type AuthPayload } from "../lib/auth.js";

const router = Router();
router.use(requireAuth);

router.get("/", async (req: Request & { auth?: AuthPayload }, res: Response) => {
  const lists = await prisma.playlist.findMany({
    where: { userId: req.auth!.uid },
    include: { _count: { select: { tracks: true } } },
    orderBy: { updatedAt: "desc" },
  });
  res.json({ success: true, data: lists });
});

router.post("/", async (req: Request & { auth?: AuthPayload }, res: Response) => {
  const { name, description, cover } = req.body || {};
  if (!name) {
    res.status(400).json({ success: false, error: "歌单名必填" });
    return;
  }
  const pl = await prisma.playlist.create({
    data: {
      userId: req.auth!.uid,
      name,
      description: description || null,
      cover: cover || null,
      source: "custom",
    },
  });
  res.json({ success: true, data: pl });
});

router.get("/:id", async (req: Request & { auth?: AuthPayload }, res: Response) => {
  const id = Number(req.params.id);
  const pl = await prisma.playlist.findFirst({
    where: { id, userId: req.auth!.uid },
    include: {
      tracks: {
        orderBy: { sort: "asc" },
        include: { track: true },
      },
    },
  });
  if (!pl) {
    res.status(404).json({ success: false, error: "歌单不存在" });
    return;
  }
  res.json({ success: true, data: pl });
});

router.put("/:id", async (req: Request & { auth?: AuthPayload }, res: Response) => {
  const id = Number(req.params.id);
  const { name, description, cover } = req.body || {};
  const pl = await prisma.playlist.findFirst({ where: { id, userId: req.auth!.uid } });
  if (!pl) {
    res.status(404).json({ success: false, error: "歌单不存在" });
    return;
  }
  const updated = await prisma.playlist.update({
    where: { id },
    data: { name, description, cover },
  });
  res.json({ success: true, data: updated });
});

router.delete("/:id", async (req: Request & { auth?: AuthPayload }, res: Response) => {
  const id = Number(req.params.id);
  const pl = await prisma.playlist.findFirst({ where: { id, userId: req.auth!.uid } });
  if (!pl) {
    res.status(404).json({ success: false, error: "歌单不存在" });
    return;
  }
  await prisma.playlist.delete({ where: { id } });
  res.json({ success: true });
});

/** 添加曲目到歌单（如果是新曲目，先 upsert 到 Track 表） */
router.post("/:id/tracks", async (req: Request & { auth?: AuthPayload }, res: Response) => {
  const id = Number(req.params.id);
  const pl = await prisma.playlist.findFirst({ where: { id, userId: req.auth!.uid } });
  if (!pl) {
    res.status(404).json({ success: false, error: "歌单不存在" });
    return;
  }
  const t: {
    provider: string;
    providerId: string;
    name: string;
    artist?: string;
    album?: string;
    cover?: string;
    durationMs?: number;
  } = req.body?.track;
  if (!t || !t.provider || !t.providerId) {
    res.status(400).json({ success: false, error: "track 必填" });
    return;
  }
  const track = await prisma.track.upsert({
    where: { provider_providerId: { provider: t.provider, providerId: t.providerId } },
    update: {
      name: t.name,
      artist: t.artist || "",
      album: t.album || "",
      cover: t.cover || null,
      durationMs: t.durationMs || 0,
    },
    create: {
      provider: t.provider,
      providerId: t.providerId,
      name: t.name,
      artist: t.artist || "",
      album: t.album || "",
      cover: t.cover || null,
      durationMs: t.durationMs || 0,
    },
  });
  const maxSort = await prisma.playlistTrack.aggregate({
    where: { playlistId: id },
    _max: { sort: true },
  });
  const pt = await prisma.playlistTrack.upsert({
    where: { playlistId_trackId: { playlistId: id, trackId: track.id } },
    update: {},
    create: { playlistId: id, trackId: track.id, sort: (maxSort._max.sort || 0) + 1 },
  });
  res.json({ success: true, data: pt });
});

router.delete("/:id/tracks/:tid", async (req: Request & { auth?: AuthPayload }, res: Response) => {
  const id = Number(req.params.id);
  const tid = Number(req.params.tid);
  await prisma.playlistTrack.deleteMany({ where: { playlistId: id, trackId: tid } });
  res.json({ success: true });
});

export default router;
