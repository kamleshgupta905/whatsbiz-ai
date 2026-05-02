import { Router } from "express";
import { db, whatsappSessionsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { UpdateWhatsappSettingsBody } from "@workspace/api-zod";
import { requireAuth, type AuthRequest } from "../lib/auth";

const router = Router();

router.get("/whatsapp/status", requireAuth, async (req, res) => {
  const user = (req as AuthRequest).user;
  const [session] = await db.select().from(whatsappSessionsTable).where(eq(whatsappSessionsTable.userId, user.id));

  res.json({
    status: session?.status ?? "disconnected",
    phoneNumber: session?.phoneNumber ?? null,
    lastConnected: session?.lastConnected ?? null,
    isAIEnabled: session?.isAIEnabled ?? true,
    awayMessage: session?.awayMessage ?? null,
    workingHours: session?.workingHours ?? null,
  });
});

router.post("/whatsapp/connect", requireAuth, async (req, res) => {
  const user = (req as AuthRequest).user;

  // Simulate QR code generation (in real implementation this would use whatsapp-web.js)
  const qrCode = `data:image/svg+xml;base64,${Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="white"/><text x="100" y="100" text-anchor="middle" font-size="12" fill="black">Scan QR Code</text><text x="100" y="120" text-anchor="middle" font-size="10" fill="gray">WHATSBIZ-${user.id.slice(0, 8)}</text></svg>`).toString("base64")}`;

  await db.update(whatsappSessionsTable)
    .set({ status: "qr_ready", qrCode, updatedAt: new Date() })
    .where(eq(whatsappSessionsTable.userId, user.id));

  res.json({ qrCode, status: "qr_ready" });
});

router.post("/whatsapp/disconnect", requireAuth, async (req, res) => {
  const user = (req as AuthRequest).user;
  await db.update(whatsappSessionsTable)
    .set({ status: "disconnected", phoneNumber: null, sessionData: null, qrCode: null, lastDisconnect: new Date(), updatedAt: new Date() })
    .where(eq(whatsappSessionsTable.userId, user.id));
  res.json({ success: true });
});

router.put("/whatsapp/settings", requireAuth, async (req, res) => {
  const user = (req as AuthRequest).user;
  const parsed = UpdateWhatsappSettingsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation error", message: parsed.error.message });
    return;
  }

  const [updated] = await db.update(whatsappSessionsTable)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(whatsappSessionsTable.userId, user.id))
    .returning();

  res.json({
    status: updated.status,
    phoneNumber: updated.phoneNumber ?? null,
    lastConnected: updated.lastConnected ?? null,
    isAIEnabled: updated.isAIEnabled,
    awayMessage: updated.awayMessage ?? null,
    workingHours: updated.workingHours ?? null,
  });
});

export default router;
