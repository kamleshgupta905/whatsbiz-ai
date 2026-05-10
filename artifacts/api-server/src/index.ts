import "./lib/load-env.js";
import app from "./app";
import { logger } from "./lib/logger";
import { db, whatsappSessionsTable } from "@workspace/db";
import { ne } from "drizzle-orm";
import { startSession } from "./lib/whatsapp-manager";
import { readdir } from "fs/promises";
import { join } from "path";

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

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");

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
