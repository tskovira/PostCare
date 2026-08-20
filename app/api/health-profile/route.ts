import { eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { healthProfiles } from "../../../db/schema";
import { getCurrentUser } from "../../../db/current-user";
import { writeAuditEvent } from "../../../db/audit";

type ProfilePayload = { allergies?: unknown; medications?: unknown; conditions?: unknown; bloodType?: string; primaryProvider?: string; emergencyName?: string; emergencyRelationship?: string; emergencyPhone?: string };
const bloodTypes = new Set(["", "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "Unknown"]);
const cleanList = (value: unknown) => Array.isArray(value) ? value.map(item => String(item).trim()).filter(Boolean).slice(0, 30).map(item => item.slice(0, 120)) : [];
const parseList = (value: string) => { try { const parsed = JSON.parse(value); return cleanList(parsed); } catch { return []; } };

function serialize(row: typeof healthProfiles.$inferSelect) { return { allergies: parseList(row.allergies), medications: parseList(row.medications), conditions: parseList(row.conditions), bloodType: row.bloodType, primaryProvider: row.primaryProvider, emergencyName: row.emergencyName, emergencyRelationship: row.emergencyRelationship, emergencyPhone: row.emergencyPhone, reviewedAt: row.reviewedAt }; }

export async function GET(request: Request) {
  try {
    const owner = await getCurrentUser(request);
    if (!owner) return Response.json({ error: "Sign in is required." }, { status: 401 });
    const db = await getDb();
    let [row] = await db.select().from(healthProfiles).where(eq(healthProfiles.ownerUserId, owner.id)).limit(1);
    if (!row) [row] = await db.insert(healthProfiles).values({ id: crypto.randomUUID(), ownerUserId: owner.id, ownerEmail: owner.email, reviewedAt: new Date().toISOString() }).returning();
    return Response.json({ profile: serialize(row) });
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Unable to load health essentials." }, { status: 500 }); }
}

export async function PUT(request: Request) {
  try {
    const owner = await getCurrentUser(request);
    if (!owner) return Response.json({ error: "Sign in is required." }, { status: 401 });
    const payload = await request.json() as ProfilePayload;
    const bloodType = payload.bloodType?.trim() ?? "";
    if (!bloodTypes.has(bloodType)) return Response.json({ error: "Choose a valid blood type." }, { status: 400 });
    const values = { allergies: JSON.stringify(cleanList(payload.allergies)), medications: JSON.stringify(cleanList(payload.medications)), conditions: JSON.stringify(cleanList(payload.conditions)), bloodType, primaryProvider: payload.primaryProvider?.trim().slice(0,160) ?? "", emergencyName: payload.emergencyName?.trim().slice(0,120) ?? "", emergencyRelationship: payload.emergencyRelationship?.trim().slice(0,80) ?? "", emergencyPhone: payload.emergencyPhone?.trim().slice(0,40) ?? "", reviewedAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    const db = await getDb();
    let [row] = await db.update(healthProfiles).set(values).where(eq(healthProfiles.ownerUserId, owner.id)).returning();
    if (!row) [row] = await db.insert(healthProfiles).values({ id: crypto.randomUUID(), ownerUserId: owner.id, ownerEmail: owner.email, ...values }).returning();
    await writeAuditEvent({ ownerUserId: owner.id, ownerEmail: owner.email, action: "updated", entityType: "health_profile", entityId: row.id, entityLabel: "Health essentials" });
    return Response.json({ profile: serialize(row) });
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Unable to save health essentials." }, { status: 500 }); }
}
