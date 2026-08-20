import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  primaryEmail: text("primary_email").notNull(),
  displayName: text("display_name"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [uniqueIndex("users_primary_email_idx").on(table.primaryEmail)]);

export const authIdentities = sqliteTable("auth_identities", {
  id: text("id").primaryKey(), userId: text("user_id").notNull(), provider: text("provider").notNull(), providerSubject: text("provider_subject").notNull(), emailAtLink: text("email_at_link").notNull(), createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [uniqueIndex("auth_identities_provider_subject_idx").on(table.provider, table.providerSubject), index("auth_identities_user_idx").on(table.userId)]);

export const healthRecords = sqliteTable("health_records", {
  id: text("id").primaryKey(),
  ownerUserId: text("owner_user_id"),
  ownerEmail: text("owner_email").notNull(),
  type: text("type").notNull(),
  title: text("title").notNull(),
  recordDate: text("record_date").notNull(),
  provider: text("provider").notNull().default(""),
  notes: text("notes").notNull().default(""),
  source: text("source").notNull().default("Entered by you"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  deletedAt: text("deleted_at"),
}, (table) => [
  index("health_records_owner_user_date_idx").on(table.ownerUserId, table.recordDate),
]);

export const healthRecordVersions = sqliteTable("health_record_versions", {
  id: text("id").primaryKey(), recordId: text("record_id").notNull(), ownerUserId: text("owner_user_id"), ownerEmail: text("owner_email").notNull(), versionNumber: integer("version_number").notNull(), type: text("type").notNull(), title: text("title").notNull(), recordDate: text("record_date").notNull(), provider: text("provider").notNull(), notes: text("notes").notNull(), reason: text("reason").notNull(), createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [index("record_versions_owner_user_record_idx").on(table.ownerUserId, table.recordId)]);

export const documents = sqliteTable("documents", {
  id: text("id").primaryKey(),
  ownerUserId: text("owner_user_id"),
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
  index("documents_owner_user_uploaded_idx").on(table.ownerUserId, table.uploadedAt),
]);

export const auditEvents = sqliteTable("audit_events", {
  id: text("id").primaryKey(),
  ownerUserId: text("owner_user_id"),
  ownerEmail: text("owner_email").notNull(),
  actorEmail: text("actor_email").notNull(),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id").notNull(),
  entityLabel: text("entity_label").notNull(),
  occurredAt: text("occurred_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("audit_events_owner_user_occurred_idx").on(table.ownerUserId, table.occurredAt),
]);

export const shareGrants = sqliteTable("share_grants", {
  id: text("id").primaryKey(),
  ownerUserId: text("owner_user_id"),
  ownerEmail: text("owner_email").notNull(),
  tokenHash: text("token_hash").notNull().unique(),
  label: text("label").notNull(),
  recordIds: text("record_ids").notNull(),
  expiresAt: text("expires_at").notNull(),
  revokedAt: text("revoked_at"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  lastAccessedAt: text("last_accessed_at"),
  accessCount: integer("access_count").notNull().default(0),
}, (table) => [
  index("share_grants_owner_user_created_idx").on(table.ownerUserId, table.createdAt),
  index("share_grants_token_hash_idx").on(table.tokenHash),
]);

export const appointments = sqliteTable("appointments", {
  id: text("id").primaryKey(),
  ownerUserId: text("owner_user_id").notNull(),
  ownerEmail: text("owner_email").notNull(),
  title: text("title").notNull(),
  healthArea: text("health_area").notNull(),
  provider: text("provider").notNull().default(""),
  facility: text("facility").notNull().default(""),
  startsAt: text("starts_at").notNull(),
  durationMinutes: integer("duration_minutes").notNull().default(30),
  location: text("location").notNull().default(""),
  preparation: text("preparation").notNull().default(""),
  status: text("status").notNull().default("scheduled"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("appointments_owner_start_idx").on(table.ownerUserId, table.startsAt),
]);

export const healthProfiles = sqliteTable("health_profiles", {
  id: text("id").primaryKey(),
  ownerUserId: text("owner_user_id").notNull(),
  ownerEmail: text("owner_email").notNull(),
  allergies: text("allergies").notNull().default("[]"),
  medications: text("medications").notNull().default("[]"),
  conditions: text("conditions").notNull().default("[]"),
  bloodType: text("blood_type").notNull().default(""),
  primaryProvider: text("primary_provider").notNull().default(""),
  emergencyName: text("emergency_name").notNull().default(""),
  emergencyRelationship: text("emergency_relationship").notNull().default(""),
  emergencyPhone: text("emergency_phone").notNull().default(""),
  reviewedAt: text("reviewed_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [uniqueIndex("health_profiles_owner_idx").on(table.ownerUserId)]);

export const deletionRequests = sqliteTable("deletion_requests", {
  id: text("id").primaryKey(),
  ownerUserId: text("owner_user_id").notNull(),
  ownerEmail: text("owner_email").notNull(),
  requestedAt: text("requested_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  scheduledFor: text("scheduled_for").notNull(),
  cancelledAt: text("cancelled_at"),
  completedAt: text("completed_at"),
}, (table) => [index("deletion_requests_owner_idx").on(table.ownerUserId, table.requestedAt)]);

export const medications = sqliteTable("medications", {
  id: text("id").primaryKey(),
  ownerUserId: text("owner_user_id").notNull(),
  ownerEmail: text("owner_email").notNull(),
  name: text("name").notNull(),
  dosage: text("dosage").notNull().default(""),
  frequency: text("frequency").notNull().default(""),
  instructions: text("instructions").notNull().default(""),
  prescribingProvider: text("prescribing_provider").notNull().default(""),
  startDate: text("start_date").notNull().default(""),
  endDate: text("end_date").notNull().default(""),
  refillDate: text("refill_date").notNull().default(""),
  pharmacy: text("pharmacy").notNull().default(""),
  status: text("status").notNull().default("active"),
  notes: text("notes").notNull().default(""),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [index("medications_owner_status_idx").on(table.ownerUserId, table.status)]);

export const clinicalFacts = sqliteTable("clinical_facts", {
  id: text("id").primaryKey(), ownerUserId: text("owner_user_id").notNull(), ownerEmail: text("owner_email").notNull(),
  kind: text("kind").notNull(), name: text("name").notNull(), severity: text("severity").notNull().default("unknown"),
  reaction: text("reaction").notNull().default(""), onsetDate: text("onset_date").notNull().default(""),
  status: text("status").notNull().default("active"), confirmingProvider: text("confirming_provider").notNull().default(""),
  notes: text("notes").notNull().default(""), createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`), updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, table => [index("clinical_facts_owner_kind_idx").on(table.ownerUserId,table.kind)]);
