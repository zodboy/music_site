/**
 * 多源搜索路由
 *   GET /api/search?kw=xxx&sources=netease,qq,kugou
 */
import { Router, type Request, type Response } from "express";
import { multiSearch, providers } from "../lib/providers/index.js";
import type { Provider } from "../lib/types.js";

const router = Router();

router.get("/", async (req: Request, res: Response) => {
  const kw = String(req.query.kw || "").trim();
  if (!kw) {
    res.status(400).json({ success: false, error: "kw 必填" });
    return;
  }
  const sourceList = String(req.query.sources || "netease,qq,kugou").split(",") as Provider[];
  const valid = sourceList.filter((s) => providers[s as Provider]);
  if (valid.length === 0) {
    res.status(400).json({ success: false, error: "无效的 sources" });
    return;
  }
  try {
    const r = await multiSearch(kw, valid);
    res.json({ success: true, data: r });
  } catch (e) {
    res.status(500).json({ success: false, error: (e as Error).message });
  }
});

export default router;
