import { getDb } from ".";
import { auditEvents } from "./schema";

export async function writeAuditEvent(input: { ownerEmail: string; actorEmail?: string; action: "created" | "updated" | "uploaded" | "opened"; entityType: "health_record" | "document"; entityId: string; entityLabel: string }) {
  const db = await getDb();
  await db.insert(auditEvents).values({ id: crypto.randomUUID(), ownerEmail: input.ownerEmail, actorEmail: input.actorEmail ?? input.ownerEmail, action: input.action, entityType: input.entityType, entityId: input.entityId, entityLabel: input.entityLabel.slice(0, 180) });
}
