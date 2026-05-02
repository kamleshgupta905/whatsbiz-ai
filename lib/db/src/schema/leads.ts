import { pgTable, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const leadsTable = pgTable("leads", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  name: text("name"),
  phone: text("phone"),
  website: text("website"),
  address: text("address"),
  rating: text("rating"),
  reviews: integer("reviews"),
  category: text("category"),
  thumbnailUrl: text("thumbnail_url"),
  source: text("source").notNull(),
  query: text("query").notNull(),
  location: text("location"),
  imported: boolean("imported").default(false).notNull(),
  importedContactId: text("imported_contact_id"),
  importedAt: timestamp("imported_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Lead = typeof leadsTable.$inferSelect;
