import { Router } from "express";
import { db, broadcastsTable, contactsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { CreateBroadcastBody } from "@workspace/api-zod";
import { requireAuth, type AuthRequest } from "../lib/auth";
import { sendBroadcastMessages } from "../lib/whatsapp-manager";
import { getPlanLimits } from "../lib/plan-limits";

const router = Router();

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
      broadcastLimit: limits.broadcastLimit,
      isPremium: limits.isPremium,
      plan: limits.plan,
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

  const [broadcast] = await db.insert(broadcastsTable).values({
    userId: user.id,
    name: parsed.data.name,
    message: parsed.data.message,
    recipientType: parsed.data.recipientType,
    recipients: parsed.data.recipients ?? [],
    scheduledAt: parsed.data.scheduledAt ? new Date(parsed.data.scheduledAt) : undefined,
    status: parsed.data.scheduledAt ? "scheduled" : "draft",
  }).returning();

  res.status(201).json(formatBroadcast(broadcast));
});

router.post("/broadcasts/:id/send", requireAuth, async (req, res) => {
  const user = (req as AuthRequest).user;
  const { id } = req.params;

  const [broadcast, limits] = await Promise.all([
    db.select().from(broadcastsTable).where(eq(broadcastsTable.id, id)).then(r => r[0]),
    getPlanLimits(user.id),
  ]);

  if (!broadcast || broadcast.userId !== user.id) {
    res.status(404).json({ error: "Broadcast not found" });
    return;
  }

  // Fetch contacts to send to — exclude DND contacts
  let allPhones: string[] = [];
  if (broadcast.recipientType === "all") {
    const contacts = await db.select({ phone: contactsTable.phone })
      .from(contactsTable)
      .where(and(eq(contactsTable.userId, user.id), eq(contactsTable.dndEnabled, false)));
    allPhones = contacts.map((c) => c.phone);
  } else {
    // For custom list: filter out any DND contacts by phone lookup
    const customPhones = (broadcast.recipients as string[]) ?? [];
    if (customPhones.length > 0) {
      const dndContacts = await db.select({ phone: contactsTable.phone })
        .from(contactsTable)
        .where(and(eq(contactsTable.userId, user.id), eq(contactsTable.dndEnabled, true)));
      const dndSet = new Set(dndContacts.map(c => c.phone));
      allPhones = customPhones.filter(p => !dndSet.has(p));
    }
  }

  if (allPhones.length === 0) {
    res.status(400).json({ error: "No recipients found" });
    return;
  }

  // ── Enforce plan recipient cap ─────────────────────────────────────────────
  const phones = allPhones.slice(0, limits.broadcastLimit);
  const capped = phones.length < allPhones.length;

  // Mark as sending
  await db.update(broadcastsTable)
    .set({ status: "sending", recipientCount: phones.length, updatedAt: new Date() })
    .where(eq(broadcastsTable.id, id));

  // Send in background — respond immediately
  void sendBroadcastMessages(user.id, phones, broadcast.message)
    .then(async ({ sent, failed }) => {
      await db.update(broadcastsTable)
        .set({ status: "sent", sentAt: new Date(), deliveredCount: sent, failedCount: failed, updatedAt: new Date() })
        .where(eq(broadcastsTable.id, id));
    })
    .catch(async () => {
      await db.update(broadcastsTable)
        .set({ status: "failed", updatedAt: new Date() })
        .where(eq(broadcastsTable.id, id));
    });

  const [updated] = await db.select().from(broadcastsTable).where(eq(broadcastsTable.id, id));
  res.json({
    ...formatBroadcast(updated),
    capped,
    cappedTo: limits.broadcastLimit,
    plan: limits.plan,
    isPremium: limits.isPremium,
  });
});

export default router;
