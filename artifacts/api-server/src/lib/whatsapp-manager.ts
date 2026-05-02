import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  type WASocket,
} from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import { db, whatsappSessionsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import qrcode from "qrcode";
import { mkdir } from "fs/promises";
import { join } from "path";
import pino from "pino";

const silentLogger = pino({ level: "silent" });

interface SessionState {
  socket: WASocket | null;
  qrBase64: string | null;
  status: "connecting" | "qr_ready" | "connected" | "disconnected";
  phoneNumber: string | null;
  retryCount: number;
}

const sessions = new Map<string, SessionState>();

function getAuthDir(userId: string): string {
  return join("/tmp", "wa-auth", userId);
}

export function getSession(userId: string): SessionState | undefined {
  return sessions.get(userId);
}

export async function startSession(userId: string): Promise<void> {
  const existing = sessions.get(userId);
  if (existing?.status === "connected") return;
  if (existing?.socket) {
    try { existing.socket.end(undefined); } catch {}
  }

  const authDir = getAuthDir(userId);
  await mkdir(authDir, { recursive: true });

  const state: SessionState = {
    socket: null,
    qrBase64: null,
    status: "connecting",
    phoneNumber: null,
    retryCount: 0,
  };
  sessions.set(userId, state);

  await createSocket(userId, state, authDir);
}

async function createSocket(userId: string, state: SessionState, authDir: string): Promise<void> {
  const { state: authState, saveCreds } = await useMultiFileAuthState(authDir);
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    logger: silentLogger,
    printQRInTerminal: false,
    auth: {
      creds: authState.creds,
      keys: makeCacheableSignalKeyStore(authState.keys, silentLogger),
    },
    generateHighQualityLinkPreview: false,
    syncFullHistory: false,
    markOnlineOnConnect: false,
    browser: ["WhatsBiz AI", "Chrome", "1.0.0"],
  });

  state.socket = sock;

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      try {
        const qrBase64 = await qrcode.toDataURL(qr);
        state.qrBase64 = qrBase64;
        state.status = "qr_ready";
        await db.update(whatsappSessionsTable)
          .set({ status: "qr_ready", qrCode: qrBase64, updatedAt: new Date() })
          .where(eq(whatsappSessionsTable.userId, userId));
      } catch {}
    }

    if (connection === "close") {
      const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut
        && statusCode !== DisconnectReason.multideviceMismatch
        && state.retryCount < 3;

      if (shouldReconnect) {
        state.retryCount++;
        state.status = "connecting";
        await createSocket(userId, state, authDir);
      } else {
        state.status = "disconnected";
        state.socket = null;
        state.qrBase64 = null;
        await db.update(whatsappSessionsTable)
          .set({ status: "disconnected", phoneNumber: null, sessionData: null, qrCode: null, lastDisconnect: new Date(), updatedAt: new Date() })
          .where(eq(whatsappSessionsTable.userId, userId));
      }
    }

    if (connection === "open") {
      const phone = sock.user?.id?.split(":")[0] ?? null;
      state.status = "connected";
      state.phoneNumber = phone;
      state.qrBase64 = null;
      state.retryCount = 0;
      await db.update(whatsappSessionsTable)
        .set({ status: "connected", phoneNumber: phone ? `+${phone}` : null, qrCode: null, lastConnected: new Date(), updatedAt: new Date() })
        .where(eq(whatsappSessionsTable.userId, userId));
    }
  });
}

export async function disconnectSession(userId: string): Promise<void> {
  const session = sessions.get(userId);
  if (session?.socket) {
    try { await session.socket.logout(); } catch {}
    try { session.socket.end(undefined); } catch {}
  }
  sessions.delete(userId);
  await db.update(whatsappSessionsTable)
    .set({ status: "disconnected", phoneNumber: null, sessionData: null, qrCode: null, lastDisconnect: new Date(), updatedAt: new Date() })
    .where(eq(whatsappSessionsTable.userId, userId));
}
