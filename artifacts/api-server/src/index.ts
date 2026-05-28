import "./lib/load-env.js";
import app from "./app";
import { logger } from "./lib/logger";
import { db, usersTable, subscriptionsTable, knowledgeBaseTable, whatsappSessionsTable } from "@workspace/db";
import { eq, ne } from "drizzle-orm";
import { startSession } from "./lib/whatsapp-manager";
import { startBroadcastScheduler } from "./routes/broadcasts";
import { startLinkedInScheduler } from "./lib/social-automation.js";
import { readdir } from "fs/promises";
import { join } from "path";
import { hashPassword } from "./lib/auth";

function getAuthDir(userId: string): string {
  return join(process.cwd(), "..", "..", ".wa-auth", userId);
}

async function hasCredFiles(userId: string): Promise<boolean> {
  try {
    const files = await readdir(getAuthDir(userId));
    return files.length > 0;
  } catch {
    return false;
  }
}

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

async function ensureAdminAccount() {
  const email = process.env.ADMIN_EMAIL ?? "kamleshg9569@gmail.com";
  const password = process.env.ADMIN_PASSWORD ?? "Krishna@905";
  const phone = process.env.ADMIN_PHONE ?? "+919315515700";
  const businessName = process.env.ADMIN_BUSINESS_NAME ?? "WhatsBiz AI Admin";

  const [existing] = await db.select().from(usersTable).where(eq(usersTable.email, email));
  let userId = existing?.id;

  if (existing) {
    await db.update(usersTable)
      .set({ role: "ADMIN", isActive: true, passwordHash: hashPassword(password), updatedAt: new Date() })
      .where(eq(usersTable.id, existing.id));
  } else {
    const [admin] = await db.insert(usersTable).values({
      name: "Kamlesh Gupta",
      email,
      phone,
      passwordHash: hashPassword(password),
      businessName,
      role: "ADMIN",
      onboardingStep: 5,
      onboardingComplete: true,
      isVerified: true,
      isActive: true,
    }).returning();
    userId = admin.id;
  }

  if (!userId) return;

  const [sub] = await db.select().from(subscriptionsTable).where(eq(subscriptionsTable.userId, userId));
  if (!sub) {
    await db.insert(subscriptionsTable).values({
      userId,
      plan: "BUSINESS",
      status: "ACTIVE",
      endDate: new Date("2099-12-31"),
      messagesLimit: 10000,
      whatsappLimit: 5,
    });
  }

  const [kb] = await db.select().from(knowledgeBaseTable).where(eq(knowledgeBaseTable.userId, userId));
  if (!kb) {
    await db.insert(knowledgeBaseTable).values({ userId, tone: "friendly", personality: "helpful" });
  }

  const [wa] = await db.select().from(whatsappSessionsTable).where(eq(whatsappSessionsTable.userId, userId));
  if (!wa) {
    await db.insert(whatsappSessionsTable).values({ userId, status: "disconnected" });
  }
}

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");

  void ensureAdminAccount().catch((err) => {
    console.error("[Admin] Failed to ensure admin account:", err);
  });

  startBroadcastScheduler();
  startLinkedInScheduler();

  // Auto-reconnect users who were previously connected (only if cred files exist)
  void (async () => {
    try {
      const activeSessions = await db
        .select({ userId: whatsappSessionsTable.userId })
        .from(whatsappSessionsTable)
        .where(ne(whatsappSessionsTable.status, "disconnected"));

      for (const { userId } of activeSessions) {
        const hasCreds = await hasCredFiles(userId);
        if (!hasCreds) {
          console.log(`[WA] No saved creds for ${userId} — skipping auto-reconnect (needs fresh QR)`);
          continue;
        }
        console.log(`[WA] Auto-reconnecting user ${userId} on startup`);
        startSession(userId, false).catch((err) => {
          console.error(`[WA] Auto-reconnect failed for ${userId}:`, err);
        });
      }
    } catch (err) {
      console.error("[WA] Auto-reconnect startup error:", err);
    }
  })();
});
