import { and, desc, eq, inArray, isNull } from "drizzle-orm";
import { getDb } from "../../../db";
import { healthRecords, shareGrants } from "../../../db/schema";
import { randomShareToken, hashShareToken } from "../../../db/share-token";
import { writeAuditEvent } from "../../../db/audit";
import { getCurrentUser } from "../../../db/current-user";

function serialize(row: typeof shareGrants.$inferSelect) {
  let ids: string[] = [];
  try {
    ids = JSON.parse(row.recordIds) as string[];
  } catch {}
  return {
    id: row.id,
    label: row.label,
    recordCount: ids.length,
    expiresAt: row.expiresAt,
    revokedAt: row.revokedAt,
    createdAt: row.createdAt,
    lastAccessedAt: row.lastAccessedAt,
    accessCount: row.accessCount,
    active: !row.revokedAt && new Date(row.expiresAt).getTime() > Date.now(),
  };
}

export async function GET(request: Request) {
  const user = await getCurrentUser(request);
  if (!user?.email)
    return Response.json({ error: "Sign in is required." }, { status: 401 });
  const rows = await (
    await getDb()
  )
    .select()
    .from(shareGrants)
    .where(eq(shareGrants.ownerUserId, user.id))
    .orderBy(desc(shareGrants.createdAt));
  return Response.json({ shares: rows.map(serialize) });
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser(request);
    if (!user?.email)
      return Response.json({ error: "Sign in is required." }, { status: 401 });
    const payload = (await request.json()) as {
      label?: string;
      recordIds?: string[];
      expiresInDays?: number;
    };
    const label = payload.label?.trim().slice(0, 100) || "Healthcare provider";
    const recordIds = [...new Set(payload.recordIds ?? [])].slice(0, 100);
    const expiresInDays = Number(payload.expiresInDays);
    if (recordIds.length === 0)
      return Response.json(
        { error: "Select at least one record." },
        { status: 400 },
      );
    if (![1, 7, 14, 30].includes(expiresInDays))
      return Response.json(
        { error: "Choose a valid expiration period." },
        { status: 400 },
      );
    const db = await getDb();
    const owned = await db
      .select({ id: healthRecords.id })
      .from(healthRecords)
      .where(
        and(
          eq(healthRecords.ownerUserId, user.id),
          inArray(healthRecords.id, recordIds),
          isNull(healthRecords.deletedAt),
        ),
      );
    if (owned.length !== recordIds.length)
      return Response.json(
        { error: "One or more records could not be shared." },
        { status: 400 },
      );
    const id = crypto.randomUUID();
    const token = randomShareToken();
    const expiresAt = new Date(
      Date.now() + expiresInDays * 86400000,
    ).toISOString();
    const [row] = await db
      .insert(shareGrants)
      .values({
        id,
        ownerUserId: user.id,
        ownerEmail: user.email,
        tokenHash: await hashShareToken(token),
        label,
        recordIds: JSON.stringify(recordIds),
        expiresAt,
      })
      .returning();
    await writeAuditEvent({
      ownerUserId: user.id,
      ownerEmail: user.email,
      action: "shared",
      entityType: "share_link",
      entityId: id,
      entityLabel: label,
    });
    return Response.json(
      {
        share: serialize(row),
        url: `${new URL(request.url).origin}/share/${token}`,
      },
      { status: 201 },
    );
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to create secure share.",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  const user = await getCurrentUser(request);
  if (!user?.email)
    return Response.json({ error: "Sign in is required." }, { status: 401 });
  const id = new URL(request.url).searchParams.get("id");
  if (!id)
    return Response.json({ error: "Share id is required." }, { status: 400 });
  const db = await getDb();
  const [row] = await db
    .update(shareGrants)
    .set({ revokedAt: new Date().toISOString() })
    .where(and(eq(shareGrants.id, id), eq(shareGrants.ownerUserId, user.id)))
    .returning();
  if (!row)
    return Response.json({ error: "Share not found." }, { status: 404 });
  await writeAuditEvent({
    ownerUserId: user.id,
    ownerEmail: user.email,
    action: "revoked",
    entityType: "share_link",
    entityId: id,
    entityLabel: row.label,
  });
  return Response.json({ share: serialize(row) });
}
