import { and, eq, inArray, isNull } from "drizzle-orm";
import { getDb } from "../../../db";
import { healthRecords, shareGrants } from "../../../db/schema";
import { hashShareToken } from "../../../db/share-token";
import { writeAuditEvent } from "../../../db/audit";

export async function GET(request: Request) {
  try {
    const token = new URL(request.url).searchParams.get("token") ?? "";
    if (token.length < 40 || token.length > 80)
      return Response.json(
        { error: "This share link is invalid." },
        { status: 404 },
      );
    const db = await getDb();
    const [grant] = await db
      .select()
      .from(shareGrants)
      .where(
        and(
          eq(shareGrants.tokenHash, await hashShareToken(token)),
          isNull(shareGrants.revokedAt),
        ),
      )
      .limit(1);
    if (!grant || new Date(grant.expiresAt).getTime() <= Date.now())
      return Response.json(
        { error: "This share link has expired or was revoked." },
        { status: 410 },
      );
    let recordIds: string[] = [];
    try {
      recordIds = JSON.parse(grant.recordIds) as string[];
    } catch {}
    if (!grant.ownerUserId)
      return Response.json(
        { error: "This share link needs to be recreated by its owner." },
        { status: 410 },
      );
    const records = recordIds.length
      ? await db
          .select({
            id: healthRecords.id,
            type: healthRecords.type,
            title: healthRecords.title,
            recordDate: healthRecords.recordDate,
            provider: healthRecords.provider,
            notes: healthRecords.notes,
          })
          .from(healthRecords)
          .where(
            and(
              eq(healthRecords.ownerUserId, grant.ownerUserId),
              inArray(healthRecords.id, recordIds),
              isNull(healthRecords.deletedAt),
            ),
          )
      : [];
    const now = new Date().toISOString();
    await db
      .update(shareGrants)
      .set({ lastAccessedAt: now, accessCount: grant.accessCount + 1 })
      .where(eq(shareGrants.id, grant.id));
    await writeAuditEvent({
      ownerUserId: grant.ownerUserId,
      ownerEmail: grant.ownerEmail,
      actorEmail: "Share-link recipient",
      action: "accessed",
      entityType: "share_link",
      entityId: grant.id,
      entityLabel: grant.label,
    });
    return Response.json(
      {
        summary: {
          label: grant.label,
          expiresAt: grant.expiresAt,
          generatedAt: now,
          records,
        },
      },
      {
        headers: {
          "cache-control": "private, no-store",
          "referrer-policy": "no-referrer",
        },
      },
    );
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to open shared summary.",
      },
      { status: 500 },
    );
  }
}
