import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const adminEmailsTable = pgTable("sicariostore_admin_emails", {
  email: text("email").primaryKey(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type AdminEmail = typeof adminEmailsTable.$inferSelect;
