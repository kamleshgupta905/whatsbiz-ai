import { pgTable, text, boolean, timestamp, jsonb, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const waStatusEnum = pgEnum("wa_status", ["disconnected", "connecting", "qr_ready", "connected", "authenticated", "error"]);

export const whatsappSessionsTable = pgTable("whatsapp_sessions", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }).unique(),
  phoneNumber: text("phone_number"),
  sessionData: text("session_data"),
  qrCode: text("qr_code"),
  status: waStatusEnum("status").default("disconnected").notNull(),
  lastConnected: timestamp("last_connected"),
  lastDisconnect: timestamp("last_disconnect"),
  isAIEnabled: boolean("is_ai_enabled").default(true).notNull(),
  workingHours: jsonb("working_hours").$type<Record<string, string>>(),
  awayMessage: text("away_message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertWhatsappSessionSchema = createInsertSchema(whatsappSessionsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertWhatsappSession = z.infer<typeof insertWhatsappSessionSchema>;
export type WhatsappSession = typeof whatsappSessionsTable.$inferSelect;
