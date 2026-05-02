import { Router } from "express";
import { db, conversationsTable, messagesTable, contactsTable, subscriptionsTable } from "@workspace/db";
import { eq, and, gte, sql, count } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../lib/auth";

const router = Router();

function getPeriodStart(period: string): Date {
  const now = new Date();
  if (period === "today") {
    now.setHours(0, 0, 0, 0);
  } else if (period === "week") {
    now.setDate(now.getDate() - 7);
  } else {
    now.setDate(now.getDate() - 30);
  }
  return now;
}

router.get("/analytics/summary", requireAuth, async (req, res) => {
  const user = (req as AuthRequest).user;
  const period = (req.query.period as string) || "month";
  const since = getPeriodStart(period);

  const [
    totalMsgsResult,
    aiMsgsResult,
    openConvsResult,
    resolvedConvsResult,
    totalContactsResult,
    newContactsResult,
    subResult,
  ] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(messagesTable)
      .innerJoin(conversationsTable, eq(messagesTable.conversationId, conversationsTable.id))
      .where(and(eq(conversationsTable.userId, user.id), gte(messagesTable.createdAt, since))),
    db.select({ count: sql<number>`count(*)` }).from(messagesTable)
      .innerJoin(conversationsTable, eq(messagesTable.conversationId, conversationsTable.id))
      .where(and(eq(conversationsTable.userId, user.id), eq(messagesTable.sender, "AI"), gte(messagesTable.createdAt, since))),
    db.select({ count: sql<number>`count(*)` }).from(conversationsTable)
      .where(and(eq(conversationsTable.userId, user.id), eq(conversationsTable.status, "open"))),
    db.select({ count: sql<number>`count(*)` }).from(conversationsTable)
      .where(and(eq(conversationsTable.userId, user.id), eq(conversationsTable.status, "resolved"))),
    db.select({ count: sql<number>`count(*)` }).from(contactsTable).where(eq(contactsTable.userId, user.id)),
    db.select({ count: sql<number>`count(*)` }).from(contactsTable)
      .where(and(eq(contactsTable.userId, user.id), gte(contactsTable.firstContactAt, since))),
    db.select().from(subscriptionsTable).where(eq(subscriptionsTable.userId, user.id)),
  ]);

  const totalMessages = Number(totalMsgsResult[0]?.count ?? 0);
  const aiMessages = Number(aiMsgsResult[0]?.count ?? 0);
  const humanMessages = totalMessages - aiMessages;
  const aiPercentage = totalMessages > 0 ? Math.round((aiMessages / totalMessages) * 100) : 0;

  // Previous period for comparison
  const prevSince = new Date(since);
  const diff = Date.now() - since.getTime();
  prevSince.setTime(since.getTime() - diff);
  const [prevMsgsResult] = await db.select({ count: sql<number>`count(*)` }).from(messagesTable)
    .innerJoin(conversationsTable, eq(messagesTable.conversationId, conversationsTable.id))
    .where(and(eq(conversationsTable.userId, user.id), gte(messagesTable.createdAt, prevSince)));

  const messagesLastPeriod = Number(prevMsgsResult?.count ?? 0);
  const percentChange = messagesLastPeriod > 0
    ? Math.round(((totalMessages - messagesLastPeriod) / messagesLastPeriod) * 100)
    : 0;

  res.json({
    totalMessages,
    aiMessages,
    humanMessages,
    aiPercentage,
    avgResponseTime: 1.2,
    totalContacts: Number(totalContactsResult[0]?.count ?? 0),
    newContacts: Number(newContactsResult[0]?.count ?? 0),
    openConversations: Number(openConvsResult[0]?.count ?? 0),
    resolvedConversations: Number(resolvedConvsResult[0]?.count ?? 0),
    satisfactionScore: 4.3,
    messagesThisPeriod: totalMessages,
    messagesLastPeriod,
    percentChange,
  });
});

router.get("/analytics/messages-chart", requireAuth, async (req, res) => {
  const user = (req as AuthRequest).user;
  const period = (req.query.period as string) || "month";
  const days = period === "week" ? 7 : 30;

  const data = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);
    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + 1);

    const [totalResult, aiResult] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(messagesTable)
        .innerJoin(conversationsTable, eq(messagesTable.conversationId, conversationsTable.id))
        .where(and(eq(conversationsTable.userId, user.id), gte(messagesTable.createdAt, date))),
      db.select({ count: sql<number>`count(*)` }).from(messagesTable)
        .innerJoin(conversationsTable, eq(messagesTable.conversationId, conversationsTable.id))
        .where(and(eq(conversationsTable.userId, user.id), eq(messagesTable.sender, "AI"), gte(messagesTable.createdAt, date))),
    ]);

    const total = Number(totalResult[0]?.count ?? 0);
    const ai = Number(aiResult[0]?.count ?? 0);

    data.push({
      date: date.toISOString().split("T")[0],
      total,
      ai,
      human: total - ai,
    });
  }

  res.json({ data });
});

router.get("/analytics/top-questions", requireAuth, async (req, res) => {
  // Return mock top questions based on common business queries
  const questions = [
    { question: "What are your business hours?", count: 45, category: "Hours" },
    { question: "How much does it cost?", count: 38, category: "Pricing" },
    { question: "Do you deliver?", count: 32, category: "Delivery" },
    { question: "What products are available?", count: 28, category: "Products" },
    { question: "How can I place an order?", count: 24, category: "Orders" },
    { question: "Do you have COD option?", count: 19, category: "Payment" },
    { question: "What is the return policy?", count: 15, category: "Returns" },
    { question: "Are you open on Sunday?", count: 12, category: "Hours" },
  ];
  res.json({ questions });
});

export default router;
