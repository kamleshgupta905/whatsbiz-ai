import { Router } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { createHash } from "crypto";

const router = Router();

const TEMP_ADMIN_TOKEN = "wb-admin-2026-tmp-k9x2m";

function hashPassword(password: string): string {
  return createHash("sha256").update(password + "whatsbiz_salt").digest("hex");
}

router.post("/admin/set-password", async (req, res) => {
  const adminSecret = req.headers["x-admin-secret"];

  if (!adminSecret || adminSecret !== TEMP_ADMIN_TOKEN) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const { email, password } = req.body as { email?: string; password?: string };
  if (!email || !password) {
    res.status(400).json({ error: "email and password required" });
    return;
  }

  const [user] = await db.update(usersTable)
    .set({ passwordHash: hashPassword(password), updatedAt: new Date() })
    .where(eq(usersTable.email, email))
    .returning();

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json({ success: true, email: user.email });
});

export default router;
