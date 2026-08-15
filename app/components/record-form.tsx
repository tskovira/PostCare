import { useState, type FormEvent } from "react";
import type { HealthRecord } from "../lib/types";

type RecordDraft = Omit<HealthRecord, "id" | "source">;
const emptyDraft: RecordDraft = { type: "Primary care", title: "", date: "", provider: "", notes: "" };

export function RecordForm({ record, onSave, onClose }: { record: HealthRecord | null; onSave: (draft: RecordDraft) => Promise<void>; onClose: () => void }) {
  const [draft, setDraft] = useState<RecordDraft>(() => record ? { type: record.type, title: record.title, date: record.date, provider: record.provider, notes: record.notes } : emptyDraft);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const update = (field: keyof RecordDraft, value: string) => setDraft((current) => ({ ...current, [field]: value }));
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try { await onSave(draft); }
    catch (saveError) { setError(saveError instanceof Error ? saveError.message : "Unable to save this record."); setSaving(false); }
  };

  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <section className="record-modal" role="dialog" aria-modal="true" aria-labelledby="record-form-title">
      <div className="modal-head"><div><p className="section-label">PERSONAL HEALTH RECORD</p><h2 id="record-form-title">{record ? "Edit record" : "Add a health record"}</h2></div><button aria-label="Close form" onClick={onClose}>×</button></div>
      <p className="form-guidance">Add information from a visit, prescription, procedure, or other part of your care. You can update it later.</p>
      <form onSubmit={submit}>
        <label>Health area<select value={draft.type} onChange={(event) => update("type", event.target.value)}><option>Primary care</option><option>Dental</option><option>Vision</option><option>Specialist</option><option>Medication</option><option>Lab result</option></select></label>
        <label>Record title<input required value={draft.title} onChange={(event) => update("title", event.target.value)} placeholder="Example: Annual wellness visit" /></label>
        <div className="form-row"><label>Date<input required type="date" value={draft.date} onChange={(event) => update("date", event.target.value)} /></label><label>Provider or facility<input value={draft.provider} onChange={(event) => update("provider", event.target.value)} placeholder="Optional" /></label></div>
        <label>Notes<textarea value={draft.notes} onChange={(event) => update("notes", event.target.value)} placeholder="Symptoms, instructions, outcomes, or anything you want to remember" rows={4} /></label>
        <div className="form-note"><span>✓</span><p><strong>Patient-entered record</strong>This record is labeled as entered by you so its origin stays clear.</p></div>
        {error && <p className="form-error" role="alert">{error}</p>}
        <div className="modal-actions"><button type="button" className="secondary" onClick={onClose}>Cancel</button><button className="primary" type="submit" disabled={saving}>{saving ? "Saving…" : record ? "Save changes" : "Add record"}</button></div>
      </form>
    </section>
  </div>;
}
