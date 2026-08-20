import { and, desc, eq, isNotNull, isNull } from "drizzle-orm";
import { getDb } from "../../../db";
import { healthRecords, healthRecordVersions } from "../../../db/schema";
import { getCurrentUser } from "../../../db/current-user";
import { writeAuditEvent } from "../../../db/audit";

type RecordPayload = {
  id?: string;
  type?: string;
  title?: string;
  date?: string;
  provider?: string;
  notes?: string;
};
const allowedTypes = new Set([
  "Primary care",
  "Dental",
  "Vision",
  "Specialist",
  "Medication",
  "Lab result",
]);

function validate(payload: RecordPayload) {
  const type = payload.type?.trim() ?? "";
  const title = payload.title?.trim() ?? "";
  const date = payload.date?.trim() ?? "";
  if (!allowedTypes.has(type)) return { error: "Choose a valid health area." };
  if (!title || title.length > 140)
    return { error: "Enter a title up to 140 characters." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date))
    return { error: "Enter a valid record date." };
  return {
    value: {
      type,
      title,
      recordDate: date,
      provider: payload.provider?.trim().slice(0, 160) ?? "",
      notes: payload.notes?.trim().slice(0, 2000) ?? "",
    },
  };
}

function serialize(record: typeof healthRecords.$inferSelect) {
  return {
    id: record.id,
    type: record.type,
    title: record.title,
    date: record.recordDate,
    provider: record.provider,
    notes: record.notes,
    source: "Entered by you" as const,
    deletedAt: record.deletedAt,
  };
}

async function saveVersion(
  record: typeof healthRecords.$inferSelect,
  reason: "updated" | "archived",
) {
  if (!record.ownerUserId)
    throw new Error("Record ownership migration is incomplete.");
  const db = await getDb();
  const [latest] = await db
    .select({ versionNumber: healthRecordVersions.versionNumber })
    .from(healthRecordVersions)
    .where(
      and(
        eq(healthRecordVersions.recordId, record.id),
        eq(healthRecordVersions.ownerUserId, record.ownerUserId),
      ),
    )
    .orderBy(desc(healthRecordVersions.versionNumber))
    .limit(1);
  await db
    .insert(healthRecordVersions)
    .values({
      id: crypto.randomUUID(),
      recordId: record.id,
      ownerUserId: record.ownerUserId,
      ownerEmail: record.ownerEmail,
      versionNumber: (latest?.versionNumber ?? 0) + 1,
      type: record.type,
      title: record.title,
      recordDate: record.recordDate,
      provider: record.provider,
      notes: record.notes,
      reason,
    });
}

export async function GET(request: Request) {
  try {
    const owner = await getCurrentUser(request);
    if (!owner)
      return Response.json({ error: "Sign in is required." }, { status: 401 });
    const db = await getDb();
    const archived =
      new URL(request.url).searchParams.get("archived") === "true";
    const rows = await db
      .select()
      .from(healthRecords)
      .where(
        and(
          eq(healthRecords.ownerUserId, owner.id),
          archived
            ? isNotNull(healthRecords.deletedAt)
            : isNull(healthRecords.deletedAt),
        ),
      )
      .orderBy(desc(healthRecords.recordDate));
    return Response.json({ records: rows.map(serialize) });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Unable to load records.",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const owner = await getCurrentUser(request);
    if (!owner)
      return Response.json({ error: "Sign in is required." }, { status: 401 });
    const result = validate((await request.json()) as RecordPayload);
    if ("error" in result)
      return Response.json({ error: result.error }, { status: 400 });
    const db = await getDb();
    const [record] = await db
      .insert(healthRecords)
      .values({
        id: crypto.randomUUID(),
        ownerUserId: owner.id,
        ownerEmail: owner.email,
        ...result.value,
      })
      .returning();
    await writeAuditEvent({
      ownerUserId: owner.id,
      ownerEmail: owner.email,
      action: "created",
      entityType: "health_record",
      entityId: record.id,
      entityLabel: record.title,
    });
    return Response.json({ record: serialize(record) }, { status: 201 });
  } catch (error) {
    return Response.json(
      {
        error: error instanceof Error ? error.message : "Unable to add record.",
      },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  try {
    const owner = await getCurrentUser(request);
    if (!owner)
      return Response.json({ error: "Sign in is required." }, { status: 401 });
    const payload = (await request.json()) as RecordPayload;
    if (!payload.id)
      return Response.json(
        { error: "Record id is required." },
        { status: 400 },
      );
    const result = validate(payload);
    if ("error" in result)
      return Response.json({ error: result.error }, { status: 400 });
    const db = await getDb();
    const [current] = await db
      .select()
      .from(healthRecords)
      .where(
        and(
          eq(healthRecords.id, payload.id),
          eq(healthRecords.ownerUserId, owner.id),
          isNull(healthRecords.deletedAt),
        ),
      )
      .limit(1);
    if (!current)
      return Response.json({ error: "Record not found." }, { status: 404 });
    await saveVersion(current, "updated");
    const [record] = await db
      .update(healthRecords)
      .set({ ...result.value, updatedAt: new Date().toISOString() })
      .where(
        and(
          eq(healthRecords.id, payload.id),
          eq(healthRecords.ownerUserId, owner.id),
        ),
      )
      .returning();
    await writeAuditEvent({
      ownerUserId: owner.id,
      ownerEmail: owner.email,
      action: "updated",
      entityType: "health_record",
      entityId: record.id,
      entityLabel: record.title,
    });
    return Response.json({ record: serialize(record) });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Unable to update record.",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const owner = await getCurrentUser(request);
    if (!owner)
      return Response.json({ error: "Sign in is required." }, { status: 401 });
    const id = new URL(request.url).searchParams.get("id");
    if (!id)
      return Response.json(
        { error: "Record id is required." },
        { status: 400 },
      );
    const db = await getDb();
    const [current] = await db
      .select()
      .from(healthRecords)
      .where(
        and(
          eq(healthRecords.id, id),
          eq(healthRecords.ownerUserId, owner.id),
          isNull(healthRecords.deletedAt),
        ),
      )
      .limit(1);
    if (!current)
      return Response.json({ error: "Record not found." }, { status: 404 });
    await saveVersion(current, "archived");
    const now = new Date().toISOString();
    const [record] = await db
      .update(healthRecords)
      .set({ deletedAt: now, updatedAt: now })
      .where(
        and(eq(healthRecords.id, id), eq(healthRecords.ownerUserId, owner.id)),
      )
      .returning();
    await writeAuditEvent({
      ownerUserId: owner.id,
      ownerEmail: owner.email,
      action: "archived",
      entityType: "health_record",
      entityId: id,
      entityLabel: record.title,
    });
    return Response.json({ record: serialize(record) });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Unable to archive record.",
      },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const owner = await getCurrentUser(request);
    if (!owner)
      return Response.json({ error: "Sign in is required." }, { status: 401 });
    const payload = (await request.json()) as { id?: string };
    if (!payload.id)
      return Response.json(
        { error: "Record id is required." },
        { status: 400 },
      );
    const db = await getDb();
    const [record] = await db
      .update(healthRecords)
      .set({ deletedAt: null, updatedAt: new Date().toISOString() })
      .where(
        and(
          eq(healthRecords.id, payload.id),
          eq(healthRecords.ownerUserId, owner.id),
          isNotNull(healthRecords.deletedAt),
        ),
      )
      .returning();
    if (!record)
      return Response.json(
        { error: "Archived record not found." },
        { status: 404 },
      );
    await writeAuditEvent({
      ownerUserId: owner.id,
      ownerEmail: owner.email,
      action: "restored",
      entityType: "health_record",
      entityId: record.id,
      entityLabel: record.title,
    });
    return Response.json({ record: serialize(record) });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Unable to restore record.",
      },
      { status: 500 },
    );
  }
}
