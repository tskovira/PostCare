import { and, desc, eq, isNull } from "drizzle-orm";
import { getDb } from "../../../db";
import { deletionRequests } from "../../../db/schema";
import { getCurrentUser } from "../../../db/current-user";
import { writeAuditEvent } from "../../../db/audit";

export async function GET(request: Request) {
  try {
    const owner = await getCurrentUser(request);
    if (!owner) return Response.json({ error: "Sign in is required." }, { status: 401 });
    const [row] = await (await getDb()).select().from(deletionRequests).where(and(eq(deletionRequests.ownerUserId, owner.id),isNull(deletionRequests.cancelledAt),isNull(deletionRequests.completedAt))).orderBy(desc(deletionRequests.requestedAt)).limit(1);
    return Response.json({ request: row ? { id: row.id, requestedAt: row.requestedAt, scheduledFor: row.scheduledFor } : null });
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Unable to load deletion status." }, { status: 500 }); }
}

export async function POST(request: Request) {
  try {
    const owner = await getCurrentUser(request);
    if (!owner) return Response.json({ error: "Sign in is required." }, { status: 401 });
    const payload = await request.json() as { confirmation?: string };
    if (payload.confirmation?.trim().toLowerCase() !== owner.email.toLowerCase()) return Response.json({ error: "Enter your account email exactly to confirm." }, { status: 400 });
    const db = await getDb();
    const [existing] = await db.select().from(deletionRequests).where(and(eq(deletionRequests.ownerUserId, owner.id),isNull(deletionRequests.cancelledAt),isNull(deletionRequests.completedAt))).limit(1);
    if (existing) return Response.json({ request: { id: existing.id, requestedAt: existing.requestedAt, scheduledFor: existing.scheduledFor } });
    const requestedAt = new Date(), scheduledFor = new Date(requestedAt.getTime()+14*24*60*60*1000);
    const [row] = await db.insert(deletionRequests).values({ id: crypto.randomUUID(), ownerUserId: owner.id, ownerEmail: owner.email, requestedAt: requestedAt.toISOString(), scheduledFor: scheduledFor.toISOString() }).returning();
    await writeAuditEvent({ ownerUserId: owner.id, ownerEmail: owner.email, action: "requested", entityType: "account_deletion", entityId: row.id, entityLabel: "Account deletion" });
    return Response.json({ request: { id: row.id, requestedAt: row.requestedAt, scheduledFor: row.scheduledFor } }, { status: 201 });
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Unable to request account deletion." }, { status: 500 }); }
}

export async function DELETE(request: Request) {
  try {
    const owner = await getCurrentUser(request);
    if (!owner) return Response.json({ error: "Sign in is required." }, { status: 401 });
    const db = await getDb();
    const [row] = await db.update(deletionRequests).set({ cancelledAt: new Date().toISOString() }).where(and(eq(deletionRequests.ownerUserId, owner.id),isNull(deletionRequests.cancelledAt),isNull(deletionRequests.completedAt))).returning();
    if (!row) return Response.json({ error: "No active deletion request was found." }, { status: 404 });
    await writeAuditEvent({ ownerUserId: owner.id, ownerEmail: owner.email, action: "cancelled", entityType: "account_deletion", entityId: row.id, entityLabel: "Account deletion" });
    return Response.json({ cancelled: true });
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Unable to cancel account deletion." }, { status: 500 }); }
}
