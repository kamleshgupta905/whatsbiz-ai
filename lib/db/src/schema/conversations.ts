import { pgTable, text, boolean, integer, timestamp, jsonb, pgEnum, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { contactsTable } from "./contacts";

export const convStatusEnum = pgEnum("conv_status", ["open", "pending", "resolved", "archived"]);
export const msgSenderEnum = pgEnum("msg_sender", ["CUSTOMER", "AI", "OWNER", "SYSTEM"]);
export const msgTypeEnum = pgEnum("msg_type", ["TEXT", "IMAGE", "VIDEO", "AUDIO", "DOCUMENT", "LOCATION", "CONTACT", "STICKER"]);

export const conversationsTable = pgTable("conversations", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  contactId: text("contact_id").notNull().references(() => contactsTable.id, { onDelete: "cascade" }),
  customerPhone: text("customer_phone").notNull(),
  customerName: text("customer_name"),
  status: convStatusEnum("status").default("open").notNull(),
  isAIEnabled: boolean("is_ai_enabled").default(true).notNull(),
  isPinned: boolean("is_pinned").default(false).notNull(),
  isArchived: boolean("is_archived").default(false).notNull(),
  tags: jsonb("tags").$type<string[]>().default([]),
  notes: text("notes"),
  unreadCount: integer("unread_count").default(0).notNull(),
  lastMessageAt: timestamp("last_message_at").defaultNow().notNull(),
  lastMessage: text("last_message"),
  sentiment: text("sentiment"),
  intent: text("intent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const messagesTable = pgTable("messages", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  conversationId: text("conversation_id").notNull().references(() => conversationsTable.id, { onDelete: "cascade" }),
  sender: msgSenderEnum("sender").notNull(),
  content: text("content").notNull(),
  messageType: msgTypeEnum("message_type").default("TEXT").notNull(),
  mediaUrl: text("media_url"),
  isRead: boolean("is_read").default(false).notNull(),
  isDelivered: boolean("is_delivered").default(false).notNull(),
  aiConfidence: numeric("ai_confidence", { precision: 4, scale: 3 }),
  aiTokensUsed: integer("ai_tokens_used"),
  aiModel: text("ai_model"),
  responseTime: integer("response_time"),
  whatsappMsgId: text("whatsapp_msg_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertConversationSchema = createInsertSchema(conversationsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMessageSchema = createInsertSchema(messagesTable).omit({
  id: true,
  createdAt: true,
});

export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Conversation = typeof conversationsTable.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messagesTable.$inferSelect;
