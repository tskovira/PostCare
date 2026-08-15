import { desc, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { auditEvents } from "../../../db/schema";
import { getChatGPTUser } from "../../chatgpt-auth";

export async function GET() {
  try {
    const user = await getChatGPTUser();
    if (!user) return Response.json({ error: "Sign in is required." }, { status: 401 });
    const rows = await (await getDb()).select().from(auditEvents).where(eq(auditEvents.ownerEmail, user.email)).orderBy(desc(auditEvents.occurredAt)).limit(100);
    return Response.json({ events: rows.map((row) => ({ id: row.id, actor: row.actorEmail === user.email ? "You" : row.actorEmail, action: row.action, entityType: row.entityType, entityId: row.entityId, entityLabel: row.entityLabel, occurredAt: row.occurredAt })) });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to load access history." }, { status: 500 });
  }
}
