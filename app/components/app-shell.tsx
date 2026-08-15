"use client";

import { useEffect, useState } from "react";
import { initialHealthRecords, navigationItems } from "../lib/demo-data";
import type { AuditEvent, HealthDocument, HealthRecord, ViewId } from "../lib/types";
import { DocumentUpload } from "./document-upload";
import { RecordForm } from "./record-form";
import { ActivityView } from "./activity-view";
import { DentalView, DocumentsView, HomeView, RecordsView, TimelineView } from "./views";

const paths: Record<ViewId, string> = { home: "/", timeline: "/timeline", dental: "/health-areas/dental", records: "/records", documents: "/documents", activity: "/access-history" };

export function AppShell() {
  const [view, setView] = useState<ViewId>("home");
  const [menu, setMenu] = useState(false);
  const [records, setRecords] = useState(initialHealthRecords);
  const [recordsStatus, setRecordsStatus] = useState<"loading" | "saved" | "demo">("loading");
  const [recordError, setRecordError] = useState("");
  const [healthDocuments, setHealthDocuments] = useState<HealthDocument[]>([]);
  const [documentsStatus, setDocumentsStatus] = useState<"loading" | "saved" | "unavailable">("loading");
  const [documentError, setDocumentError] = useState("");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [auditStatus, setAuditStatus] = useState<"loading" | "ready" | "unavailable">("loading");
  const [auditError, setAuditError] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<HealthRecord | null>(null);
  useEffect(() => {
    const syncFromUrl = () => {
      const match = (Object.entries(paths) as [ViewId, string][]).find(([, path]) => path === window.location.pathname);
      setView(match?.[0] ?? "home");
    };
    syncFromUrl();
    window.addEventListener("popstate", syncFromUrl);
    return () => window.removeEventListener("popstate", syncFromUrl);
  }, []);

  useEffect(() => {
    let active = true;
    fetch("/api/documents")
      .then(async (response) => { const body = await response.json() as { documents?: HealthDocument[]; error?: string }; if (!response.ok) throw new Error(body.error ?? "Unable to load documents."); return body.documents ?? []; })
      .then((savedDocuments) => { if (active) { setHealthDocuments(savedDocuments); setDocumentsStatus("saved"); } })
      .catch((error: unknown) => { if (active) { setDocumentError(error instanceof Error ? error.message : "Unable to load documents."); setDocumentsStatus("unavailable"); } });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    fetch("/api/records")
      .then(async (response) => {
        const body = await response.json() as { records?: HealthRecord[]; error?: string };
        if (!response.ok) throw new Error(body.error ?? "Unable to load saved records.");
        return body.records ?? [];
      })
      .then((savedRecords) => { if (active) { setRecords(savedRecords); setRecordsStatus("saved"); } })
      .catch((error: unknown) => { if (active) { setRecordError(error instanceof Error ? error.message : "Unable to load saved records."); setRecordsStatus("demo"); } });
    return () => { active = false; };
  }, []);

  const loadAudit = async () => {
    setAuditStatus("loading"); setAuditError("");
    try { const response = await fetch("/api/audit"); const body = await response.json() as { events?: AuditEvent[]; error?: string }; if (!response.ok) throw new Error(body.error ?? "Unable to load access history."); setAuditEvents(body.events ?? []); setAuditStatus("ready"); }
    catch (error) { setAuditError(error instanceof Error ? error.message : "Unable to load access history."); setAuditStatus("unavailable"); }
  };
  const navigate = (destination: ViewId) => { setView(destination); setMenu(false); window.history.pushState({}, "", paths[destination]); if (destination === "activity") void loadAudit(); };
  const openAdd = () => { setEditingRecord(null); setFormOpen(true); };
  const openEdit = (record: HealthRecord) => { setEditingRecord(record); setFormOpen(true); };
  const openUpload = () => setUploadOpen(true);
  const documentUploaded = (document: HealthDocument) => { setHealthDocuments((current) => [document, ...current]); setDocumentsStatus("saved"); setUploadOpen(false); navigate("documents"); };
  const openDocument = (document: HealthDocument) => window.open(`/api/documents?id=${encodeURIComponent(document.id)}`, "_blank", "noopener,noreferrer");
  const saveRecord = async (draft: Omit<HealthRecord, "id" | "source">) => {
    setRecordError("");
    const response = await fetch("/api/records", { method: editingRecord ? "PUT" : "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...draft, id: editingRecord?.id }) });
    const body = await response.json() as { record?: HealthRecord; error?: string };
    if (!response.ok || !body.record) { setRecordError(body.error ?? "Unable to save this record."); throw new Error(body.error ?? "Unable to save this record."); }
    if (editingRecord) setRecords((current) => current.map((record) => record.id === editingRecord.id ? body.record! : record));
    else setRecords((current) => [body.record!, ...current]);
    setRecordsStatus("saved");
    setFormOpen(false);
    navigate("records");
  };

  return <div className="app-shell">
    <aside className={menu ? "sidebar open" : "sidebar"}><div className="brand"><span>+</span><div><strong>PostCare</strong><small>Personal health record</small></div></div><nav>{navigationItems.map((item) => <button key={item.id} className={view === item.id ? "active" : ""} onClick={() => navigate(item.id)}><span>{item.icon}</span>{item.label}</button>)}<button onClick={() => navigate("dental")} className={view === "dental" ? "active" : ""}><span>⌘</span>Health areas</button></nav><div className="sidebar-bottom"><button onClick={() => navigate("activity")} className={view === "activity" ? "active" : ""}><span>♧</span>Access history</button><button><span>⚙</span>Settings</button><div className="profile"><span>TS</span><div><strong>Travis Skovira</strong><small>My health record</small></div><b>⋯</b></div></div></aside>
    <main className="main"><div className="mobile-top"><button onClick={() => setMenu(!menu)}>☰</button><div className="brand"><span>+</span><strong>PostCare</strong></div><button>⌕</button></div><div className="topbar"><label>⌕ <input placeholder="Search your health record" /></label><button aria-label="Notifications">♢</button><span className="privacy">● Private</span></div><div className="content">{view === "home" && <HomeView setView={navigate} onAdd={openAdd} onUpload={openUpload} />}{view === "timeline" && <TimelineView onAdd={openAdd} />}{view === "dental" && <DentalView />}{view === "records" && <RecordsView records={records} status={recordsStatus} error={recordError} onAdd={openAdd} onEdit={openEdit} />}{view === "documents" && <DocumentsView documents={healthDocuments} status={documentsStatus} error={documentError} onUpload={openUpload} onOpen={openDocument} />}{view === "activity" && <ActivityView events={auditEvents} status={auditStatus} error={auditError} onRefresh={loadAudit} />}</div></main>
    {menu && <button className="scrim" aria-label="Close navigation" onClick={() => setMenu(false)} />}
    <nav className="mobile-nav"><button onClick={() => navigate("home")} className={view === "home" ? "active" : ""}>⌂<span>Home</span></button><button onClick={() => navigate("timeline")} className={view === "timeline" ? "active" : ""}>◷<span>Timeline</span></button><button className="add-mobile" onClick={openAdd}>＋<span>Add</span></button><button onClick={() => navigate("documents")} className={view === "documents" ? "active" : ""}>□<span>Documents</span></button><button onClick={() => setMenu(true)}>☰<span>More</span></button></nav>
    {formOpen && <RecordForm record={editingRecord} onSave={saveRecord} onClose={() => setFormOpen(false)} />}
    {uploadOpen && <DocumentUpload onUploaded={documentUploaded} onClose={() => setUploadOpen(false)} />}
  </div>;
}
