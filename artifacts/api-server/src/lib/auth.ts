import { Request, Response, NextFunction } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { createHash } from "crypto";

export function hashPassword(password: string): string {
  return createHash("sha256").update(password + "whatsbiz_salt").digest("hex");
}

export function generateToken(userId: string): string {
  return createHash("sha256").update(userId + Date.now() + "whatsbiz_secret").digest("hex");
}

const tokenStore = new Map<string, string>();

export function storeToken(token: string, userId: string) {
  tokenStore.set(token, userId);
}

export function getUserIdFromToken(token: string): string | undefined {
  return tokenStore.get(token);
}

export function removeToken(token: string) {
  tokenStore.delete(token);
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const auth = req.headers.authorization;
  const token = auth?.startsWith("Bearer ") ? auth.slice(7) : req.cookies?.token;

  if (!token) {
    res.status(401).json({ error: "Unauthorized", message: "No token provided" });
    return;
  }

  const userId = getUserIdFromToken(token);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized", message: "Invalid token" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user) {
    res.status(401).json({ error: "Unauthorized", message: "User not found" });
    return;
  }

  (req as Request & { user: typeof user }).user = user;
  next();
}

export type AuthRequest = Request & { user: { id: string; name: string; email: string; phone: string; businessName: string; businessType: string | null; businessSize: string | null; role: "CLIENT" | "ADMIN" | "SUPPORT"; language: string; onboardingStep: number; onboardingComplete: boolean; isVerified: boolean; isActive: boolean; createdAt: Date; updatedAt: Date } };
