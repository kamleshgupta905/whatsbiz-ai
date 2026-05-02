import { Router } from "express";
import { db, notificationsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../lib/auth";

const router = Router();

router.get("/notifications", requireAuth, async (req, res) => {
  const user = (req as AuthRequest).user;
  const unread = req.query.unread === "true";

  const conditions = [eq(notificationsTable.userId, user.id)];
  if (unread) conditions.push(eq(notificationsTable.isRead, false));

  const [notifications, unreadResult] = await Promise.all([
    db.select().from(notificationsTable)
      .where(and(...conditions))
      .orderBy(sql`${notificationsTable.createdAt} DESC`)
      .limit(50),
    db.select({ count: sql<number>`count(*)` }).from(notificationsTable)
      .where(and(eq(notificationsTable.userId, user.id), eq(notificationsTable.isRead, false))),
  ]);

  res.json({
    notifications: notifications.map((n) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      message: n.message,
      link: n.link,
      isRead: n.isRead,
      createdAt: n.createdAt,
    })),
    unreadCount: Number(unreadResult[0]?.count ?? 0),
  });
});

router.post("/notifications/mark-read", requireAuth, async (req, res) => {
  const user = (req as AuthRequest).user;
  const { ids, all } = req.body as { ids?: string[]; all?: boolean };

  if (all) {
    await db.update(notificationsTable)
      .set({ isRead: true })
      .where(eq(notificationsTable.userId, user.id));
  } else if (ids && ids.length > 0) {
    await db.update(notificationsTable)
      .set({ isRead: true })
      .where(and(eq(notificationsTable.userId, user.id)));
  }

  res.json({ success: true });
});

export default router;
