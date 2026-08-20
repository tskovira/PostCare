import { useState, type FormEvent } from "react";
import type { HealthDocument } from "../lib/types";
import { authFetch } from "../lib/supabase";

export function DocumentUpload({
  onUploaded,
  onClose,
}: {
  onUploaded: (document: HealthDocument) => void;
  onClose: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [healthArea, setHealthArea] = useState("Primary care");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    if (!file) {
      setError("Choose a file to upload.");
      return;
    }
    setUploading(true);
    const form = new FormData();
    form.set("file", file);
    form.set("title", title);
    form.set("healthArea", healthArea);
    try {
      const response = await authFetch("/api/documents", {
        method: "POST",
        body: form,
      });
      const body = (await response.json()) as {
        document?: HealthDocument;
        error?: string;
      };
      if (!response.ok || !body.document)
        throw new Error(body.error ?? "Upload failed.");
      onUploaded(body.document);
    } catch (uploadError) {
      setError(
        uploadError instanceof Error ? uploadError.message : "Upload failed.",
      );
      setUploading(false);
    }
  };
  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <section
        className="record-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="document-upload-title"
      >
        <div className="modal-head">
          <div>
            <p className="section-label">PRIVATE DOCUMENT STORAGE</p>
            <h2 id="document-upload-title">Upload a document</h2>
          </div>
          <button aria-label="Close upload" onClick={onClose}>
            ×
          </button>
        </div>
        <p className="form-guidance">
          Upload a PDF, JPEG, PNG, or WebP file up to 10 MB. Files are private
          to your signed-in account.
        </p>
        <form onSubmit={submit}>
          <label>
            Document title
            <input
              required
              maxLength={140}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Example: Dental treatment plan"
            />
          </label>
          <label>
            Health area
            <select
              value={healthArea}
              onChange={(event) => setHealthArea(event.target.value)}
            >
              <option>Primary care</option>
              <option>Dental</option>
              <option>Vision</option>
              <option>Specialist</option>
              <option>Medication</option>
              <option>Lab result</option>
              <option>Other</option>
            </select>
          </label>
          <label className="file-drop">
            Choose file
            <input
              required
              type="file"
              accept="application/pdf,image/jpeg,image/png,image/webp"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            />
            <span>
              {file
                ? `${file.name} · ${(file.size / 1024 / 1024).toFixed(2)} MB`
                : "PDF or image · Maximum 10 MB"}
            </span>
          </label>
          <div className="form-note">
            <span>✓</span>
            <p>
              <strong>Private and attributed</strong>The original file and its
              upload source remain linked to your account.
            </p>
          </div>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <div className="modal-actions">
            <button type="button" className="secondary" onClick={onClose}>
              Cancel
            </button>
            <button className="primary" type="submit" disabled={uploading}>
              {uploading ? "Uploading…" : "Upload document"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
