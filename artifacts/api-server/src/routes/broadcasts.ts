import { Router } from "express";
import { db, broadcastsTable, contactsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { CreateBroadcastBody } from "@workspace/api-zod";
import { requireAuth, type AuthRequest } from "../lib/auth";
import { sendBroadcastMessages } from "../lib/whatsapp-manager";

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
  const [broadcasts, countResult] = await Promise.all([
    db.select().from(broadcastsTable)
      .where(eq(broadcastsTable.userId, user.id))
      .orderBy(sql`${broadcastsTable.createdAt} DESC`),
    db.select({ count: sql<number>`count(*)` }).from(broadcastsTable).where(eq(broadcastsTable.userId, user.id)),
  ]);

  res.json({
    broadcasts: broadcasts.map(formatBroadcast),
    total: Number(countResult[0]?.count ?? 0),
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

  const [broadcast] = await db.select().from(broadcastsTable)
    .where(eq(broadcastsTable.id, id));

  if (!broadcast || broadcast.userId !== user.id) {
    res.status(404).json({ error: "Broadcast not found" });
    return;
  }

  // Fetch contacts to send to
  let phones: string[] = [];
  if (broadcast.recipientType === "all") {
    const contacts = await db.select({ phone: contactsTable.phone })
      .from(contactsTable)
      .where(eq(contactsTable.userId, user.id));
    phones = contacts.map((c) => c.phone);
  } else {
    phones = (broadcast.recipients as string[]) ?? [];
  }

  if (phones.length === 0) {
    res.status(400).json({ error: "No recipients found" });
    return;
  }

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
  res.json(formatBroadcast(updated));
});

export default router;
