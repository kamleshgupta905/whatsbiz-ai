import { db, subscriptionsTable, usersTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";

export type Plan = "TRIAL" | "STARTER" | "PRO" | "BUSINESS";

export interface PlanLimits {
  plan: Plan;
  isPremium: boolean;
  isAdmin: boolean;
  broadcastLimit: number;    // max recipients per broadcast
  scrapeSessionsMax: number; // max total scrape sessions (2 for free, unlimited for paid/admin)
  scrapeSessionsUsed: number;
}

const FREE_PLANS: Plan[] = ["TRIAL"];

export async function getPlanLimits(userId: string): Promise<PlanLimits> {
  const [[user], [sub]] = await Promise.all([
    db.select({ role: usersTable.role }).from(usersTable).where(eq(usersTable.id, userId)),
    db.select().from(subscriptionsTable).where(eq(subscriptionsTable.userId, userId)),
  ]);

  const isAdmin = user?.role === "ADMIN";
  const plan: Plan = (sub?.plan as Plan) ?? "TRIAL";
  const isPremium = isAdmin || !FREE_PLANS.includes(plan);
  const scrapeSessionsUsed = sub?.scrapeSessionsUsed ?? 0;

  // Admins get fully unlimited access — no caps at all
  if (isAdmin) {
    return {
      plan,
      isPremium: true,
      isAdmin: true,
      broadcastLimit: 999999,
      scrapeSessionsMax: Infinity,
      scrapeSessionsUsed,
    };
  }

  return {
    plan,
    isPremium,
    isAdmin: false,
    broadcastLimit: isPremium ? 50 : 25,
    scrapeSessionsMax: isPremium ? Infinity : 2,
    scrapeSessionsUsed,
  };
}

export async function incrementScrapeSession(userId: string) {
  await db
    .update(subscriptionsTable)
    .set({
      scrapeSessionsUsed: sql`${subscriptionsTable.scrapeSessionsUsed} + 1`,
      updatedAt: new Date(),
    })
    .where(eq(subscriptionsTable.userId, userId));
}
