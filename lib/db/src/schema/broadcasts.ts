import { pgTable, text, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const broadcastsTable = pgTable("broadcasts", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  message: text("message").notNull(),
  mediaUrl: text("media_url"),
  recipientType: text("recipient_type").notNull(),
  recipients: jsonb("recipients").$type<string[]>().default([]),
  recipientCount: integer("recipient_count").default(0).notNull(),
  status: text("status").default("draft").notNull(),
  scheduledAt: timestamp("scheduled_at"),
  sentAt: timestamp("sent_at"),
  deliveredCount: integer("delivered_count").default(0).notNull(),
  readCount: integer("read_count").default(0).notNull(),
  repliedCount: integer("replied_count").default(0).notNull(),
  failedCount: integer("failed_count").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertBroadcastSchema = createInsertSchema(broadcastsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertBroadcast = z.infer<typeof insertBroadcastSchema>;
export type Broadcast = typeof broadcastsTable.$inferSelect;
