"use client";

import { useEffect, useState } from "react";
import { initialHealthRecords, navigationItems } from "../lib/demo-data";
import type { HealthRecord, ViewId } from "../lib/types";
import { RecordForm } from "./record-form";
import { DentalView, DocumentsView, HomeView, RecordsView, TimelineView } from "./views";

const paths: Record<ViewId, string> = { home: "/", timeline: "/timeline", dental: "/health-areas/dental", records: "/records", documents: "/documents" };

export function AppShell() {
  const [view, setView] = useState<ViewId>("home");
  const [menu, setMenu] = useState(false);
  const [records, setRecords] = useState(initialHealthRecords);
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

  const navigate = (destination: ViewId) => { setView(destination); setMenu(false); window.history.pushState({}, "", paths[destination]); };
  const openAdd = () => { setEditingRecord(null); setFormOpen(true); };
  const openEdit = (record: HealthRecord) => { setEditingRecord(record); setFormOpen(true); };
  const saveRecord = (draft: Omit<HealthRecord, "id" | "source">) => {
    if (editingRecord) setRecords((current) => current.map((record) => record.id === editingRecord.id ? { ...record, ...draft } : record));
    else setRecords((current) => [{ ...draft, id: `record-${Date.now()}`, source: "Entered by you" }, ...current]);
    setFormOpen(false);
    navigate("records");
  };

  return <div className="app-shell">
    <aside className={menu ? "sidebar open" : "sidebar"}><div className="brand"><span>+</span><div><strong>PostCare</strong><small>Personal health record</small></div></div><nav>{navigationItems.map((item) => <button key={item.id} className={view === item.id ? "active" : ""} onClick={() => navigate(item.id)}><span>{item.icon}</span>{item.label}</button>)}<button onClick={() => navigate("dental")} className={view === "dental" ? "active" : ""}><span>⌘</span>Health areas</button></nav><div className="sidebar-bottom"><button><span>♧</span>Access history</button><button><span>⚙</span>Settings</button><div className="profile"><span>TS</span><div><strong>Travis Skovira</strong><small>My health record</small></div><b>⋯</b></div></div></aside>
    <main className="main"><div className="mobile-top"><button onClick={() => setMenu(!menu)}>☰</button><div className="brand"><span>+</span><strong>PostCare</strong></div><button>⌕</button></div><div className="topbar"><label>⌕ <input placeholder="Search your health record" /></label><button aria-label="Notifications">♢</button><span className="privacy">● Private</span></div><div className="content">{view === "home" && <HomeView setView={navigate} onAdd={openAdd} />}{view === "timeline" && <TimelineView onAdd={openAdd} />}{view === "dental" && <DentalView />}{view === "records" && <RecordsView records={records} onAdd={openAdd} onEdit={openEdit} />}{view === "documents" && <DocumentsView />}</div></main>
    {menu && <button className="scrim" aria-label="Close navigation" onClick={() => setMenu(false)} />}
    <nav className="mobile-nav"><button onClick={() => navigate("home")} className={view === "home" ? "active" : ""}>⌂<span>Home</span></button><button onClick={() => navigate("timeline")} className={view === "timeline" ? "active" : ""}>◷<span>Timeline</span></button><button className="add-mobile" onClick={openAdd}>＋<span>Add</span></button><button onClick={() => navigate("documents")} className={view === "documents" ? "active" : ""}>□<span>Documents</span></button><button onClick={() => setMenu(true)}>☰<span>More</span></button></nav>
    {formOpen && <RecordForm record={editingRecord} onSave={saveRecord} onClose={() => setFormOpen(false)} />}
  </div>;
}
