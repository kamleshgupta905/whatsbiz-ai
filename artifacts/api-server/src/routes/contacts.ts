import { Router } from "express";
import { db, contactsTable } from "@workspace/db";
import { eq, and, ilike, sql } from "drizzle-orm";
import { CreateContactBody, UpdateContactBody } from "@workspace/api-zod";
import { requireAuth, type AuthRequest } from "../lib/auth";

const router = Router();

function formatContact(c: typeof contactsTable.$inferSelect) {
  return {
    id: c.id,
    phone: c.phone,
    name: c.name,
    email: c.email,
    tags: (c.tags as string[]) ?? [],
    notes: c.notes,
    totalMessages: c.totalMessages,
    lastMessageAt: c.lastMessageAt,
    firstContactAt: c.firstContactAt,
    totalOrders: c.totalOrders,
    totalRevenue: Number(c.totalRevenue ?? 0),
  };
}

router.get("/contacts", requireAuth, async (req, res) => {
  const user = (req as AuthRequest).user;
  const { search, tag, page = "1", limit = "20" } = req.query as Record<string, string>;
  const pageNum = parseInt(page) || 1;
  const limitNum = parseInt(limit) || 20;
  const offset = (pageNum - 1) * limitNum;

  const conditions = [eq(contactsTable.userId, user.id)];
  if (search) conditions.push(ilike(contactsTable.phone, `%${search}%`));

  const [contacts, countResult] = await Promise.all([
    db.select().from(contactsTable)
      .where(and(...conditions))
      .limit(limitNum)
      .offset(offset),
    db.select({ count: sql<number>`count(*)` }).from(contactsTable).where(and(...conditions)),
  ]);

  const total = Number(countResult[0]?.count ?? 0);

  res.json({
    contacts: contacts.map(formatContact),
    total,
    page: pageNum,
    totalPages: Math.ceil(total / limitNum),
  });
});

router.post("/contacts", requireAuth, async (req, res) => {
  const user = (req as AuthRequest).user;
  const parsed = CreateContactBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation error", message: parsed.error.message });
    return;
  }

  const [contact] = await db.insert(contactsTable).values({
    userId: user.id,
    ...parsed.data,
    tags: parsed.data.tags ?? [],
  }).returning();

  res.status(201).json(formatContact(contact));
});

router.get("/contacts/:id", requireAuth, async (req, res) => {
  const user = (req as AuthRequest).user;
  const { id } = req.params;

  const [contact] = await db.select().from(contactsTable)
    .where(and(eq(contactsTable.id, id), eq(contactsTable.userId, user.id)));

  if (!contact) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(formatContact(contact));
});

router.patch("/contacts/:id", requireAuth, async (req, res) => {
  const user = (req as AuthRequest).user;
  const { id } = req.params;
  const parsed = UpdateContactBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation error", message: parsed.error.message });
    return;
  }

  const [updated] = await db.update(contactsTable)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(and(eq(contactsTable.id, id), eq(contactsTable.userId, user.id)))
    .returning();

  res.json(formatContact(updated));
});

router.delete("/contacts/:id", requireAuth, async (req, res) => {
  const user = (req as AuthRequest).user;
  const { id } = req.params;

  const [deleted] = await db.delete(contactsTable)
    .where(and(eq(contactsTable.id, id), eq(contactsTable.userId, user.id)))
    .returning();

  if (!deleted) {
    res.status(404).json({ error: "Contact not found" });
    return;
  }

  res.json({ success: true });
});

export default router;
