import { Router } from "express";
import { db, usersTable, subscriptionsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../lib/auth";

const router = Router();

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

  const [sub] = await db
    .update(subscriptionsTable)
    .set({ plan: plan as any, status: status as any, endDate, updatedAt: new Date() })
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

export default router;
