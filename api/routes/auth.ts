/**
 * 用户鉴权路由
 *   POST /api/auth/register   注册
 *   POST /api/auth/login      登录
 *   GET  /api/auth/me          当前用户信息
 */
import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { hashPassword, verifyPassword, signToken, requireAuth } from "../lib/auth.js";

const router = Router();

const registerSchema = z.object({
  username: z.string().min(3).max(20),
  password: z.string().min(6).max(64),
});

router.post("/register", async (req: Request, res: Response) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, error: parsed.error.issues[0]?.message });
    return;
  }
  const { username, password } = parsed.data;
  const exist = await prisma.user.findUnique({ where: { username } });
  if (exist) {
    res.status(409).json({ success: false, error: "用户名已存在" });
    return;
  }
  // 第一个用户自动设为管理员
  const count = await prisma.user.count();
  const role = count === 0 ? "admin" : "user";
  const user = await prisma.user.create({
    data: { username, passwordHash: hashPassword(password), role },
  });
  const token = signToken(user.id, user.role);
  res.json({
    success: true,
    data: { token, user: { id: user.id, username: user.username, role: user.role } },
  });
});

router.post("/login", async (req: Request, res: Response) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, error: parsed.error.issues[0]?.message });
    return;
  }
  const { username, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { username } });
  if (!user || !verifyPassword(password, user.passwordHash)) {
    res.status(401).json({ success: false, error: "用户名或密码错误" });
    return;
  }
  const token = signToken(user.id, user.role);
  res.json({
    success: true,
    data: { token, user: { id: user.id, username: user.username, role: user.role } },
  });
});

router.get("/me", requireAuth, async (req: Request & { auth?: { uid: number; role: string } }, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.auth!.uid },
    select: { id: true, username: true, role: true, createdAt: true },
  });
  if (!user) {
    res.status(404).json({ success: false, error: "用户不存在" });
    return;
  }
  res.json({ success: true, data: user });
});

export default router;
