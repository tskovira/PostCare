import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const healthRecords = sqliteTable("health_records", {
  id: text("id").primaryKey(),
  ownerEmail: text("owner_email").notNull(),
  type: text("type").notNull(),
  title: text("title").notNull(),
  recordDate: text("record_date").notNull(),
  provider: text("provider").notNull().default(""),
  notes: text("notes").notNull().default(""),
  source: text("source").notNull().default("Entered by you"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("health_records_owner_date_idx").on(table.ownerEmail, table.recordDate),
]);

export const documents = sqliteTable("documents", {
  id: text("id").primaryKey(),
  ownerEmail: text("owner_email").notNull(),
  objectKey: text("object_key").notNull().unique(),
  title: text("title").notNull(),
  fileName: text("file_name").notNull(),
  contentType: text("content_type").notNull(),
  sizeBytes: integer("size_bytes").notNull(),
  healthArea: text("health_area").notNull(),
  status: text("status").notNull().default("available"),
  uploadedAt: text("uploaded_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("documents_owner_uploaded_idx").on(table.ownerEmail, table.uploadedAt),
]);
