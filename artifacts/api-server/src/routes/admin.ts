import { Router } from "express";
import { db, usersTable, subscriptionsTable, paymentsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../lib/auth";
import { sendAdminAlert, sendWhatsAppText } from "../lib/whatsapp-manager";

const router = Router();

const PLAN_LIMITS: Record<string, { messagesLimit: number; whatsappLimit: number }> = {
  TRIAL: { messagesLimit: 100, whatsappLimit: 1 },
  STARTER: { messagesLimit: 500, whatsappLimit: 1 },
  PRO: { messagesLimit: 3000, whatsappLimit: 2 },
  BUSINESS: { messagesLimit: 10000, whatsappLimit: 5 },
};

function requireAdmin(req: Parameters<typeof requireAuth>[0], res: Parameters<typeof requireAuth>[1], next: Parameters<typeof requireAuth>[2]) {
  requireAuth(req, res, () => {
    const user = (req as AuthRequest).user;
    if (user.role !== "ADMIN") {
      res.status(403).json({ error: "Admin access required" });
      return;
    }
    next();
  });
}

// ─── List all users with their subscription ──────────────────────────────────
router.get("/admin/users", requireAdmin, async (_req, res) => {
  const rows = await db
    .select({
      id: usersTable.id,
      name: usersTable.name,
      email: usersTable.email,
      phone: usersTable.phone,
      businessName: usersTable.businessName,
      role: usersTable.role,
      isActive: usersTable.isActive,
      createdAt: usersTable.createdAt,
      plan: subscriptionsTable.plan,
      subStatus: subscriptionsTable.status,
      endDate: subscriptionsTable.endDate,
      messagesLimit: subscriptionsTable.messagesLimit,
      messagesUsed: subscriptionsTable.messagesUsed,
      scrapeSessionsUsed: subscriptionsTable.scrapeSessionsUsed,
    })
    .from(usersTable)
    .leftJoin(subscriptionsTable, eq(subscriptionsTable.userId, usersTable.id))
    .orderBy(sql`${usersTable.createdAt} DESC`);

  res.json({ users: rows });
});

// ─── Change a user's plan ─────────────────────────────────────────────────────
router.patch("/admin/users/:id/plan", requireAdmin, async (req, res) => {
  const id = req.params.id as string;
  const { plan } = req.body as { plan: string };

  const validPlans = ["TRIAL", "STARTER", "PRO", "BUSINESS"];
  if (!validPlans.includes(plan)) {
    res.status(400).json({ error: "Invalid plan. Must be TRIAL | STARTER | PRO | BUSINESS" });
    return;
  }

  const endDate = plan === "TRIAL" ? new Date(Date.now() + 2 * 86400_000) : new Date("2099-12-31");
  const status = plan === "TRIAL" ? "TRIAL" : "ACTIVE";
  const limits = PLAN_LIMITS[plan];

  const [sub] = await db
    .update(subscriptionsTable)
    .set({
      plan: plan as any,
      status: status as any,
      endDate,
      messagesLimit: limits.messagesLimit,
      whatsappLimit: limits.whatsappLimit,
      updatedAt: new Date(),
    })
    .where(eq(subscriptionsTable.userId, id))
    .returning();

  if (!sub) {
    res.status(404).json({ error: "Subscription not found for this user" });
    return;
  }

  res.json({ success: true, plan: sub.plan, status: sub.status });
});

// ─── Change a user's role ─────────────────────────────────────────────────────
router.patch("/admin/users/:id/role", requireAdmin, async (req, res) => {
  const id = req.params.id as string;
  const { role } = req.body as { role: string };

  const validRoles = ["CLIENT", "ADMIN", "SUPPORT"];
  if (!validRoles.includes(role)) {
    res.status(400).json({ error: "Invalid role. Must be CLIENT | ADMIN | SUPPORT" });
    return;
  }

  const [user] = await db
    .update(usersTable)
    .set({ role: role as any, updatedAt: new Date() })
    .where(eq(usersTable.id, id))
    .returning();

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json({ success: true, role: user.role });
});

// ─── Activate / suspend a user ────────────────────────────────────────────────
router.patch("/admin/users/:id/status", requireAdmin, async (req, res) => {
  const id = req.params.id as string;
  const { isActive } = req.body as { isActive: boolean };

  const [user] = await db
    .update(usersTable)
    .set({ isActive, updatedAt: new Date() })
    .where(eq(usersTable.id, id))
    .returning();

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json({ success: true, isActive: user.isActive });
});

// ─── Reset scrape sessions counter ───────────────────────────────────────────
router.post("/admin/users/:id/reset-scrapes", requireAdmin, async (req, res) => {
  const id = req.params.id as string;

  const [sub] = await db
    .update(subscriptionsTable)
    .set({ scrapeSessionsUsed: 0, updatedAt: new Date() })
    .where(eq(subscriptionsTable.userId, id))
    .returning();

  if (!sub) {
    res.status(404).json({ error: "Subscription not found" });
    return;
  }

  res.json({ success: true });
});

// ─── Stats overview ───────────────────────────────────────────────────────────
router.get("/admin/stats", requireAdmin, async (_req, res) => {
  const [userCount] = await db.select({ count: sql<number>`count(*)` }).from(usersTable);
  const [activeCount] = await db.select({ count: sql<number>`count(*)` }).from(usersTable).where(eq(usersTable.isActive, true));
  const planBreakdown = await db
    .select({ plan: subscriptionsTable.plan, count: sql<number>`count(*)` })
    .from(subscriptionsTable)
    .groupBy(subscriptionsTable.plan);

  res.json({
    totalUsers: Number(userCount?.count ?? 0),
    activeUsers: Number(activeCount?.count ?? 0),
    planBreakdown: planBreakdown.map(r => ({ plan: r.plan, count: Number(r.count) })),
  });
});

router.get("/admin/payments", requireAdmin, async (_req, res) => {
  const rows = await db
    .select({
      id: paymentsTable.id,
      userId: paymentsTable.userId,
      userName: usersTable.name,
      userEmail: usersTable.email,
      userPhone: usersTable.phone,
      businessName: usersTable.businessName,
      amount: paymentsTable.amount,
      currency: paymentsTable.currency,
      plan: paymentsTable.plan,
      status: paymentsTable.status,
      paymentMethod: paymentsTable.paymentMethod,
      utr: paymentsTable.utr,
      txnNote: paymentsTable.txnNote,
      createdAt: paymentsTable.createdAt,
      paidAt: paymentsTable.paidAt,
      verifiedAt: paymentsTable.verifiedAt,
    })
    .from(paymentsTable)
    .leftJoin(usersTable, eq(usersTable.id, paymentsTable.userId))
    .orderBy(sql`${paymentsTable.createdAt} DESC`)
    .limit(100);

  res.json({ payments: rows });
});

router.post("/admin/payments/:id/approve", requireAdmin, async (req, res) => {
  const admin = (req as AuthRequest).user;
  const id = req.params.id as string;

  const [payment] = await db.update(paymentsTable)
    .set({
      status: "COMPLETED",
      paidAt: new Date(),
      verifiedAt: new Date(),
      verifiedBy: admin.id,
      invoiceNumber: `WB-${Date.now()}`,
      updatedAt: new Date(),
    })
    .where(eq(paymentsTable.id, id))
    .returning();

  if (!payment) {
    res.status(404).json({ error: "Payment not found" });
    return;
  }

  const limits = PLAN_LIMITS[payment.plan];
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + (payment.duration || 30));

  await db.update(subscriptionsTable)
    .set({
      plan: payment.plan,
      status: "ACTIVE",
      startDate: new Date(),
      endDate,
      messagesLimit: limits.messagesLimit,
      whatsappLimit: limits.whatsappLimit,
      updatedAt: new Date(),
    })
    .where(eq(subscriptionsTable.userId, payment.userId));

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, payment.userId));
  if (user) {
    void sendWhatsAppText(user.id, user.phone, `Payment verified. Your ${payment.plan} plan is active for ${payment.duration || 30} days. Thank you for subscribing to WhatsBiz AI.`).catch(() => {});
    void sendAdminAlert([
      "WhatsBiz AI subscription alert",
      "Payment approved and premium activated",
      `User: ${user.name} (${user.email})`,
      `Plan: ${payment.plan}`,
      `Amount: ${payment.currency} ${payment.amount}`,
      `Method: ${payment.paymentMethod}`,
    ].join("\n"));
  }

  res.json({ success: true, paymentId: payment.id, plan: payment.plan, status: "COMPLETED" });
});

router.post("/admin/payments/:id/reject", requireAdmin, async (req, res) => {
  const admin = (req as AuthRequest).user;
  const id = req.params.id as string;
  const { reason = "Payment could not be verified.", solution = "Please share a valid UTR/screenshot or retry using UPI." } =
    req.body as { reason?: string; solution?: string };

  const [payment] = await db.update(paymentsTable)
    .set({
      status: "FAILED",
      verifiedAt: new Date(),
      verifiedBy: admin.id,
      refundReason: `${reason}\nSolution: ${solution}`,
      updatedAt: new Date(),
    })
    .where(eq(paymentsTable.id, id))
    .returning();

  if (!payment) {
    res.status(404).json({ error: "Payment not found" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, payment.userId));
  if (user) {
    void sendWhatsAppText(user.id, user.phone, `Payment verification failed.\nReason: ${reason}\nSolution: ${solution}`).catch(() => {});
    void sendAdminAlert([
      "WhatsBiz AI payment alert",
      "Payment rejected",
      `User: ${user.name} (${user.email})`,
      `Plan: ${payment.plan}`,
      `Reason: ${reason}`,
    ].join("\n"));
  }

  res.json({ success: true, paymentId: payment.id, status: "FAILED", reason, solution });
});

export default router;
