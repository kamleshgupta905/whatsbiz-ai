import { Router } from "express";
import { db, whatsappSessionsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { UpdateWhatsappSettingsBody } from "@workspace/api-zod";
import { requireAuth, type AuthRequest } from "../lib/auth.js";
import {
  startSession,
  disconnectSession,
  getSession,
  updateAIEnabled,
  connectCloudApiSession,
  getCloudApiConnection,
  sendAdminAlert,
} from "../lib/whatsapp-manager.js";

const router = Router();

router.get("/whatsapp/status", requireAuth, async (req, res) => {
  const user = (req as AuthRequest).user;
  const [session] = await db.select().from(whatsappSessionsTable).where(eq(whatsappSessionsTable.userId, user.id));
  const inMemory = getSession(user.id);

  res.set("Cache-Control", "no-store, no-cache, must-revalidate");
  res.set("Pragma", "no-cache");
  res.set("Expires", "0");

  const cloudApi = await getCloudApiConnection(user.id);
  if (cloudApi) {
    res.json({
      status: "connected",
      phoneNumber: session?.phoneNumber ?? cloudApi.displayPhoneNumber ?? null,
      connectionMode: "cloud_api",
      lastConnected: session?.lastConnected ?? null,
      isAIEnabled: session?.isAIEnabled ?? true,
      awayMessage: session?.awayMessage ?? null,
      workingHours: session?.workingHours ?? null,
    });
    return;
  }

  let liveStatus = inMemory?.status ?? session?.status ?? "disconnected";
  if (!inMemory && session?.status === "connected") {
    liveStatus = "connecting";
    startSession(user.id, false).catch(() => {});
  }

  const livePhone = liveStatus === "connected" || liveStatus === "connecting"
    ? (inMemory?.phoneNumber ?? session?.phoneNumber ?? null)
    : null;

  res.json({
    status: liveStatus,
    phoneNumber: livePhone,
    connectionMode: "qr_linked_device",
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

  startSession(user.id, true).catch(() => {});

  res.json({ status: "connecting", message: "Session started. Poll /whatsapp/qr for QR code." });
});

router.get("/whatsapp/api-config", requireAuth, async (req, res) => {
  const user = (req as AuthRequest).user;
  const config = await getCloudApiConnection(user.id);
  res.json({ configured: Boolean(config), config });
});

router.post("/whatsapp/api-connect", requireAuth, async (req, res) => {
  const user = (req as AuthRequest).user;
  const {
    phoneNumberId,
    accessToken,
    businessAccountId,
    displayPhoneNumber,
  } = req.body as Record<string, string | undefined>;

  if (!phoneNumberId?.trim() || !accessToken?.trim()) {
    res.status(400).json({ error: "Phone Number ID and Access Token are required." });
    return;
  }

  await connectCloudApiSession(user.id, {
    phoneNumberId,
    accessToken,
    businessAccountId,
    displayPhoneNumber,
  });

  void sendAdminAlert([
    "WhatsBiz AI alert",
    "WhatsApp API connected",
    `User: ${user.name} (${user.email})`,
    `Business: ${user.businessName}`,
    `Number: ${displayPhoneNumber?.trim() || "not provided"}`,
  ].join("\n"));

  res.json({
    status: "connected",
    connectionMode: "cloud_api",
    phoneNumber: displayPhoneNumber?.trim() || null,
  });
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
    .set({ ...parsed.data, workingHours: parsed.data.workingHours as any, updatedAt: new Date() })
    .where(eq(whatsappSessionsTable.userId, user.id))
    .returning();

  if (parsed.data.isAIEnabled !== undefined) {
    updateAIEnabled(user.id, updated.isAIEnabled);
  }

  res.json({
    status: updated.status,
    phoneNumber: updated.phoneNumber ?? null,
    connectionMode: (await getCloudApiConnection(user.id)) ? "cloud_api" : "qr_linked_device",
    lastConnected: updated.lastConnected ?? null,
    isAIEnabled: updated.isAIEnabled,
    awayMessage: updated.awayMessage ?? null,
    workingHours: updated.workingHours ?? null,
  });
});

export default router;
