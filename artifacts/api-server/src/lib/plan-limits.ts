import { db, subscriptionsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";

export type Plan = "TRIAL" | "STARTER" | "PRO" | "BUSINESS";

export interface PlanLimits {
  plan: Plan;
  isPremium: boolean;
  broadcastLimit: number;    // max recipients per broadcast
  scrapeSessionsMax: number; // max total scrape sessions (2 for free, unlimited for paid)
  scrapeSessionsUsed: number;
}

const FREE_PLANS: Plan[] = ["TRIAL"];

export async function getPlanLimits(userId: string): Promise<PlanLimits> {
  const [sub] = await db
    .select()
    .from(subscriptionsTable)
    .where(eq(subscriptionsTable.userId, userId));

  const plan: Plan = (sub?.plan as Plan) ?? "TRIAL";
  const isPremium = !FREE_PLANS.includes(plan);
  const scrapeSessionsUsed = sub?.scrapeSessionsUsed ?? 0;

  return {
    plan,
    isPremium,
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
