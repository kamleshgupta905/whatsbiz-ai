import { pgTable, text, integer, numeric, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const planEnum = pgEnum("plan", ["TRIAL", "STARTER", "PRO", "BUSINESS"]);
export const subStatusEnum = pgEnum("sub_status", ["TRIAL", "ACTIVE", "EXPIRED", "CANCELLED", "GRACE_PERIOD"]);
export const payStatusEnum = pgEnum("pay_status", ["PENDING", "AWAITING_VERIFICATION", "VERIFIED", "COMPLETED", "FAILED", "REFUNDED", "CANCELLED"]);

export const subscriptionsTable = pgTable("subscriptions", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }).unique(),
  plan: planEnum("plan").default("TRIAL").notNull(),
  status: subStatusEnum("status").default("TRIAL").notNull(),
  startDate: timestamp("start_date").defaultNow().notNull(),
  endDate: timestamp("end_date").notNull(),
  trialEndDate: timestamp("trial_end_date"),
  messagesLimit: integer("messages_limit").default(100).notNull(),
  messagesUsed: integer("messages_used").default(0).notNull(),
  scrapeSessionsUsed: integer("scrape_sessions_used").default(0).notNull(),
  whatsappLimit: integer("whatsapp_limit").default(1).notNull(),
  autoRenew: boolean("auto_renew").default(false).notNull(),
  cancelledAt: timestamp("cancelled_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const paymentsTable = pgTable("payments", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  amount: integer("amount").notNull(),
  currency: text("currency").default("INR").notNull(),
  plan: planEnum("plan").notNull(),
  duration: integer("duration").default(30).notNull(),
  status: payStatusEnum("status").default("PENDING").notNull(),
  paymentMethod: text("payment_method").default("UPI").notNull(),
  upiId: text("upi_id").default("9315515700-2@ibl").notNull(),
  utr: text("utr"),
  txnNote: text("txn_note"),
  paidAt: timestamp("paid_at"),
  verifiedAt: timestamp("verified_at"),
  verifiedBy: text("verified_by"),
  invoiceNumber: text("invoice_number").unique(),
  invoiceUrl: text("invoice_url"),
  refundStatus: text("refund_status"),
  refundAmount: numeric("refund_amount", { precision: 10, scale: 2 }),
  refundReason: text("refund_reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertSubscriptionSchema = createInsertSchema(subscriptionsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPaymentSchema = createInsertSchema(paymentsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
export type Subscription = typeof subscriptionsTable.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Payment = typeof paymentsTable.$inferSelect;
