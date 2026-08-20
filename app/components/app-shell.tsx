"use client";

import { useEffect, useState } from "react";
import { navigationItems } from "../lib/demo-data";
import type {
  AuditEvent,
  Appointment,
  ClinicalFact,
  HealthDocument,
  HealthArea,
  HealthProfile,
  Medication,
  HealthRecord,
  TimelineEntry,
  ViewId,
} from "../lib/types";
import { DocumentUpload } from "./document-upload";
import { RecordForm } from "./record-form";
import { ActivityView } from "./activity-view";
import {
  ArchiveView,
} from "./views";
import { ShareExportView } from "./share-export-view";
import { AppointmentForm } from "./appointment-form";
import { AppointmentsView } from "./appointments-view";
import { HealthProfileView } from "./health-profile-view";
import { MedicationForm } from "./medication-form";
import { MedicationsView } from "./medications-view";
import { ClinicalFactForm } from "./clinical-fact-form";
import { ClinicalFactsView } from "./clinical-facts-view";
import { authFetch, openAuthenticatedFile } from "../lib/supabase";
import { DynamicDocumentsView, DynamicHomeView, DynamicRecordsView, DynamicTimelineView } from "./dynamic-views";
import { SpecialistsView } from "./specialists-view";

const paths: Record<ViewId, string> = {
  home: "/",
  timeline: "/timeline",
  appointments: "/appointments",
  medications: "/medications",
  "clinical-facts": "/health-details",
  "health-profile": "/health-profile",
  dental: "/health-areas/dental",
  records: "/records",
  documents: "/documents",
  activity: "/access-history",
  exports: "/exports",
  archive: "/archive",
};

export function AppShell({
  displayName,
  email,
  onSignOut,
  onManageAccount,
}: {
  displayName: string;
  email: string;
  onSignOut: () => Promise<unknown>;
  onManageAccount: () => void;
}) {
  const initials =
    displayName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || email.slice(0, 2).toUpperCase();
  const [view, setView] = useState<ViewId>("home");
  const [menu, setMenu] = useState(false);
  const [records, setRecords] = useState<HealthRecord[]>([]);
  const [recordsStatus, setRecordsStatus] = useState<
    "loading" | "saved" | "demo"
  >("loading");
  const [recordError, setRecordError] = useState("");
  const [healthDocuments, setHealthDocuments] = useState<HealthDocument[]>([]);
  const [documentsStatus, setDocumentsStatus] = useState<
    "loading" | "saved" | "unavailable"
  >("loading");
  const [documentError, setDocumentError] = useState("");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [auditStatus, setAuditStatus] = useState<
    "loading" | "ready" | "unavailable"
  >("loading");
  const [auditError, setAuditError] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<HealthRecord | null>(null);
  const [archivedRecords, setArchivedRecords] = useState<HealthRecord[]>([]);
  const [archiveStatus, setArchiveStatus] = useState<
    "loading" | "ready" | "unavailable"
  >("loading");
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [appointmentStatus, setAppointmentStatus] = useState<"loading" | "ready" | "unavailable">("loading");
  const [appointmentError, setAppointmentError] = useState("");
  const [appointmentFormOpen, setAppointmentFormOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [healthProfile, setHealthProfile] = useState<HealthProfile | null>(null);
  const [profileStatus, setProfileStatus] = useState<"loading" | "ready" | "unavailable">("loading");
  const [profileError, setProfileError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [medications, setMedications] = useState<Medication[]>([]);
  const [medicationStatus, setMedicationStatus] = useState<"loading"|"ready"|"unavailable">("loading");
  const [medicationError, setMedicationError] = useState("");
  const [medicationFormOpen, setMedicationFormOpen] = useState(false);
  const [editingMedication, setEditingMedication] = useState<Medication|null>(null);
  const [clinicalFacts,setClinicalFacts]=useState<ClinicalFact[]>([]);
  const [clinicalFactsStatus,setClinicalFactsStatus]=useState<"loading"|"ready"|"unavailable">("loading");
  const [clinicalFactsError,setClinicalFactsError]=useState("");
  const [clinicalFactFormOpen,setClinicalFactFormOpen]=useState(false);
  const [editingClinicalFact,setEditingClinicalFact]=useState<ClinicalFact|null>(null);
  useEffect(() => {
    let active=true;authFetch("/api/clinical-facts").then(async response=>{const body=await response.json() as{facts?:ClinicalFact[];error?:string};if(!response.ok)throw new Error(body.error??"Unable to load health details.");return body.facts??[];}).then(facts=>{if(active){setClinicalFacts(facts);setClinicalFactsStatus("ready");}}).catch(error=>{if(active){setClinicalFactsError(error instanceof Error?error.message:"Unable to load health details.");setClinicalFactsStatus("unavailable");}});return()=>{active=false;};
  },[]);

  useEffect(() => {
    let active=true;
    authFetch("/api/medications").then(async response=>{const body=await response.json() as {medications?:Medication[];error?:string};if(!response.ok)throw new Error(body.error??"Unable to load medications.");return body.medications??[];}).then(items=>{if(active){setMedications(items);setMedicationStatus("ready");}}).catch(error=>{if(active){setMedicationError(error instanceof Error?error.message:"Unable to load medications.");setMedicationStatus("unavailable");}});
    return()=>{active=false;};
  },[]);

  useEffect(() => {
    let active = true;
    authFetch("/api/health-profile").then(async response => { const body = await response.json() as { profile?: HealthProfile; error?: string }; if(!response.ok||!body.profile) throw new Error(body.error??"Unable to load health essentials."); return body.profile; }).then(profile => { if(active){setHealthProfile(profile);setProfileStatus("ready");} }).catch(error => { if(active){setProfileError(error instanceof Error?error.message:"Unable to load health essentials.");setProfileStatus("unavailable");} });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    authFetch("/api/appointments").then(async response => {
      const body = await response.json() as { appointments?: Appointment[]; error?: string };
      if (!response.ok) throw new Error(body.error ?? "Unable to load appointments.");
      return body.appointments ?? [];
    }).then(items => { if (active) { setAppointments(items); setAppointmentStatus("ready"); } }).catch(error => { if (active) { setAppointmentError(error instanceof Error ? error.message : "Unable to load appointments."); setAppointmentStatus("unavailable"); } });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const syncFromUrl = () => {
      const match = (Object.entries(paths) as [ViewId, string][]).find(
        ([, path]) => path === window.location.pathname,
      );
      setView(match?.[0] ?? "home");
    };
    syncFromUrl();
    window.addEventListener("popstate", syncFromUrl);
    return () => window.removeEventListener("popstate", syncFromUrl);
  }, []);

  useEffect(() => {
    let active = true;
    authFetch("/api/documents")
      .then(async (response) => {
        const body = (await response.json()) as {
          documents?: HealthDocument[];
          error?: string;
        };
        if (!response.ok)
          throw new Error(body.error ?? "Unable to load documents.");
        return body.documents ?? [];
      })
      .then((savedDocuments) => {
        if (active) {
          setHealthDocuments(savedDocuments);
          setDocumentsStatus("saved");
        }
      })
      .catch((error: unknown) => {
        if (active) {
          setDocumentError(
            error instanceof Error
              ? error.message
              : "Unable to load documents.",
          );
          setDocumentsStatus("unavailable");
        }
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    authFetch("/api/records")
      .then(async (response) => {
        const body = (await response.json()) as {
          records?: HealthRecord[];
          error?: string;
        };
        if (!response.ok)
          throw new Error(body.error ?? "Unable to load saved records.");
        return body.records ?? [];
      })
      .then((savedRecords) => {
        if (active) {
          setRecords(savedRecords);
          setRecordsStatus("saved");
        }
      })
      .catch((error: unknown) => {
        if (active) {
          setRecordError(
            error instanceof Error
              ? error.message
              : "Unable to load saved records.",
          );
          setRecordsStatus("demo");
        }
      });
    return () => {
      active = false;
    };
  }, []);

  const loadAudit = async () => {
    setAuditStatus("loading");
    setAuditError("");
    try {
      const response = await authFetch("/api/audit");
      const body = (await response.json()) as {
        events?: AuditEvent[];
        error?: string;
      };
      if (!response.ok)
        throw new Error(body.error ?? "Unable to load access history.");
      setAuditEvents(body.events ?? []);
      setAuditStatus("ready");
    } catch (error) {
      setAuditError(
        error instanceof Error
          ? error.message
          : "Unable to load access history.",
      );
      setAuditStatus("unavailable");
    }
  };
  const loadArchive = async () => {
    setArchiveStatus("loading");
    try {
      const response = await authFetch("/api/records?archived=true");
      const body = (await response.json()) as { records?: HealthRecord[] };
      if (!response.ok) throw new Error();
      setArchivedRecords(body.records ?? []);
      setArchiveStatus("ready");
    } catch {
      setArchiveStatus("unavailable");
    }
  };
  const navigate = (destination: ViewId) => {
    setView(destination);
    setMenu(false);
    window.history.pushState({}, "", paths[destination]);
    if (destination === "activity") void loadAudit();
    if (destination === "archive") void loadArchive();
  };
  const openAdd = () => {
    setEditingRecord(null);
    setFormOpen(true);
  };
  const openEdit = (record: HealthRecord) => {
    setEditingRecord(record);
    setFormOpen(true);
  };
  const openUpload = () => setUploadOpen(true);
  const documentUploaded = (document: HealthDocument) => {
    setHealthDocuments((current) => [document, ...current]);
    setDocumentsStatus("saved");
    setUploadOpen(false);
    navigate("documents");
  };
  const openDocument = (document: HealthDocument) => { void openAuthenticatedFile(`/api/documents?id=${encodeURIComponent(document.id)}`); };
  const saveRecord = async (draft: Omit<HealthRecord, "id" | "source">) => {
    setRecordError("");
    const response = await authFetch("/api/records", {
      method: editingRecord ? "PUT" : "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...draft, id: editingRecord?.id }),
    });
    const body = (await response.json()) as {
      record?: HealthRecord;
      error?: string;
    };
    if (!response.ok || !body.record) {
      setRecordError(body.error ?? "Unable to save this record.");
      throw new Error(body.error ?? "Unable to save this record.");
    }
    if (editingRecord)
      setRecords((current) =>
        current.map((record) =>
          record.id === editingRecord.id ? body.record! : record,
        ),
      );
    else setRecords((current) => [body.record!, ...current]);
    setRecordsStatus("saved");
    setFormOpen(false);
    navigate("records");
  };
  const archiveRecord = async (record: HealthRecord) => {
    if (!window.confirm(`Archive “${record.title}”? You can restore it later.`))
      return;
    const response = await authFetch(
      `/api/records?id=${encodeURIComponent(record.id)}`,
      { method: "DELETE" },
    );
    if (!response.ok) {
      setRecordError("Unable to archive this record.");
      return;
    }
    setRecords((current) => current.filter((item) => item.id !== record.id));
  };
  const restoreRecord = async (record: HealthRecord) => {
    const response = await authFetch("/api/records", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: record.id }),
    });
    const body = (await response.json()) as { record?: HealthRecord };
    if (!response.ok || !body.record) return;
    setArchivedRecords((current) =>
      current.filter((item) => item.id !== record.id),
    );
    setRecords((current) => [body.record!, ...current]);
  };
  const openAppointment = (appointment: Appointment | null = null) => { setEditingAppointment(appointment); setAppointmentFormOpen(true); };
  const saveAppointment = async (draft: Omit<Appointment, "id" | "status">) => {
    const response = await authFetch("/api/appointments", { method: editingAppointment ? "PUT" : "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...draft, id: editingAppointment?.id }) });
    const body = await response.json() as { appointment?: Appointment; error?: string };
    if (!response.ok || !body.appointment) throw new Error(body.error ?? "Unable to save appointment.");
    setAppointments(current => editingAppointment ? current.map(item => item.id === editingAppointment.id ? body.appointment! : item) : [...current, body.appointment!].sort((a,b) => a.startsAt.localeCompare(b.startsAt)));
    setAppointmentStatus("ready"); setAppointmentFormOpen(false); navigate("appointments");
  };
  const changeAppointmentStatus = async (appointment: Appointment, action: "cancel" | "complete") => {
    const prompt = action === "complete" ? `Mark “${appointment.title}” complete and add it to your health records?` : `Cancel “${appointment.title}”?`;
    if (!window.confirm(prompt)) return;
    const response = await authFetch("/api/appointments", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: appointment.id, action }) });
    const body = await response.json() as { appointment?: Appointment; error?: string };
    if (!response.ok || !body.appointment) { setAppointmentError(body.error ?? "Unable to update appointment."); return; }
    setAppointments(current => current.map(item => item.id === appointment.id ? body.appointment! : item));
    if (action === "complete") authFetch("/api/records").then(response => response.json()).then((result: { records?: HealthRecord[] }) => { if (result.records) setRecords(result.records); });
  };
  const saveHealthProfile = async (profile: Omit<HealthProfile,"reviewedAt">) => {
    const response = await authFetch("/api/health-profile",{method:"PUT",headers:{"content-type":"application/json"},body:JSON.stringify(profile)});
    const body = await response.json() as {profile?:HealthProfile;error?:string};
    if(!response.ok||!body.profile) throw new Error(body.error??"Unable to save health essentials.");
    setHealthProfile(body.profile);setProfileStatus("ready");setProfileError("");
  };
  const openMedication=(medication:Medication|null=null)=>{setEditingMedication(medication);setMedicationFormOpen(true);};
  const saveMedication=async(draft:Omit<Medication,"id">)=>{const response=await authFetch("/api/medications",{method:editingMedication?"PUT":"POST",headers:{"content-type":"application/json"},body:JSON.stringify({...draft,id:editingMedication?.id})});const body=await response.json() as {medication?:Medication;error?:string};if(!response.ok||!body.medication)throw new Error(body.error??"Unable to save medication.");setMedications(current=>editingMedication?current.map(item=>item.id===editingMedication.id?body.medication!:item):[...current,body.medication!].sort((a,b)=>a.name.localeCompare(b.name)));setMedicationStatus("ready");setMedicationFormOpen(false);navigate("medications");};
  const openClinicalFact=(fact:ClinicalFact|null=null)=>{setEditingClinicalFact(fact);setClinicalFactFormOpen(true);};
  const saveClinicalFact=async(draft:Omit<ClinicalFact,"id">)=>{const response=await authFetch("/api/clinical-facts",{method:editingClinicalFact?"PUT":"POST",headers:{"content-type":"application/json"},body:JSON.stringify({...draft,id:editingClinicalFact?.id})});const body=await response.json() as{fact?:ClinicalFact;error?:string};if(!response.ok||!body.fact)throw new Error(body.error??"Unable to save health detail.");setClinicalFacts(current=>editingClinicalFact?current.map(item=>item.id===editingClinicalFact.id?body.fact!:item):[...current,body.fact!]);setClinicalFactsStatus("ready");setClinicalFactFormOpen(false);navigate("clinical-facts");};
  const timelineItems:TimelineEntry[]=[
    ...records.map(item=>({id:`record-${item.id}`,date:`${item.date}T12:00:00`,type:item.type,title:item.title,provider:item.provider||"No provider recorded",source:"Entered by you" as const,tone:"teal" as const,destination:"records" as ViewId})),
    ...healthDocuments.map(item=>({id:`document-${item.id}`,date:item.uploadedAt,type:"Document",title:item.title,provider:item.healthArea,source:"Uploaded document" as const,tone:"blue" as const,destination:"documents" as ViewId})),
    ...appointments.map(item=>({id:`appointment-${item.id}`,date:item.startsAt,type:`${item.status[0].toUpperCase()+item.status.slice(1)} appointment`,title:item.title,provider:[item.provider,item.facility].filter(Boolean).join(" · ")||"No provider recorded",source:"Appointment" as const,tone:"amber" as const,destination:"appointments" as ViewId})),
    ...medications.filter(item=>item.startDate).map(item=>({id:`medication-${item.id}`,date:`${item.startDate}T12:00:00`,type:`${item.status[0].toUpperCase()+item.status.slice(1)} medication`,title:`${item.name}${item.dosage?` ${item.dosage}`:""}`,provider:item.prescribingProvider||"No prescriber recorded",source:"Medication" as const,tone:"amber" as const,destination:"medications" as ViewId})),
    ...clinicalFacts.filter(item=>item.onsetDate).map(item=>({id:`fact-${item.id}`,date:`${item.onsetDate}T12:00:00`,type:item.kind==="allergy"?"Allergy":"Condition",title:item.name,provider:item.confirmingProvider||"No provider recorded",source:"Health detail" as const,tone:"blue" as const,destination:"clinical-facts" as ViewId})),
  ].sort((a,b)=>b.date.localeCompare(a.date));
  const areaCount=(name:string)=>records.filter(item=>item.type.toLowerCase()===name.toLowerCase()).length+healthDocuments.filter(item=>item.healthArea.toLowerCase()===name.toLowerCase()).length+appointments.filter(item=>item.healthArea.toLowerCase()===name.toLowerCase()).length;
  const dynamicHealthAreas:HealthArea[]=[
    {name:"Primary care",detail:`${areaCount("Primary care")} saved items`,code:"PC",tone:"blue",destination:"records"},
    {name:"Dental",detail:`${areaCount("Dental")} saved items`,code:"DE",tone:"teal",destination:"records"},
    {name:"Vision",detail:`${areaCount("Vision")} saved items`,code:"VI",tone:"purple",destination:"records"},
    {name:"Specialists",detail:`${areaCount("Specialist")} saved items`,code:"SP",tone:"amber",destination:"dental"},
    {name:"Medications",detail:`${medications.filter(item=>item.status==="active").length} active`,code:"RX",tone:"coral",destination:"medications"},
    {name:"Lab results",detail:`${areaCount("Lab result")} saved items`,code:"LB",tone:"green",destination:"records"},
  ];
  const normalizedSearch = searchQuery.trim().toLowerCase();
  const searchResults = normalizedSearch ? [
    ...records.map(record=>({key:`record-${record.id}`,title:record.title,detail:[record.type,record.provider].filter(Boolean).join(" · "),view:"records" as ViewId,terms:[record.title,record.type,record.provider,record.notes].join(" ")})),
    ...healthDocuments.map(document=>({key:`document-${document.id}`,title:document.title,detail:`Document · ${document.healthArea}`,view:"documents" as ViewId,terms:[document.title,document.fileName,document.healthArea].join(" ")})),
    ...appointments.map(appointment=>({key:`appointment-${appointment.id}`,title:appointment.title,detail:["Appointment",appointment.provider,appointment.facility].filter(Boolean).join(" · "),view:"appointments" as ViewId,terms:[appointment.title,appointment.healthArea,appointment.provider,appointment.facility,appointment.location,appointment.preparation].join(" ")})),
    ...medications.map(medication=>({key:`medication-${medication.id}`,title:`${medication.name}${medication.dosage?` ${medication.dosage}`:""}`,detail:`${medication.status} medication`,view:"medications" as ViewId,terms:[medication.name,medication.dosage,medication.frequency,medication.instructions,medication.prescribingProvider,medication.pharmacy,medication.notes].join(" ")})),
    ...clinicalFacts.map(fact=>({key:`fact-${fact.id}`,title:fact.name,detail:`${fact.severity} ${fact.kind}`,view:"clinical-facts" as ViewId,terms:[fact.name,fact.kind,fact.severity,fact.reaction,fact.confirmingProvider,fact.notes].join(" ")})),
    ...(healthProfile&&healthProfile.primaryProvider?[{key:"primary-provider",title:healthProfile.primaryProvider,detail:"Primary care provider",view:"health-profile" as ViewId,terms:healthProfile.primaryProvider}]:[]),
  ].filter(result=>result.terms.toLowerCase().includes(normalizedSearch)).slice(0,8):[];

  return (
    <div className="app-shell">
      <aside className={menu ? "sidebar open" : "sidebar"}>
        <div className="brand">
          <span>+</span>
          <div>
            <strong>PostCare</strong>
            <small>Personal health record</small>
          </div>
        </div>
        <nav>
          {navigationItems.map((item) => (
            <button
              key={item.id}
              className={view === item.id ? "active" : ""}
              onClick={() => navigate(item.id)}
            >
              <span>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="account-bottom">
            <div className="account-card">
              <button className="profile profile-button" onClick={onManageAccount}>
                <span>{initials}</span>
                <div>
                  <strong>{displayName}</strong>
                  <small>{email}</small>
                </div>
              </button>
              <button
                className="account-signout"
                aria-label="Sign out"
                title="Sign out"
                onClick={() => { void onSignOut(); }}
              >
                <span aria-hidden="true">↪</span>
              </button>
            </div>
          </div>
        </div>
      </aside>
      <main className="main">
        <div className="mobile-top">
          <button onClick={() => setMenu(!menu)}>☰</button>
          <div className="brand">
            <span>+</span>
            <strong>PostCare</strong>
          </div>
        </div>
        <div className="topbar">
          <div className="global-search">
            <label>⌕ <input value={searchQuery} onChange={event=>setSearchQuery(event.target.value)} placeholder="Search your health record" aria-label="Search your health record" /></label>
            {normalizedSearch&&<div className="search-results">{searchResults.length?<>{searchResults.map(result=><button key={result.key} onClick={()=>{navigate(result.view);setSearchQuery("");}}><span><strong>{result.title}</strong><small>{result.detail}</small></span><b>→</b></button>)}</>:<div className="search-empty">No matching records, documents, appointments, or health essentials.</div>}</div>}
          </div>
        </div>
        <div className="content">
          {view === "home" && (
            <DynamicHomeView
              displayName={displayName}
              setView={navigate}
              onAdd={openAdd}
              onUpload={openUpload}
              nextAppointment={appointments.find(item => item.status === "scheduled") ?? null}
              healthProfile={healthProfile}
              activeMedicationCount={medications.filter(item=>item.status==="active").length}
              activeAllergies={clinicalFacts.filter(item=>item.kind==="allergy"&&item.status==="active").map(item=>item.name)}
              healthAreas={dynamicHealthAreas}
              timeline={timelineItems}
            />
          )}
          {view === "appointments" && <AppointmentsView appointments={appointments} status={appointmentStatus} error={appointmentError} onAdd={() => openAppointment()} onEdit={openAppointment} onStatus={changeAppointmentStatus} />}
          {view === "health-profile" && <HealthProfileView profile={healthProfile} status={profileStatus} error={profileError} onSave={saveHealthProfile} />}
          {view === "medications" && (
            <MedicationsView medications={medications} status={medicationStatus} error={medicationError} onAdd={() => openMedication()} onEdit={openMedication} />
          )}
          {view === "clinical-facts" && (
            <ClinicalFactsView facts={clinicalFacts} status={clinicalFactsStatus} error={clinicalFactsError} onAdd={() => openClinicalFact()} onEdit={openClinicalFact} />
          )}
          {view === "timeline" && <DynamicTimelineView items={timelineItems} onAdd={openAdd} onNavigate={navigate} />}
          {view === "dental" && <SpecialistsView records={records} documents={healthDocuments} appointments={appointments} onAdd={openAdd} onUpload={openUpload} onDocuments={()=>navigate("documents")} />}
          {view === "records" && (
            <DynamicRecordsView
              records={records}
              medications={medications}
              facts={clinicalFacts}
              status={recordsStatus}
              error={recordError}
              onAdd={openAdd}
              onEdit={openEdit}
              onArchive={archiveRecord}
              onNavigate={navigate}
            />
          )}
          {view === "archive" && (
            <ArchiveView
              records={archivedRecords}
              status={archiveStatus}
              onRestore={restoreRecord}
            />
          )}
          {view === "documents" && (
            <DynamicDocumentsView
              documents={healthDocuments}
              status={documentsStatus}
              error={documentError}
              onUpload={openUpload}
              onOpen={openDocument}
            />
          )}
          {view === "exports" && (
            <ShareExportView
              records={records}
              documentCount={healthDocuments.length}
            />
          )}
          {view === "activity" && (
            <ActivityView
              events={auditEvents}
              status={auditStatus}
              error={auditError}
              onRefresh={loadAudit}
            />
          )}
        </div>
      </main>
      {menu && (
        <button
          className="scrim"
          aria-label="Close navigation"
          onClick={() => setMenu(false)}
        />
      )}
      <nav className="mobile-nav">
        <button
          onClick={() => navigate("home")}
          className={view === "home" ? "active" : ""}
        >
          ⌂<span>Home</span>
        </button>
        <button
          onClick={() => navigate("appointments")}
          className={view === "appointments" ? "active" : ""}
        >
          ◫<span>Appointments</span>
        </button>
        <button className="add-mobile" onClick={openAdd}>
          ＋<span>Add</span>
        </button>
        <button
          onClick={() => navigate("documents")}
          className={view === "documents" ? "active" : ""}
        >
          □<span>Documents</span>
        </button>
        <button onClick={() => setMenu(true)}>
          ☰<span>More</span>
        </button>
      </nav>
      {formOpen && (
        <RecordForm
          record={editingRecord}
          onSave={saveRecord}
          onClose={() => setFormOpen(false)}
        />
      )}
      {uploadOpen && (
        <DocumentUpload
          onUploaded={documentUploaded}
          onClose={() => setUploadOpen(false)}
        />
      )}
      {appointmentFormOpen && <AppointmentForm appointment={editingAppointment} onSave={saveAppointment} onClose={() => setAppointmentFormOpen(false)} />}
      {medicationFormOpen && (
        <MedicationForm medication={editingMedication} onSave={saveMedication} onClose={() => setMedicationFormOpen(false)} />
      )}
      {clinicalFactFormOpen && (
        <ClinicalFactForm fact={editingClinicalFact} onSave={saveClinicalFact} onClose={() => setClinicalFactFormOpen(false)} />
      )}
    </div>
  );
}
