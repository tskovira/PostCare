import { and, desc, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { documents } from "../../../db/schema";
import { getChatGPTUser } from "../../chatgpt-auth";

const maxBytes = 10 * 1024 * 1024;
const areas = new Set(["Primary care", "Dental", "Vision", "Specialist", "Medication", "Lab result", "Other"]);

async function getBucket() {
  const { env } = await import("cloudflare:workers");
  if (!env.BUCKET) throw new Error("Document storage is unavailable.");
  return env.BUCKET;
}

async function ownerEmail() { return (await getChatGPTUser())?.email ?? null; }
async function ownerPrefix(email: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(email.toLowerCase()));
  return Array.from(new Uint8Array(digest)).slice(0, 12).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function detectedType(bytes: Uint8Array) {
  if (bytes.length >= 5 && new TextDecoder().decode(bytes.slice(0, 5)) === "%PDF-") return "application/pdf";
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes.length >= 8 && bytes[0] === 0x89 && new TextDecoder().decode(bytes.slice(1, 4)) === "PNG") return "image/png";
  if (bytes.length >= 12 && new TextDecoder().decode(bytes.slice(0, 4)) === "RIFF" && new TextDecoder().decode(bytes.slice(8, 12)) === "WEBP") return "image/webp";
  return null;
}

function serialize(row: typeof documents.$inferSelect) {
  return { id: row.id, title: row.title, fileName: row.fileName, contentType: row.contentType, sizeBytes: row.sizeBytes, healthArea: row.healthArea, status: "available" as const, uploadedAt: row.uploadedAt };
}

export async function GET(request: Request) {
  try {
    const owner = await ownerEmail();
    if (!owner) return Response.json({ error: "Sign in is required." }, { status: 401 });
    const id = new URL(request.url).searchParams.get("id");
    const db = await getDb();
    if (!id) {
      const rows = await db.select().from(documents).where(eq(documents.ownerEmail, owner)).orderBy(desc(documents.uploadedAt));
      return Response.json({ documents: rows.map(serialize) });
    }
    const [metadata] = await db.select().from(documents).where(and(eq(documents.id, id), eq(documents.ownerEmail, owner))).limit(1);
    if (!metadata) return Response.json({ error: "Document not found." }, { status: 404 });
    const object = await (await getBucket()).get(metadata.objectKey);
    if (!object) return Response.json({ error: "Stored file not found." }, { status: 404 });
    const safeName = metadata.fileName.replace(/["\\\r\n]/g, "_");
    return new Response(object.body, { headers: { "content-type": metadata.contentType, "content-length": String(metadata.sizeBytes), "content-disposition": `inline; filename="${safeName}"`, "cache-control": "private, no-store", "x-content-type-options": "nosniff" } });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to load documents." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  let storedKey = "";
  try {
    const owner = await ownerEmail();
    if (!owner) return Response.json({ error: "Sign in is required." }, { status: 401 });
    const form = await request.formData();
    const file = form.get("file");
    const title = String(form.get("title") ?? "").trim().slice(0, 140);
    const healthArea = String(form.get("healthArea") ?? "Other");
    if (!(file instanceof File)) return Response.json({ error: "Choose a file to upload." }, { status: 400 });
    if (!title) return Response.json({ error: "Enter a document title." }, { status: 400 });
    if (!areas.has(healthArea)) return Response.json({ error: "Choose a valid health area." }, { status: 400 });
    if (file.size === 0 || file.size > maxBytes) return Response.json({ error: "Files must be between 1 byte and 10 MB." }, { status: 400 });
    const bytes = new Uint8Array(await file.arrayBuffer());
    const contentType = detectedType(bytes);
    if (!contentType) return Response.json({ error: "Only genuine PDF, JPEG, PNG, and WebP files are accepted." }, { status: 400 });
    const id = crypto.randomUUID();
    storedKey = `${await ownerPrefix(owner)}/${id}`;
    const bucket = await getBucket();
    await bucket.put(storedKey, bytes, { httpMetadata: { contentType }, customMetadata: { documentId: id } });
    const db = await getDb();
    const [row] = await db.insert(documents).values({ id, ownerEmail: owner, objectKey: storedKey, title, fileName: file.name.slice(0, 255) || "document", contentType, sizeBytes: file.size, healthArea }).returning();
    return Response.json({ document: serialize(row) }, { status: 201 });
  } catch (error) {
    if (storedKey) { try { await (await getBucket()).delete(storedKey); } catch {} }
    return Response.json({ error: error instanceof Error ? error.message : "Unable to upload document." }, { status: 500 });
  }
}
