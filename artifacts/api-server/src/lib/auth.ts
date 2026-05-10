import { Request, Response, NextFunction } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { createHash, createHmac, timingSafeEqual } from "crypto";

export function hashPassword(password: string): string {
  return createHash("sha256").update(password + "whatsbiz_salt").digest("hex");
}

export function generateToken(userId: string): string {
  const signature = createHmac("sha256", process.env.AUTH_SECRET ?? "whatsbiz_dev_secret")
    .update(userId)
    .digest("base64url");
  return `${Buffer.from(userId, "utf8").toString("base64url")}.${signature}`;
}

const tokenStore = new Map<string, string>();
const revokedTokens = new Set<string>();

export function storeToken(token: string, userId: string) {
  tokenStore.set(token, userId);
}

export function getUserIdFromToken(token: string): string | undefined {
  if (revokedTokens.has(token)) return undefined;

  const storedUserId = tokenStore.get(token);
  if (storedUserId) return storedUserId;

  const [encodedUserId, signature] = token.split(".");
  if (!encodedUserId || !signature) return undefined;

  try {
    const userId = Buffer.from(encodedUserId, "base64url").toString("utf8");
    const expectedSignature = createHmac("sha256", process.env.AUTH_SECRET ?? "whatsbiz_dev_secret")
      .update(userId)
      .digest("base64url");
    const actual = Buffer.from(signature);
    const expected = Buffer.from(expectedSignature);
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return undefined;
    return userId;
  } catch {
    return undefined;
  }
}

export function removeToken(token: string) {
  tokenStore.delete(token);
  revokedTokens.add(token);
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
