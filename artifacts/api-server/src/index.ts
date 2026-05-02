import app from "./app";
import { logger } from "./lib/logger";
import { db, whatsappSessionsTable } from "@workspace/db";
import { eq, ne } from "drizzle-orm";
import { startSession } from "./lib/whatsapp-manager";

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

  // Auto-reconnect users who were previously connected/connecting
  void (async () => {
    try {
      const activeSessions = await db
        .select({ userId: whatsappSessionsTable.userId })
        .from(whatsappSessionsTable)
        .where(ne(whatsappSessionsTable.status, "disconnected"));

      for (const { userId } of activeSessions) {
        console.log(`[WA] Auto-reconnecting user ${userId} on startup`);
        // forceNew=false — use saved credentials, no QR needed
        startSession(userId, false).catch((err) => {
          console.error(`[WA] Auto-reconnect failed for ${userId}:`, err);
        });
      }
    } catch (err) {
      console.error("[WA] Auto-reconnect startup error:", err);
    }
  })();
});
