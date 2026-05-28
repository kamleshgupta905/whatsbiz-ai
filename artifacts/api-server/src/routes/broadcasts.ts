import { Router } from "express";
import { db, broadcastsTable, contactsTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";
import { CreateBroadcastBody } from "@workspace/api-zod";
import { requireAuth, type AuthRequest } from "../lib/auth";
import { BROADCAST_DAILY_LIMIT, sendAdminAlert, sendBroadcastMessages } from "../lib/whatsapp-manager";
import { getPlanLimits } from "../lib/plan-limits";

const router = Router();

function normalizePhone(phone: unknown): string | null {
  if (typeof phone !== "string") return null;
  const digits = phone.replace(/[^0-9]/g, "");
  if (digits.length === 10 && /^[6-9]/.test(digits)) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith("91") && /^[6-9]/.test(digits.slice(2))) return `+${digits}`;
  if (digits.length >= 11 && digits.length <= 15) return `+${digits}`;
  return null;
}

function normalizePhoneList(phones: unknown[]): { valid: string[]; invalid: string[]; duplicateCount: number } {
  const valid: string[] = [];
  const invalid: string[] = [];
  const seen = new Set<string>();
  let duplicateCount = 0;

  for (const raw of phones) {
    const value = String(raw ?? "").trim();
    if (!value) continue;
    const normalized = normalizePhone(value);
    if (!normalized) {
      invalid.push(value);
      continue;
    }
    if (seen.has(normalized)) {
      duplicateCount++;
      continue;
    }
    seen.add(normalized);
    valid.push(normalized);
  }

  return { valid, invalid, duplicateCount };
}

function uniquePhones(phones: string[]): string[] {
  return normalizePhoneList(phones).valid;
}

function nextBroadcastWindow(from = new Date()): Date {
  const istNow = new Date(from.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  const targetIst = new Date(istNow);
  targetIst.setHours(8, 0, 0, 0);
  if (istNow.getTime() >= targetIst.getTime()) {
    targetIst.setDate(targetIst.getDate() + 1);
  }
  return new Date(targetIst.getTime() - 5.5 * 60 * 60 * 1000);
}

function isBroadcastStartWindow(now = new Date()): boolean {
  const istNow = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  return istNow.getHours() === 8 && istNow.getMinutes() <= 5;
}

function formatBroadcast(b: typeof broadcastsTable.$inferSelect) {
  return {
    id: b.id,
    name: b.name,
    message: b.message,
    recipientType: b.recipientType,
    recipientCount: b.recipientCount,
    status: b.status,
    scheduledAt: b.scheduledAt,
    sentAt: b.sentAt,
    deliveredCount: b.deliveredCount,
    readCount: b.readCount,
    repliedCount: b.repliedCount,
    failedCount: b.failedCount,
    remainingCount: Math.max(0, b.recipientCount - b.deliveredCount - b.failedCount),
    dailyLimit: BROADCAST_DAILY_LIMIT,
    createdAt: b.createdAt,
  };
}

router.get("/broadcasts", requireAuth, async (req, res) => {
  const user = (req as AuthRequest).user;
  const [broadcasts, countResult, limits] = await Promise.all([
    db.select().from(broadcastsTable)
      .where(eq(broadcastsTable.userId, user.id))
      .orderBy(sql`${broadcastsTable.createdAt} DESC`),
    db.select({ count: sql<number>`count(*)` }).from(broadcastsTable).where(eq(broadcastsTable.userId, user.id)),
    getPlanLimits(user.id),
  ]);

  res.json({
    broadcasts: broadcasts.map(formatBroadcast),
    total: Number(countResult[0]?.count ?? 0),
    limits: {
      broadcastLimit: BROADCAST_DAILY_LIMIT,
      dailyLimit: BROADCAST_DAILY_LIMIT,
      isPremium: limits.isPremium,
      plan: limits.plan,
      defaultWindow: "8:00 AM to 8:50 AM IST",
      delaySeconds: 60,
    },
  });
});

router.post("/broadcasts", requireAuth, async (req, res) => {
  const user = (req as AuthRequest).user;
  const parsed = CreateBroadcastBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation error", message: parsed.error.message });
    return;
  }

  let recipients: string[] = [];
  let invalid: string[] = [];
  let duplicateCount = 0;

  if (parsed.data.recipientType === "custom") {
    const normalized = normalizePhoneList(parsed.data.recipients ?? []);
    recipients = normalized.valid;
    invalid = normalized.invalid;
    duplicateCount = normalized.duplicateCount;
  }

  if (parsed.data.recipientType === "custom" && recipients.length === 0) {
    res.status(400).json({
      error: "No valid numbers found",
      invalidCount: invalid.length,
      duplicateCount,
      invalidNumbers: invalid.slice(0, 25),
    });
    return;
  }

  const [broadcast] = await db.insert(broadcastsTable).values({
    userId: user.id,
    name: parsed.data.name,
    message: parsed.data.message,
    recipientType: parsed.data.recipientType,
    recipients,
    recipientCount: parsed.data.recipientType === "custom" ? recipients.length : 0,
    scheduledAt: parsed.data.scheduledAt ? new Date(parsed.data.scheduledAt) : nextBroadcastWindow(),
    status: "draft",
  }).returning();

  res.status(201).json({
    ...formatBroadcast(broadcast),
    validCount: recipients.length,
    invalidCount: invalid.length,
    duplicateCount,
    invalidNumbers: invalid.slice(0, 25),
    defaultSchedule: "Daily 8:00 AM to 8:50 AM IST, 45 messages/day, 1 minute delay",
  });
});

router.post("/broadcasts/:id/send", requireAuth, async (req, res) => {
  const user = (req as AuthRequest).user;
  const id = req.params.id as string;
  const [broadcast] = await db.select().from(broadcastsTable).where(eq(broadcastsTable.id, id));

  if (!broadcast || broadcast.userId !== user.id) {
    res.status(404).json({ error: "Broadcast not found" });
    return;
  }

  let allPhones = ((broadcast.recipients as string[]) ?? []).filter(Boolean);
  if (broadcast.recipientType === "all" || allPhones.length === 0) {
    const contacts = await db.select({ phone: contactsTable.phone })
      .from(contactsTable)
      .where(and(eq(contactsTable.userId, user.id), eq(contactsTable.dndEnabled, false)));
    allPhones = uniquePhones(contacts.map((c) => c.phone));
  } else if (broadcast.recipientType === "custom") {
    const dndContacts = await db.select({ phone: contactsTable.phone })
      .from(contactsTable)
      .where(and(eq(contactsTable.userId, user.id), eq(contactsTable.dndEnabled, true)));
    const dndSet = new Set(uniquePhones(dndContacts.map((c) => c.phone)));
    allPhones = uniquePhones(allPhones).filter((phone) => !dndSet.has(phone));
  }

  if (allPhones.length === 0) {
    res.status(400).json({ error: "No recipients found" });
    return;
  }

  const scheduledAt = nextBroadcastWindow();
  await db.update(broadcastsTable)
    .set({
      status: "scheduled",
      recipients: allPhones,
      recipientCount: allPhones.length,
      scheduledAt,
      deliveredCount: 0,
      failedCount: 0,
      sentAt: null,
      updatedAt: new Date(),
    })
    .where(eq(broadcastsTable.id, id));

  const [updated] = await db.select().from(broadcastsTable).where(eq(broadcastsTable.id, id));
  res.json({
    ...formatBroadcast(updated),
    dailyLimit: BROADCAST_DAILY_LIMIT,
    scheduledAt,
    message: "Broadcast automation started. 45 messages/day, daily 8:00 AM to 8:50 AM IST.",
  });
});

export async function processDueBroadcasts() {
  if (!isBroadcastStartWindow()) return;

  const now = new Date();
  const [broadcast] = await db.select().from(broadcastsTable)
    .where(and(eq(broadcastsTable.status, "scheduled"), sql`${broadcastsTable.scheduledAt} <= ${now}`))
    .orderBy(sql`${broadcastsTable.scheduledAt} ASC`);

  if (!broadcast) return;

  const recipients = ((broadcast.recipients as string[]) ?? []).filter(Boolean);
  const processed = broadcast.deliveredCount + broadcast.failedCount;
  const remaining = recipients.slice(processed);

  if (remaining.length === 0) {
    await db.update(broadcastsTable)
      .set({ status: "sent", sentAt: new Date(), updatedAt: new Date() })
      .where(eq(broadcastsTable.id, broadcast.id));
    return;
  }

  const batch = remaining.slice(0, BROADCAST_DAILY_LIMIT);
  await db.update(broadcastsTable)
    .set({ status: "sending", updatedAt: new Date() })
    .where(eq(broadcastsTable.id, broadcast.id));

  try {
    const baseSent = broadcast.deliveredCount;
    const baseFailed = broadcast.failedCount;
    const result = await sendBroadcastMessages(broadcast.userId, batch, broadcast.message, async (sent, failed) => {
      await db.update(broadcastsTable)
        .set({ deliveredCount: baseSent + sent, failedCount: baseFailed + failed, updatedAt: new Date() })
        .where(eq(broadcastsTable.id, broadcast.id));
    });

    const deliveredCount = baseSent + result.sent;
    const failedCount = baseFailed + result.failed;
    const done = deliveredCount + failedCount >= recipients.length;

    await db.update(broadcastsTable)
      .set({
        status: done ? "sent" : "scheduled",
        sentAt: done ? new Date() : broadcast.sentAt,
        scheduledAt: done ? broadcast.scheduledAt : nextBroadcastWindow(new Date(Date.now() + 60_000)),
        deliveredCount,
        failedCount,
        updatedAt: new Date(),
      })
      .where(eq(broadcastsTable.id, broadcast.id));

    if (done) {
      void sendAdminAlert([
        "Broadcast completed",
        `Campaign: ${broadcast.name}`,
        `Sent: ${deliveredCount}`,
        `Failed: ${failedCount}`,
        "All numbers are ended. Automation stopped.",
      ].join("\n"));
    }
  } catch (err) {
    await db.update(broadcastsTable)
      .set({ status: "scheduled", scheduledAt: nextBroadcastWindow(new Date(Date.now() + 60_000)), updatedAt: new Date() })
      .where(eq(broadcastsTable.id, broadcast.id));
    console.error("[Broadcast] Daily send failed:", err instanceof Error ? err.message : err);
  }
}

export function startBroadcastScheduler() {
  void processDueBroadcasts().catch((err) => {
    console.error("[Broadcast] Scheduler startup failed:", err instanceof Error ? err.message : err);
  });
  setInterval(() => {
    void processDueBroadcasts().catch((err) => {
      console.error("[Broadcast] Scheduler tick failed:", err instanceof Error ? err.message : err);
    });
  }, 60_000);
}

export default router;
