import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { NextFunction, Request, Response } from "express";

const JWT_SECRET = process.env.JWT_SECRET || "music_site_dev_secret_change_in_prod";
const JWT_EXPIRES = "30d";

export function hashPassword(p: string): string {
  return bcrypt.hashSync(p, 10);
}

export function verifyPassword(p: string, hash: string): boolean {
  return bcrypt.compareSync(p, hash);
}

export function signToken(userId: number, role: string): string {
  return jwt.sign({ uid: userId, role }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
}

export interface AuthPayload {
  uid: number;
  role: string;
}

export function verifyToken(token: string): AuthPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthPayload;
  } catch {
    return null;
  }
}

/** 从请求头取 Bearer token 解析用户身份，未携带或失效返回 null */
export function getAuth(req: Request): AuthPayload | null {
  const h = req.headers.authorization;
  if (!h || !h.startsWith("Bearer ")) return null;
  return verifyToken(h.slice(7));
}

/** 必须登录的中间件 */
export function requireAuth(req: Request & { auth?: AuthPayload }, res: Response, next: NextFunction) {
  const a = getAuth(req);
  if (!a) {
    res.status(401).json({ success: false, error: "请先登录" });
    return;
  }
  req.auth = a;
  next();
}

/** 必须管理员的中间件 */
export function requireAdmin(req: Request & { auth?: AuthPayload }, res: Response, next: NextFunction) {
  const a = getAuth(req);
  if (!a || a.role !== "admin") {
    res.status(403).json({ success: false, error: "需要管理员权限" });
    return;
  }
  req.auth = a;
  next();
}
