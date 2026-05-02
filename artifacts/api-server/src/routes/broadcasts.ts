import { Router } from "express";
import { db, broadcastsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { CreateBroadcastBody } from "@workspace/api-zod";
import { requireAuth, type AuthRequest } from "../lib/auth";

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

  const [updated] = await db.update(broadcastsTable)
    .set({ status: "sent", sentAt: new Date(), updatedAt: new Date() })
    .where(eq(broadcastsTable.id, id))
    .returning();

  res.json(formatBroadcast(updated));
});

export default router;
