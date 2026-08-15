import { and, desc, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { healthRecords } from "../../../db/schema";
import { getChatGPTUser } from "../../chatgpt-auth";
import { writeAuditEvent } from "../../../db/audit";

type RecordPayload = { id?: string; type?: string; title?: string; date?: string; provider?: string; notes?: string };
const allowedTypes = new Set(["Primary care", "Dental", "Vision", "Specialist", "Medication", "Lab result"]);

function validate(payload: RecordPayload) {
  const type = payload.type?.trim() ?? "";
  const title = payload.title?.trim() ?? "";
  const date = payload.date?.trim() ?? "";
  if (!allowedTypes.has(type)) return { error: "Choose a valid health area." };
  if (!title || title.length > 140) return { error: "Enter a title up to 140 characters." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { error: "Enter a valid record date." };
  return { value: { type, title, recordDate: date, provider: payload.provider?.trim().slice(0, 160) ?? "", notes: payload.notes?.trim().slice(0, 2000) ?? "" } };
}

function serialize(record: typeof healthRecords.$inferSelect) {
  return { id: record.id, type: record.type, title: record.title, date: record.recordDate, provider: record.provider, notes: record.notes, source: "Entered by you" as const };
}

async function ownerEmail() {
  const user = await getChatGPTUser();
  return user?.email ?? null;
}

export async function GET() {
  try {
    const owner = await ownerEmail();
    if (!owner) return Response.json({ error: "Sign in is required." }, { status: 401 });
    const db = await getDb();
    let rows = await db.select().from(healthRecords).where(eq(healthRecords.ownerEmail, owner)).orderBy(desc(healthRecords.recordDate));
    if (rows.length === 0) {
      await db.insert(healthRecords).values([
        { id: crypto.randomUUID(), ownerEmail: owner, type: "Dental", title: "Routine exam and cleaning", recordDate: "2026-08-12", provider: "Dr. Maya Chen", notes: "No new cavities. Continue monitoring sensitivity near tooth 19." },
        { id: crypto.randomUUID(), ownerEmail: owner, type: "Medication", title: "Amoxicillin 500 mg", recordDate: "2026-06-03", provider: "Northside Dental", notes: "Completed seven-day course after dental procedure." },
        { id: crypto.randomUUID(), ownerEmail: owner, type: "Primary care", title: "Annual wellness visit", recordDate: "2026-02-18", provider: "Dr. Elena Brooks", notes: "Routine physical and preventive care review." },
      ]);
      rows = await db.select().from(healthRecords).where(eq(healthRecords.ownerEmail, owner)).orderBy(desc(healthRecords.recordDate));
    }
    return Response.json({ records: rows.map(serialize) });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to load records." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const owner = await ownerEmail();
    if (!owner) return Response.json({ error: "Sign in is required." }, { status: 401 });
    const result = validate(await request.json() as RecordPayload);
    if ("error" in result) return Response.json({ error: result.error }, { status: 400 });
    const db = await getDb();
    const [record] = await db.insert(healthRecords).values({ id: crypto.randomUUID(), ownerEmail: owner, ...result.value }).returning();
    await writeAuditEvent({ ownerEmail: owner, action: "created", entityType: "health_record", entityId: record.id, entityLabel: record.title });
    return Response.json({ record: serialize(record) }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to add record." }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const owner = await ownerEmail();
    if (!owner) return Response.json({ error: "Sign in is required." }, { status: 401 });
    const payload = await request.json() as RecordPayload;
    if (!payload.id) return Response.json({ error: "Record id is required." }, { status: 400 });
    const result = validate(payload);
    if ("error" in result) return Response.json({ error: result.error }, { status: 400 });
    const db = await getDb();
    const [record] = await db.update(healthRecords).set({ ...result.value, updatedAt: new Date().toISOString() }).where(and(eq(healthRecords.id, payload.id), eq(healthRecords.ownerEmail, owner))).returning();
    if (!record) return Response.json({ error: "Record not found." }, { status: 404 });
    await writeAuditEvent({ ownerEmail: owner, action: "updated", entityType: "health_record", entityId: record.id, entityLabel: record.title });
    return Response.json({ record: serialize(record) });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to update record." }, { status: 500 });
  }
}
