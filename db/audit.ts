import { getDb } from ".";
import { auditEvents } from "./schema";

export async function writeAuditEvent(input: { ownerUserId: string; ownerEmail: string; actorEmail?: string; action: "created" | "updated" | "uploaded" | "opened" | "exported" | "shared" | "accessed" | "revoked" | "archived" | "restored" | "cancelled" | "completed" | "requested"; entityType: "health_record" | "document" | "health_summary" | "share_link" | "appointment" | "health_profile" | "account_deletion" | "medication" | "clinical_fact"; entityId: string; entityLabel: string }) {
  const db = await getDb();
  await db.insert(auditEvents).values({ id: crypto.randomUUID(), ownerUserId: input.ownerUserId, ownerEmail: input.ownerEmail, actorEmail: input.actorEmail ?? input.ownerEmail, action: input.action, entityType: input.entityType, entityId: input.entityId, entityLabel: input.entityLabel.slice(0, 180) });
}
