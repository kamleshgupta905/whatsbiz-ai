import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  type WASocket,
} from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import { db, whatsappSessionsTable, knowledgeBaseTable, contactsTable, conversationsTable, messagesTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import qrcode from "qrcode";
import { mkdir } from "fs/promises";
import { join } from "path";
import { exec } from "child_process";
import { promisify } from "util";
import pino from "pino";
import OpenAI from "openai";

const execAsync = promisify(exec);

const silentLogger = pino({ level: "silent" });

const openai = new OpenAI({
  baseURL: "https://integrate.api.nvidia.com/v1",
  apiKey: process.env.NVIDIA_API_KEY,
});

interface SessionState {
  socket: WASocket | null;
  qrBase64: string | null;
  status: "connecting" | "qr_ready" | "connected" | "disconnected";
  phoneNumber: string | null;
  retryCount: number;
  isAIEnabled: boolean;
}

interface KBCache {
  systemPrompt: string;
  cachedAt: number;
}

const sessions = new Map<string, SessionState>();
const healthTimers = new Map<string, ReturnType<typeof setInterval>>();
const kbCache = new Map<string, KBCache>();
const KB_TTL_MS = 120_000; // 2 minutes

function getAuthDir(userId: string): string {
  return join("/tmp", "wa-auth", userId);
}

function clearHealthTimer(userId: string) {
  const t = healthTimers.get(userId);
  if (t) { clearInterval(t); healthTimers.delete(userId); }
}

async function pingSocket(sock: WASocket): Promise<boolean> {
  try {
    await Promise.race([
      sock.sendPresenceUpdate("available"),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("ping_timeout")), 8_000)
      ),
    ]);
    return true;
  } catch {
    return false;
  }
}

function startHealthCheck(userId: string, state: SessionState) {
  clearHealthTimer(userId);
  const timer = setInterval(async () => {
    if (state.status !== "connected") { clearHealthTimer(userId); return; }
    if (!state.socket) { clearHealthTimer(userId); return; }

    const alive = await pingSocket(state.socket);

    if (!alive) {
      state.status = "disconnected";
      state.socket = null;
      state.qrBase64 = null;
      state.phoneNumber = null;
      clearHealthTimer(userId);
      await db.update(whatsappSessionsTable)
        .set({ status: "disconnected", phoneNumber: null, sessionData: null, qrCode: null, lastDisconnect: new Date(), updatedAt: new Date() })
        .where(eq(whatsappSessionsTable.userId, userId));
    }
  }, 20_000);
  healthTimers.set(userId, timer);
}

export function getSession(userId: string): SessionState | undefined {
  return sessions.get(userId);
}

export async function startSession(userId: string, forceNew = false): Promise<void> {
  const existing = sessions.get(userId);
  if (existing?.status === "connected") return;
  if (existing?.socket) {
    try { existing.socket.end(undefined); } catch {}
  }

  const authDir = getAuthDir(userId);

  // forceNew = true means user explicitly clicked "Connect" — wipe stale creds so fresh QR generates
  if (forceNew) {
    try { await execAsync(`rm -rf "${authDir}"`); } catch {}
  }
  await mkdir(authDir, { recursive: true });

  // Load AI-enabled flag from DB once; cached in memory thereafter
  const [dbSession] = await db.select({ isAIEnabled: whatsappSessionsTable.isAIEnabled })
    .from(whatsappSessionsTable).where(eq(whatsappSessionsTable.userId, userId));

  const state: SessionState = {
    socket: null,
    qrBase64: null,
    status: "connecting",
    phoneNumber: null,
    retryCount: 0,
    isAIEnabled: dbSession?.isAIEnabled ?? false,
  };
  sessions.set(userId, state);

  await createSocket(userId, state, authDir);
}

async function getSystemPrompt(userId: string): Promise<string> {
  const cached = kbCache.get(userId);
  if (cached && Date.now() - cached.cachedAt < KB_TTL_MS) {
    return cached.systemPrompt;
  }

  const [kb] = await db.select().from(knowledgeBaseTable).where(eq(knowledgeBaseTable.userId, userId));
  let systemPrompt = kb?.systemPrompt ?? "You are a helpful WhatsApp business assistant. Reply in the same language the customer uses. Be concise and friendly.";

  if (kb) {
    const parts: string[] = [systemPrompt];
    if (kb.rawContent) parts.push(`\n\nBusiness Info:\n${kb.rawContent}`);
    if (kb.faqs && kb.faqs.length > 0) {
      parts.push("\n\nFAQs:");
      kb.faqs.forEach(f => parts.push(`Q: ${f.question}\nA: ${f.answer}`));
    }
    if (kb.products && kb.products.length > 0) {
      parts.push("\n\nProducts/Services:");
      kb.products.forEach(p => parts.push(`- ${p.name}: ₹${p.price} — ${p.description ?? ""} (${p.inStock ? "In Stock" : "Out of Stock"})`));
    }
    if (kb.businessHours) parts.push(`\n\nBusiness Hours: ${JSON.stringify(kb.businessHours)}`);
    parts.push(`\n\nTone: ${kb.tone}. Personality: ${kb.personality}.`);
    parts.push("\n\nAlways reply in the same language the customer is using. Keep replies short and helpful. Do NOT use markdown, just plain text.");
    systemPrompt = parts.join("\n");
  }

  kbCache.set(userId, { systemPrompt, cachedAt: Date.now() });
  return systemPrompt;
}

export function invalidateKBCache(userId: string): void {
  kbCache.delete(userId);
}

async function generateAIReply(userId: string, customerPhone: string, incomingText: string): Promise<string | null> {
  try {
    // Fetch system prompt (cached) and contact history in parallel
    const [systemPrompt, [contact]] = await Promise.all([
      getSystemPrompt(userId),
      db.select().from(contactsTable).where(and(eq(contactsTable.userId, userId), eq(contactsTable.phone, customerPhone))),
    ]);

    // Fetch last 4 messages for context (smaller = faster AI)
    const history: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];
    if (contact) {
      const [conv] = await db.select().from(conversationsTable)
        .where(and(eq(conversationsTable.userId, userId), eq(conversationsTable.contactId, contact.id)));
      if (conv) {
        const recent = await db.select().from(messagesTable)
          .where(eq(messagesTable.conversationId, conv.id));
        recent.slice(-4).forEach(m => {
          history.push({ role: m.sender === "CUSTOMER" ? "user" : "assistant", content: m.content });
        });
      }
    }

    const response = await openai.chat.completions.create({
      model: "meta/llama-3.1-8b-instruct",
      max_tokens: 150,
      messages: [
        { role: "system", content: systemPrompt },
        ...history,
        { role: "user", content: incomingText },
      ],
    });

    return response.choices[0]?.message?.content?.trim() ?? null;
  } catch {
    return null;
  }
}

async function saveMessageToDB(
  userId: string,
  customerPhone: string,
  customerName: string | null,
  incomingText: string,
  aiReply: string,
  whatsappMsgId: string | null,
): Promise<void> {
  try {
    let contactId: string;
    const [existingContact] = await db.select().from(contactsTable)
      .where(and(eq(contactsTable.userId, userId), eq(contactsTable.phone, customerPhone)));

    if (existingContact) {
      contactId = existingContact.id;
      await db.update(contactsTable)
        .set({ totalMessages: (existingContact.totalMessages ?? 0) + 2, lastMessageAt: new Date(), updatedAt: new Date(), name: customerName ?? existingContact.name })
        .where(eq(contactsTable.id, contactId));
    } else {
      const [newContact] = await db.insert(contactsTable).values({
        userId,
        phone: customerPhone,
        name: customerName,
        totalMessages: 2,
        lastMessageAt: new Date(),
      }).returning();
      contactId = newContact.id;
    }

    let conversationId: string;
    const [existingConv] = await db.select().from(conversationsTable)
      .where(and(eq(conversationsTable.userId, userId), eq(conversationsTable.contactId, contactId)));

    if (existingConv) {
      conversationId = existingConv.id;
      await db.update(conversationsTable)
        .set({ lastMessage: aiReply, lastMessageAt: new Date(), unreadCount: existingConv.unreadCount + 1, updatedAt: new Date() })
        .where(eq(conversationsTable.id, conversationId));
    } else {
      const [newConv] = await db.insert(conversationsTable).values({
        userId,
        contactId,
        customerPhone,
        customerName,
        status: "open",
        isAIEnabled: true,
        lastMessage: aiReply,
        lastMessageAt: new Date(),
        unreadCount: 1,
      }).returning();
      conversationId = newConv.id;
    }

    await db.insert(messagesTable).values([
      {
        conversationId,
        sender: "CUSTOMER",
        content: incomingText,
        messageType: "TEXT",
        whatsappMsgId,
      },
      {
        conversationId,
        sender: "AI",
        content: aiReply,
        messageType: "TEXT",
        aiModel: "llama-3.1-8b",
      },
    ]);
  } catch {}
}

async function createSocket(userId: string, state: SessionState, authDir: string): Promise<void> {
  const { state: authState, saveCreds } = await useMultiFileAuthState(authDir);

  // Fetch latest Baileys version with 8s timeout; fall back to known-good version
  let version: [number, number, number] = [2, 3000, 1015901307];
  try {
    const versionResult = await Promise.race([
      fetchLatestBaileysVersion(),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error("version_timeout")), 8000)),
    ]);
    version = versionResult.version;
  } catch {
    // use fallback version above
  }

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

  sock.ev.on("connection.update", (update) => {
    void (async () => {
      try {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
          try {
            const qrBase64 = await qrcode.toDataURL(qr, { width: 300, margin: 2 });
            state.qrBase64 = qrBase64;
            state.status = "qr_ready";
            console.log(`[WA] QR generated for user ${userId}`);
            await db.update(whatsappSessionsTable)
              .set({ status: "qr_ready", qrCode: qrBase64, updatedAt: new Date() })
              .where(eq(whatsappSessionsTable.userId, userId));
          } catch (err) {
            console.error(`[WA] QR generation failed for user ${userId}:`, err);
          }
        }

        if (connection === "close") {
          clearHealthTimer(userId);
          const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
          console.log(`[WA] Connection closed for user ${userId}, statusCode=${statusCode}`);
          const loggedOut = statusCode === DisconnectReason.loggedOut
            || statusCode === DisconnectReason.multideviceMismatch
            || statusCode === 440;
          const shouldReconnect = !loggedOut && state.retryCount < 3;

          if (loggedOut) {
            console.log(`[WA] Logged out for user ${userId}, clearing creds for fresh QR`);
            state.retryCount = 0;
            state.status = "connecting";
            state.socket = null;
            state.qrBase64 = null;
            state.phoneNumber = null;
            try { await execAsync(`rm -rf "${authDir}"`); } catch {}
            await mkdir(authDir, { recursive: true });
            await createSocket(userId, state, authDir);
          } else if (shouldReconnect) {
            state.retryCount++;
            state.status = "connecting";
            state.phoneNumber = null;
            await createSocket(userId, state, authDir);
          } else {
            state.status = "disconnected";
            state.socket = null;
            state.qrBase64 = null;
            state.phoneNumber = null;
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
          startHealthCheck(userId, state);
          await db.update(whatsappSessionsTable)
            .set({ status: "connected", phoneNumber: phone ? `+${phone}` : null, qrCode: null, lastConnected: new Date(), updatedAt: new Date() })
            .where(eq(whatsappSessionsTable.userId, userId));
        }
      } catch (err) {
        console.error(`[WA] connection.update handler error for user ${userId}:`, err);
      }
    })();
  });

  sock.ev.on("messages.upsert", async ({ messages, type }) => {
    if (type !== "notify") return;

    for (const msg of messages) {
      if (msg.key.fromMe) continue;
      if (!msg.message) continue;

      const remoteJid = msg.key.remoteJid;
      if (!remoteJid || remoteJid.endsWith("@g.us")) continue;

      const incomingText =
        msg.message.conversation ??
        msg.message.extendedTextMessage?.text ??
        null;

      if (!incomingText) continue;

      // Format phone number with + prefix (WhatsApp JID gives raw digits e.g. 919876543210)
      const rawPhone = remoteJid.split("@")[0];
      const customerPhone = rawPhone.startsWith("+") ? rawPhone : `+${rawPhone}`;
      const pushName = msg.pushName ?? null;

      // Fire-and-forget read receipt — don't block AI reply
      sock.readMessages([msg.key]).catch(() => {});

      // Use in-memory flag — no DB round-trip per message
      if (!state.isAIEnabled) continue;

      const aiReply = await generateAIReply(userId, customerPhone, incomingText);
      if (!aiReply) continue;

      try {
        await sock.sendMessage(remoteJid, { text: aiReply });
        // Fire-and-forget — don't block the reply on DB writes
        saveMessageToDB(userId, customerPhone, pushName, incomingText, aiReply, msg.key.id ?? null).catch(() => {});
      } catch {}
    }
  });
}

export function updateAIEnabled(userId: string, enabled: boolean): void {
  const state = sessions.get(userId);
  if (state) state.isAIEnabled = enabled;
}

export async function sendBroadcastMessages(
  userId: string,
  phones: string[],
  message: string,
  onProgress?: (sent: number, failed: number) => void
): Promise<{ sent: number; failed: number }> {
  const state = sessions.get(userId);
  if (!state?.socket || state.status !== "connected") {
    throw new Error("WhatsApp not connected");
  }
  const sock = state.socket;
  let sent = 0;
  let failed = 0;

  for (const phone of phones) {
    try {
      const jid = phone.replace(/[^0-9]/g, "") + "@s.whatsapp.net";
      await sock.sendMessage(jid, { text: message });
      sent++;
    } catch {
      failed++;
    }
    // Small delay to avoid rate-limit
    await new Promise((r) => setTimeout(r, 500));
    onProgress?.(sent, failed);
  }
  return { sent, failed };
}

export async function disconnectSession(userId: string): Promise<void> {
  clearHealthTimer(userId);
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
