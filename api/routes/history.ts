/**
 * 播放历史路由
 *   POST /api/history    上报播放记录
 *   GET  /api/history    最近播放（同曲目去重）
 */
import { Router, type Request, type Response } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth, type AuthPayload } from "../lib/auth.js";

const router = Router();
router.use(requireAuth);

async function upsertTrack(provider: string, providerId: string, t: any) {
  return prisma.track.upsert({
    where: { provider_providerId: { provider, providerId } },
    update: {
      name: t.name,
      artist: t.artist || "",
      album: t.album || "",
      cover: t.cover || null,
      durationMs: t.durationMs || 0,
    },
    create: {
      provider,
      providerId,
      name: t.name,
      artist: t.artist || "",
      album: t.album || "",
      cover: t.cover || null,
      durationMs: t.durationMs || 0,
    },
  });
}

router.post("/", async (req: Request & { auth?: AuthPayload }, res: Response) => {
  const { provider, providerId, name, artist, album, cover, durationMs, progressMs } = req.body?.track || {};
  if (!provider || !providerId) {
    res.status(400).json({ success: false, error: "provider / providerId 必填" });
    return;
  }
  const track = await upsertTrack(provider, providerId, { name, artist, album, cover, durationMs });
  const h = await prisma.playHistory.create({
    data: {
      userId: req.auth!.uid,
      trackId: track.id,
      progressMs: progressMs || 0,
    },
  });
  res.json({ success: true, data: h });
});

router.get("/", async (req: Request & { auth?: AuthPayload }, res: Response) => {
  const list = await prisma.playHistory.findMany({
    where: { userId: req.auth!.uid },
    include: { track: true },
    orderBy: { playedAt: "desc" },
    take: 100,
  });
  const seen = new Set<number>();
  const dedup = list.filter((h) => {
    if (seen.has(h.trackId)) return false;
    seen.add(h.trackId);
    return true;
  });
  res.json({ success: true, data: dedup });
});

export default router;
