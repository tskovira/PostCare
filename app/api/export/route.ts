import { and, desc, eq, isNull } from "drizzle-orm";
import { getDb } from "../../../db";
import { clinicalFacts, documents, healthRecords, medications } from "../../../db/schema";
import { writeAuditEvent } from "../../../db/audit";
import { getCurrentUser } from "../../../db/current-user";

function csvCell(value: string | number) {
  return `"${String(value).replaceAll('"', '""')}"`;
}
function escapeHtml(value: string) {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        character
      ]!,
  );
}

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser(request);
    if (!user?.email)
      return Response.json({ error: "Sign in is required." }, { status: 401 });
    const format = new URL(request.url).searchParams.get("format") ?? "json";
    if (!new Set(["json", "csv", "print"]).has(format))
      return Response.json(
        { error: "Choose a valid export format." },
        { status: 400 },
      );
    const db = await getDb();
    const [records, files, medicineList, factList] = await Promise.all([
      db
        .select()
        .from(healthRecords)
        .where(
          and(
            eq(healthRecords.ownerUserId, user.id),
            isNull(healthRecords.deletedAt),
          ),
        )
        .orderBy(desc(healthRecords.recordDate)),
      db
        .select({
          id: documents.id,
          title: documents.title,
          fileName: documents.fileName,
          contentType: documents.contentType,
          sizeBytes: documents.sizeBytes,
          healthArea: documents.healthArea,
          uploadedAt: documents.uploadedAt,
        })
        .from(documents)
        .where(eq(documents.ownerUserId, user.id))
        .orderBy(desc(documents.uploadedAt)),
      db.select().from(medications).where(eq(medications.ownerUserId,user.id)).orderBy(desc(medications.updatedAt)),
      db.select().from(clinicalFacts).where(eq(clinicalFacts.ownerUserId,user.id)).orderBy(desc(clinicalFacts.updatedAt)),
    ]);
    const generatedAt = new Date().toISOString();
    await writeAuditEvent({
      ownerUserId: user.id,
      ownerEmail: user.email,
      action: "exported",
      entityType: "health_summary",
      entityId: crypto.randomUUID(),
      entityLabel: `${format.toUpperCase()} health summary`,
    });

    if (format === "csv") {
      const rows = [
        ["Date", "Health area", "Title", "Provider", "Notes", "Source"],
        ...records.map((record) => [
          record.recordDate,
          record.type,
          record.title,
          record.provider,
          record.notes,
          record.source,
        ]),
      ];
      const csv = rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
      return new Response(csv, {
        headers: {
          "content-type": "text/csv; charset=utf-8",
          "content-disposition": `attachment; filename="postcare-health-records-${generatedAt.slice(0, 10)}.csv"`,
          "cache-control": "private, no-store",
        },
      });
    }
    if (format === "print") {
      const recordRows = records
        .map(
          (record) =>
            `<tr><td>${escapeHtml(record.recordDate)}</td><td>${escapeHtml(record.type)}</td><td><strong>${escapeHtml(record.title)}</strong><br><small>${escapeHtml(record.notes || "No notes")}</small></td><td>${escapeHtml(record.provider || "—")}</td></tr>`,
        )
        .join("");
      const documentRows = files
        .map(
          (file) =>
            `<tr><td>${escapeHtml(file.uploadedAt.slice(0, 10))}</td><td>${escapeHtml(file.healthArea)}</td><td>${escapeHtml(file.title)}<br><small>${escapeHtml(file.fileName)}</small></td></tr>`,
        )
        .join("");
      const medicationRows=medicineList.map(item=>`<tr><td><strong>${escapeHtml(item.name)}</strong><br><small>${escapeHtml(item.dosage||"No dosage")}</small></td><td>${escapeHtml(item.frequency||"—")}</td><td>${escapeHtml(item.prescribingProvider||"—")}</td><td>${escapeHtml(item.status)}</td></tr>`).join("");
      const factRows=factList.map(item=>`<tr><td>${escapeHtml(item.kind)}</td><td><strong>${escapeHtml(item.name)}</strong><br><small>${escapeHtml(item.reaction||"No reaction or symptoms")}</small></td><td>${escapeHtml(item.severity)}</td><td>${escapeHtml(item.status)}</td></tr>`).join("");
      const html = `<!doctype html><html><head><meta charset="utf-8"><title>PostCare Health Summary</title><style>body{font:14px system-ui;color:#18302f;max-width:900px;margin:40px auto;padding:0 24px}header{border-bottom:3px solid #287e76;padding-bottom:18px;margin-bottom:24px}h1{font:32px Georgia;margin:0 0 8px}h2{font:22px Georgia;margin-top:30px}p,small{color:#647572}table{width:100%;border-collapse:collapse}th,td{text-align:left;vertical-align:top;border-bottom:1px solid #dce5e3;padding:10px 8px}th{font-size:10px;text-transform:uppercase;letter-spacing:.08em}.meta{display:flex;justify-content:space-between}.notice{background:#edf7f3;padding:12px;border-radius:8px}@media print{button{display:none}body{margin:0}.notice{border:1px solid #dce5e3}} </style></head><body><header><h1>PostCare health summary</h1><div class="meta"><span>Patient: ${escapeHtml(user.email)}</span><span>Generated: ${escapeHtml(generatedAt.slice(0, 10))}</span></div></header><p class="notice">Patient-maintained health information. Confirm important details with the appropriate healthcare provider.</p><h2>Conditions & allergies (${factList.length})</h2><table><thead><tr><th>Type</th><th>Detail</th><th>Severity</th><th>Status</th></tr></thead><tbody>${factRows||"<tr><td colspan=4>No conditions or allergies saved.</td></tr>"}</tbody></table><h2>Medications (${medicineList.length})</h2><table><thead><tr><th>Medication</th><th>Frequency</th><th>Prescriber</th><th>Status</th></tr></thead><tbody>${medicationRows||"<tr><td colspan=4>No medications saved.</td></tr>"}</tbody></table><h2>Health records (${records.length})</h2><table><thead><tr><th>Date</th><th>Area</th><th>Record</th><th>Provider</th></tr></thead><tbody>${recordRows || "<tr><td colspan=4>No records saved.</td></tr>"}</tbody></table><h2>Document index (${files.length})</h2><table><thead><tr><th>Uploaded</th><th>Area</th><th>Document</th></tr></thead><tbody>${documentRows || "<tr><td colspan=3>No documents saved.</td></tr>"}</tbody></table><p><button onclick="window.print()">Print or save as PDF</button></p></body></html>`;
      return new Response(html, {
        headers: {
          "content-type": "text/html; charset=utf-8",
          "cache-control": "private, no-store",
          "x-content-type-options": "nosniff",
        },
      });
    }
    return new Response(
      JSON.stringify(
        {
          product: "PostCare",
          generatedAt,
          patient: user.email,
          records,
          medications: medicineList,
          conditionsAndAllergies: factList,
          documents: files,
        },
        null,
        2,
      ),
      {
        headers: {
          "content-type": "application/json; charset=utf-8",
          "content-disposition": `attachment; filename="postcare-health-data-${generatedAt.slice(0, 10)}.json"`,
          "cache-control": "private, no-store",
        },
      },
    );
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Unable to create export.",
      },
      { status: 500 },
    );
  }
}
