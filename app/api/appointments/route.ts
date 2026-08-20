import { and, asc, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { appointments, healthRecords } from "../../../db/schema";
import { getCurrentUser } from "../../../db/current-user";
import { writeAuditEvent } from "../../../db/audit";

type AppointmentPayload = {
  id?: string; title?: string; healthArea?: string; provider?: string;
  facility?: string; startsAt?: string; durationMinutes?: number;
  location?: string; preparation?: string; action?: "cancel" | "complete";
};
const areas = new Set(["Primary care", "Dental", "Vision", "Specialist", "Laboratory", "Other"]);

function validate(payload: AppointmentPayload) {
  const title = payload.title?.trim() ?? "";
  const healthArea = payload.healthArea?.trim() ?? "";
  const startsAt = payload.startsAt?.trim() ?? "";
  const durationMinutes = Number(payload.durationMinutes);
  if (!title || title.length > 140) return { error: "Enter an appointment title up to 140 characters." };
  if (!areas.has(healthArea)) return { error: "Choose a valid health area." };
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(startsAt) || Number.isNaN(new Date(startsAt).getTime())) return { error: "Enter a valid appointment date and time." };
  if (!Number.isInteger(durationMinutes) || durationMinutes < 5 || durationMinutes > 480) return { error: "Duration must be between 5 and 480 minutes." };
  return { value: { title, healthArea, startsAt, durationMinutes, provider: payload.provider?.trim().slice(0, 160) ?? "", facility: payload.facility?.trim().slice(0, 160) ?? "", location: payload.location?.trim().slice(0, 240) ?? "", preparation: payload.preparation?.trim().slice(0, 1200) ?? "" } };
}

function serialize(row: typeof appointments.$inferSelect) {
  return { id: row.id, title: row.title, healthArea: row.healthArea, provider: row.provider, facility: row.facility, startsAt: row.startsAt, durationMinutes: row.durationMinutes, location: row.location, preparation: row.preparation, status: row.status };
}

export async function GET(request: Request) {
  try {
    const owner = await getCurrentUser(request);
    if (!owner) return Response.json({ error: "Sign in is required." }, { status: 401 });
    const db = await getDb();
    const rows = await db.select().from(appointments).where(eq(appointments.ownerUserId, owner.id)).orderBy(asc(appointments.startsAt));
    return Response.json({ appointments: rows.map(serialize) });
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Unable to load appointments." }, { status: 500 }); }
}

export async function POST(request: Request) {
  try {
    const owner = await getCurrentUser(request);
    if (!owner) return Response.json({ error: "Sign in is required." }, { status: 401 });
    const result = validate(await request.json() as AppointmentPayload);
    if ("error" in result) return Response.json({ error: result.error }, { status: 400 });
    const db = await getDb();
    const [row] = await db.insert(appointments).values({ id: crypto.randomUUID(), ownerUserId: owner.id, ownerEmail: owner.email, ...result.value }).returning();
    await writeAuditEvent({ ownerUserId: owner.id, ownerEmail: owner.email, action: "created", entityType: "appointment", entityId: row.id, entityLabel: row.title });
    return Response.json({ appointment: serialize(row) }, { status: 201 });
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Unable to add appointment." }, { status: 500 }); }
}

export async function PUT(request: Request) {
  try {
    const owner = await getCurrentUser(request);
    if (!owner) return Response.json({ error: "Sign in is required." }, { status: 401 });
    const payload = await request.json() as AppointmentPayload;
    if (!payload.id) return Response.json({ error: "Appointment id is required." }, { status: 400 });
    const result = validate(payload);
    if ("error" in result) return Response.json({ error: result.error }, { status: 400 });
    const db = await getDb();
    const [row] = await db.update(appointments).set({ ...result.value, updatedAt: new Date().toISOString() }).where(and(eq(appointments.id, payload.id), eq(appointments.ownerUserId, owner.id), eq(appointments.status, "scheduled"))).returning();
    if (!row) return Response.json({ error: "Scheduled appointment not found." }, { status: 404 });
    await writeAuditEvent({ ownerUserId: owner.id, ownerEmail: owner.email, action: "updated", entityType: "appointment", entityId: row.id, entityLabel: row.title });
    return Response.json({ appointment: serialize(row) });
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Unable to update appointment." }, { status: 500 }); }
}

export async function PATCH(request: Request) {
  try {
    const owner = await getCurrentUser(request);
    if (!owner) return Response.json({ error: "Sign in is required." }, { status: 401 });
    const payload = await request.json() as AppointmentPayload;
    if (!payload.id || !payload.action || !["cancel", "complete"].includes(payload.action)) return Response.json({ error: "Choose a valid appointment action." }, { status: 400 });
    const db = await getDb();
    const [current] = await db.select().from(appointments).where(and(eq(appointments.id, payload.id), eq(appointments.ownerUserId, owner.id), eq(appointments.status, "scheduled"))).limit(1);
    if (!current) return Response.json({ error: "Scheduled appointment not found." }, { status: 404 });
    const status = payload.action === "complete" ? "completed" : "cancelled";
    const [row] = await db.update(appointments).set({ status, updatedAt: new Date().toISOString() }).where(eq(appointments.id, current.id)).returning();
    if (status === "completed") await db.insert(healthRecords).values({ id: crypto.randomUUID(), ownerUserId: owner.id, ownerEmail: owner.email, type: current.healthArea === "Laboratory" ? "Lab result" : current.healthArea, title: current.title, recordDate: current.startsAt.slice(0, 10), provider: [current.provider, current.facility].filter(Boolean).join(" · "), notes: current.preparation ? `Appointment preparation: ${current.preparation}` : "Completed appointment." });
    await writeAuditEvent({ ownerUserId: owner.id, ownerEmail: owner.email, action: status, entityType: "appointment", entityId: row.id, entityLabel: row.title });
    return Response.json({ appointment: serialize(row), recordCreated: status === "completed" });
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Unable to update appointment status." }, { status: 500 }); }
}
