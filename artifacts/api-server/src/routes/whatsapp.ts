import { Router } from "express";
import { db, whatsappSessionsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { UpdateWhatsappSettingsBody } from "@workspace/api-zod";
import { requireAuth, type AuthRequest } from "../lib/auth.js";
import { startSession, disconnectSession, getSession, updateAIEnabled } from "../lib/whatsapp-manager.js";

const router = Router();

router.get("/whatsapp/status", requireAuth, async (req, res) => {
  const user = (req as AuthRequest).user;
  const [session] = await db.select().from(whatsappSessionsTable).where(eq(whatsappSessionsTable.userId, user.id));

  const inMemory = getSession(user.id);

  res.set("Cache-Control", "no-store, no-cache, must-revalidate");
  res.set("Pragma", "no-cache");
  res.set("Expires", "0");

  // If no in-memory session exists, the Baileys socket is gone (server restart or never started).
  // DB may still say "connected" from before — always return "disconnected" in that case.
  const liveStatus = inMemory?.status ?? "disconnected";
  const livePhone = liveStatus === "connected" ? (inMemory?.phoneNumber ?? session?.phoneNumber ?? null) : null;

  res.json({
    status: liveStatus,
    phoneNumber: livePhone,
    lastConnected: session?.lastConnected ?? null,
    isAIEnabled: session?.isAIEnabled ?? true,
    awayMessage: session?.awayMessage ?? null,
    workingHours: session?.workingHours ?? null,
  });
});

router.get("/whatsapp/qr", requireAuth, async (req, res) => {
  const user = (req as AuthRequest).user;
  const session = getSession(user.id);

  res.set("Cache-Control", "no-store, no-cache, must-revalidate");
  res.set("Pragma", "no-cache");
  res.set("Expires", "0");

  if (!session) {
    res.status(404).json({ error: "No active session. Call /connect first." });
    return;
  }

  if (session.status === "connected") {
    res.json({ status: "connected", qrBase64: null });
    return;
  }

  res.json({
    status: session.status,
    qrBase64: session.qrBase64 ?? null,
  });
});

router.post("/whatsapp/connect", requireAuth, async (req, res) => {
  const user = (req as AuthRequest).user;

  startSession(user.id).catch(() => {});

  res.json({ status: "connecting", message: "Session started. Poll /whatsapp/qr for QR code." });
});

router.post("/whatsapp/disconnect", requireAuth, async (req, res) => {
  const user = (req as AuthRequest).user;
  await disconnectSession(user.id);
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

  // Sync in-memory AI flag immediately — no restart needed
  if (parsed.data.isAIEnabled !== undefined) {
    updateAIEnabled(user.id, updated.isAIEnabled);
  }

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
