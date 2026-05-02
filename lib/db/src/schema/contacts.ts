import { pgTable, text, integer, timestamp, jsonb, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const contactsTable = pgTable("contacts", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  phone: text("phone").notNull(),
  name: text("name"),
  email: text("email"),
  tags: jsonb("tags").$type<string[]>().default([]),
  notes: text("notes"),
  customFields: jsonb("custom_fields").$type<Record<string, string>>(),
  totalMessages: integer("total_messages").default(0).notNull(),
  lastMessageAt: timestamp("last_message_at"),
  firstContactAt: timestamp("first_contact_at").defaultNow().notNull(),
  totalOrders: integer("total_orders").default(0).notNull(),
  totalRevenue: numeric("total_revenue", { precision: 10, scale: 2 }).default("0").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertContactSchema = createInsertSchema(contactsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertContact = z.infer<typeof insertContactSchema>;
export type Contact = typeof contactsTable.$inferSelect;
