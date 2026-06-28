/**
 * 收藏路由
 *   POST   /api/favorite/:provider/:id   收藏曲目
 *   DELETE /api/favorite/:provider/:id   取消收藏
 *   GET    /api/favorite                  我的收藏
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

router.post("/:provider/:id", async (req: Request & { auth?: AuthPayload }, res: Response) => {
  const { provider, id } = req.params;
  const track = await upsertTrack(provider, id, req.body?.track || { name: req.body?.name || "未知" });
  const fav = await prisma.favorite.upsert({
    where: { userId_trackId: { userId: req.auth!.uid, trackId: track.id } },
    update: {},
    create: { userId: req.auth!.uid, trackId: track.id },
  });
  res.json({ success: true, data: fav });
});

router.delete("/:provider/:id", async (req: Request & { auth?: AuthPayload }, res: Response) => {
  const { provider, id } = req.params;
  const track = await prisma.track.findUnique({
    where: { provider_providerId: { provider, providerId: id } },
  });
  if (track) {
    await prisma.favorite.deleteMany({
      where: { userId: req.auth!.uid, trackId: track.id },
    });
  }
  res.json({ success: true });
});

router.get("/", async (req: Request & { auth?: AuthPayload }, res: Response) => {
  const list = await prisma.favorite.findMany({
    where: { userId: req.auth!.uid },
    include: { track: true },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  res.json({ success: true, data: list });
});

export default router;
