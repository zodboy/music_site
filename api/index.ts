/**
 * Express 入口
 * - 路由挂载
 * - 静态文件服务（dist）
 * - SPA fallback
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./routes/auth.js";
import playlistsRoutes from "./routes/playlists.js";
import searchRoutes from "./routes/search.js";
import trackRoutes from "./routes/track.js";
import importRoutes from "./routes/import.js";
import favoriteRoutes from "./routes/favorite.js";
import historyRoutes from "./routes/history.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT || 3100);

app.use(cors());
app.use(express.json({ limit: "5mb" }));

// 健康检查
app.get("/api/health", (_req, res) => {
  res.json({ success: true, data: { ok: true, ts: Date.now() } });
});

// API 路由
app.use("/api/auth", authRoutes);
app.use("/api/playlists", playlistsRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/track", trackRoutes);
app.use("/api/import", importRoutes);
app.use("/api/favorite", favoriteRoutes);
app.use("/api/history", historyRoutes);

// 静态文件
const distDir = path.resolve(__dirname, "../dist");
app.use(express.static(distDir));

// SPA fallback：所有非 /api 路径返回 index.html
app.get(/^\/(?!api).*/, (_req, res) => {
  res.sendFile(path.join(distDir, "index.html"));
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`[music_site] listening on http://0.0.0.0:${PORT}`);
});
