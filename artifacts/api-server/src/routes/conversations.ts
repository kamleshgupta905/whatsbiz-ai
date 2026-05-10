import { Router } from "express";
import { db, conversationsTable, messagesTable, contactsTable } from "@workspace/db";
import { eq, and, desc, ilike, sql } from "drizzle-orm";
import { UpdateConversationBody, SendMessageBody } from "@workspace/api-zod";
import { requireAuth, type AuthRequest } from "../lib/auth";

const router = Router();

router.get("/conversations", requireAuth, async (req, res) => {
  const user = (req as AuthRequest).user;
  const { status, search, page = "1", limit = "20" } = req.query as Record<string, string>;
  const pageNum = parseInt(page) || 1;
  const limitNum = parseInt(limit) || 20;
  const offset = (pageNum - 1) * limitNum;

  const conditions = [eq(conversationsTable.userId, user.id)];
  if (status) conditions.push(eq(conversationsTable.status, status as "open" | "pending" | "resolved" | "archived"));
  if (search) conditions.push(ilike(conversationsTable.customerPhone, `%${search}%`));

  const [conversations, countResult] = await Promise.all([
    db.select().from(conversationsTable)
      .where(and(...conditions))
      .orderBy(desc(conversationsTable.lastMessageAt))
      .limit(limitNum)
      .offset(offset),
    db.select({ count: sql<number>`count(*)` }).from(conversationsTable).where(and(...conditions)),
  ]);

  const total = Number(countResult[0]?.count ?? 0);

  res.json({
    conversations: conversations.map((c) => ({
      id: c.id,
      customerPhone: c.customerPhone,
      customerName: c.customerName,
      status: c.status,
      isAIEnabled: c.isAIEnabled,
      tags: c.tags ?? [],
      unreadCount: c.unreadCount,
      lastMessageAt: c.lastMessageAt,
      lastMessage: c.lastMessage,
      sentiment: c.sentiment,
      intent: c.intent,
      notes: c.notes,
    })),
    total,
    page: pageNum,
    totalPages: Math.ceil(total / limitNum),
  });
});

router.get("/conversations/:id", requireAuth, async (req, res) => {
  const user = (req as AuthRequest).user;
  const id = req.params.id as string;

  const [conv] = await db.select().from(conversationsTable)
    .where(and(eq(conversationsTable.id, id), eq(conversationsTable.userId, user.id)));

  if (!conv) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  const [messages, contact] = await Promise.all([
    db.select().from(messagesTable)
      .where(eq(messagesTable.conversationId, id))
      .orderBy(messagesTable.createdAt),
    db.select().from(contactsTable).where(eq(contactsTable.id, conv.contactId)),
  ]);

  // Mark messages as read
  await db.update(messagesTable).set({ isRead: true }).where(
    and(eq(messagesTable.conversationId, id), eq(messagesTable.isRead, false))
  );
  await db.update(conversationsTable).set({ unreadCount: 0 }).where(eq(conversationsTable.id, id));

  res.json({
    conversation: {
      id: conv.id,
      customerPhone: conv.customerPhone,
      customerName: conv.customerName,
      status: conv.status,
      isAIEnabled: conv.isAIEnabled,
      tags: conv.tags ?? [],
      unreadCount: 0,
      lastMessageAt: conv.lastMessageAt,
      lastMessage: conv.lastMessage,
      sentiment: conv.sentiment,
      intent: conv.intent,
      notes: conv.notes,
    },
    messages: messages.map((m) => ({
      id: m.id,
      conversationId: m.conversationId,
      sender: m.sender,
      content: m.content,
      messageType: m.messageType,
      mediaUrl: m.mediaUrl,
      isRead: m.isRead,
      aiConfidence: m.aiConfidence ? Number(m.aiConfidence) : null,
      responseTime: m.responseTime,
      createdAt: m.createdAt,
    })),
    contact: contact[0] ? {
      id: contact[0].id,
      phone: contact[0].phone,
      name: contact[0].name,
      email: contact[0].email,
      tags: contact[0].tags ?? [],
      notes: contact[0].notes,
      totalMessages: contact[0].totalMessages,
      lastMessageAt: contact[0].lastMessageAt,
      firstContactAt: contact[0].firstContactAt,
      totalOrders: contact[0].totalOrders,
      totalRevenue: Number(contact[0].totalRevenue),
    } : undefined,
  });
});

router.patch("/conversations/:id", requireAuth, async (req, res) => {
  const user = (req as AuthRequest).user;
  const id = req.params.id as string;
  const parsed = UpdateConversationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation error", message: parsed.error.message });
    return;
  }

  const [updated] = await db.update(conversationsTable)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(and(eq(conversationsTable.id, id), eq(conversationsTable.userId, user.id)))
    .returning();

  res.json({
    id: updated.id,
    customerPhone: updated.customerPhone,
    customerName: updated.customerName,
    status: updated.status,
    isAIEnabled: updated.isAIEnabled,
    tags: updated.tags ?? [],
    unreadCount: updated.unreadCount,
    lastMessageAt: updated.lastMessageAt,
    lastMessage: updated.lastMessage,
    sentiment: updated.sentiment,
    intent: updated.intent,
    notes: updated.notes,
  });
});

router.post("/conversations/:id/messages", requireAuth, async (req, res) => {
  const user = (req as AuthRequest).user;
  const id = req.params.id as string;
  const parsed = SendMessageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation error", message: parsed.error.message });
    return;
  }

  // Verify conversation belongs to user
  const [conv] = await db.select().from(conversationsTable)
    .where(and(eq(conversationsTable.id, id), eq(conversationsTable.userId, user.id)));
  if (!conv) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  const [msg] = await db.insert(messagesTable).values({
    conversationId: id,
    sender: "OWNER",
    content: parsed.data.content,
    messageType: (parsed.data.messageType ?? "TEXT") as "TEXT" | "IMAGE" | "DOCUMENT",
    mediaUrl: parsed.data.mediaUrl,
    isRead: true,
    isDelivered: true,
  }).returning();

  await db.update(conversationsTable)
    .set({ lastMessage: parsed.data.content, lastMessageAt: new Date(), updatedAt: new Date() })
    .where(eq(conversationsTable.id, id));

  res.status(201).json({
    id: msg.id,
    conversationId: msg.conversationId,
    sender: msg.sender,
    content: msg.content,
    messageType: msg.messageType,
    mediaUrl: msg.mediaUrl,
    isRead: msg.isRead,
    aiConfidence: null,
    responseTime: null,
    createdAt: msg.createdAt,
  });
});

export default router;
