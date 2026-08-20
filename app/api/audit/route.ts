import { desc, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { auditEvents } from "../../../db/schema";
import { getCurrentUser } from "../../../db/current-user";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser(request);
    if (!user)
      return Response.json({ error: "Sign in is required." }, { status: 401 });
    const rows = await (
      await getDb()
    )
      .select()
      .from(auditEvents)
      .where(eq(auditEvents.ownerUserId, user.id))
      .orderBy(desc(auditEvents.occurredAt))
      .limit(100);
    return Response.json({
      events: rows.map((row) => ({
        id: row.id,
        actor: row.actorEmail === user.email ? "You" : row.actorEmail,
        action: row.action,
        entityType: row.entityType,
        entityId: row.entityId,
        entityLabel: row.entityLabel,
        occurredAt: row.occurredAt,
      })),
    });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to load access history.",
      },
      { status: 500 },
    );
  }
}
