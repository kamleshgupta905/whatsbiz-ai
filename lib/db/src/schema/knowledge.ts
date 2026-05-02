import { pgTable, text, jsonb, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const knowledgeBaseTable = pgTable("knowledge_base", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }).unique(),
  rawContent: text("raw_content"),
  systemPrompt: text("system_prompt"),
  customInstructions: text("custom_instructions"),
  faqs: jsonb("faqs").$type<Array<{ id: string; question: string; answer: string }>>(),
  products: jsonb("products").$type<Array<{ id: string; name: string; price: number; description?: string; imageUrl?: string; inStock: boolean }>>(),
  businessHours: jsonb("business_hours").$type<Record<string, string>>(),
  holidays: jsonb("holidays").$type<string[]>(),
  tone: text("tone").default("friendly").notNull(),
  personality: text("personality").default("helpful").notNull(),
  uploadedFiles: jsonb("uploaded_files").$type<Array<{ name: string; url: string; type: string; size: number }>>(),
  promptVersion: integer("prompt_version").default(1).notNull(),
  promptHistory: jsonb("prompt_history").$type<Array<{ version: number; prompt: string; date: string }>>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertKnowledgeBaseSchema = createInsertSchema(knowledgeBaseTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertKnowledgeBase = z.infer<typeof insertKnowledgeBaseSchema>;
export type KnowledgeBase = typeof knowledgeBaseTable.$inferSelect;
