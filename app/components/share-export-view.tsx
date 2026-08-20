"use client";
import { useEffect, useState } from "react";
import type { HealthRecord, ShareGrant } from "../lib/types";
import { Badge } from "./ui";
import { authFetch, openAuthenticatedFile } from "../lib/supabase";

export function ShareExportView({
  records,
  documentCount,
}: {
  records: HealthRecord[];
  documentCount: number;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const [label, setLabel] = useState("My healthcare provider");
  const [days, setDays] = useState(7);
  const [shares, setShares] = useState<ShareGrant[]>([]);
  const [createdUrl, setCreatedUrl] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const loadShares = () =>
    authFetch("/api/shares").then(async (response) => {
      const body = (await response.json()) as { shares?: ShareGrant[] };
      if (response.ok) setShares(body.shares ?? []);
    });
  useEffect(() => {
    void loadShares();
  }, []);
  const toggle = (id: string) =>
    setSelected((current) =>
      current.includes(id)
        ? current.filter((value) => value !== id)
        : [...current, id],
    );
  const createShare = async () => {
    setBusy(true);
    setStatus("");
    setCreatedUrl("");
    try {
      const response = await authFetch("/api/shares", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          label,
          recordIds: selected,
          expiresInDays: days,
        }),
      });
      const body = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !body.url)
        throw new Error(body.error ?? "Unable to create share link.");
      setCreatedUrl(body.url);
      setSelected([]);
      setStatus(
        "Secure link created. Copy it now—the full link is not stored and cannot be shown again.",
      );
      await loadShares();
    } catch (error) {
      setStatus(
        error instanceof Error ? error.message : "Unable to create share link.",
      );
    } finally {
      setBusy(false);
    }
  };
  const revoke = async (id: string) => {
    setBusy(true);
    await authFetch(`/api/shares?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    await loadShares();
    setBusy(false);
  };
  const exports = [
    {
      format: "print",
      icon: "▤",
      title: "Printable health summary",
      detail: "A clean overview for appointments or your files.",
      action: "Open summary",
    },
    {
      format: "csv",
      icon: "CSV",
      title: "Spreadsheet export",
      detail: "Structured records for Excel, Sheets, or Numbers.",
      action: "Download CSV",
    },
    {
      format: "json",
      icon: "{ }",
      title: "Portable data export",
      detail: "Machine-readable records and document metadata.",
      action: "Download JSON",
    },
  ];
  return (
    <>
      <header className="page-heading">
        <div>
          <p className="kicker">CONTROLLED BY YOU</p>
          <h1>Share & export</h1>
          <p>
            Create a limited, read-only care summary or take your data with you.
          </p>
        </div>
      </header>
      <section className="share-builder panel full">
        <div className="section-heading">
          <div>
            <p className="section-label">SECURE SHARING</p>
            <h2>Create a time-limited link</h2>
          </div>
          <Badge kind="confirmed">Read only</Badge>
        </div>
        <p className="share-guidance">
          Choose exactly what a provider can see. The link expires automatically
          and can be revoked at any time. Documents and account details are
          never included.
        </p>
        <div className="share-fields">
          <label>
            Label
            <input
              value={label}
              onChange={(event) => setLabel(event.target.value)}
              maxLength={100}
            />
          </label>
          <label>
            Expires
            <select
              value={days}
              onChange={(event) => setDays(Number(event.target.value))}
            >
              <option value={1}>In 24 hours</option>
              <option value={7}>In 7 days</option>
              <option value={14}>In 14 days</option>
              <option value={30}>In 30 days</option>
            </select>
          </label>
        </div>
        <fieldset>
          <legend>Select records</legend>
          {records.map((record) => (
            <label className="share-record" key={record.id}>
              <input
                type="checkbox"
                checked={selected.includes(record.id)}
                onChange={() => toggle(record.id)}
              />
              <span>
                <strong>{record.title}</strong>
                <small>
                  {record.type} · {record.date} ·{" "}
                  {record.provider || "No provider"}
                </small>
              </span>
            </label>
          ))}
        </fieldset>
        <button
          className="primary"
          disabled={busy || selected.length === 0}
          onClick={createShare}
        >
          {busy
            ? "Working…"
            : `Create link for ${selected.length} record${selected.length === 1 ? "" : "s"}`}
        </button>
        {status && (
          <p className={createdUrl ? "share-success" : "form-error"}>
            {status}
          </p>
        )}
        {createdUrl && (
          <div className="share-url">
            <input aria-label="Secure share link" readOnly value={createdUrl} />
            <button
              className="secondary"
              onClick={() => navigator.clipboard.writeText(createdUrl)}
            >
              Copy link
            </button>
          </div>
        )}
      </section>
      <section className="section-block">
        <div className="section-heading">
          <div>
            <p className="section-label">ACTIVE AND PAST LINKS</p>
            <h2>Sharing controls</h2>
          </div>
        </div>
        <div className="share-list">
          {shares.length === 0 ? (
            <div className="panel share-empty">No share links created yet.</div>
          ) : (
            shares.map((share) => (
              <article className="panel share-row" key={share.id}>
                <div>
                  <Badge kind={share.active ? "confirmed" : "upload"}>
                    {share.active
                      ? "Active"
                      : share.revokedAt
                        ? "Revoked"
                        : "Expired"}
                  </Badge>
                  <strong>{share.label}</strong>
                  <small>
                    {share.recordCount} records · Expires{" "}
                    {new Date(share.expiresAt).toLocaleString()}
                  </small>
                  <small>
                    {share.accessCount
                      ? `Opened ${share.accessCount} time${share.accessCount === 1 ? "" : "s"}`
                      : "Not opened yet"}
                  </small>
                </div>
                {share.active && (
                  <button
                    className="secondary"
                    disabled={busy}
                    onClick={() => revoke(share.id)}
                  >
                    Revoke
                  </button>
                )}
              </article>
            ))
          )}
        </div>
      </section>
      <section className="section-block">
        <div className="section-heading">
          <div>
            <p className="section-label">PORTABLE EXPORTS</p>
            <h2>Download your health data</h2>
          </div>
          <span className="storage-status saved">
            {records.length} records · {documentCount} files
          </span>
        </div>
        <div className="export-grid">
          {exports.map((option) => (
            <article className="export-card" key={option.format}>
              <span className="export-icon">{option.icon}</span>
              <h2>{option.title}</h2>
              <p>{option.detail}</p>
              <button
                className="primary export-action"
                onClick={() => { void openAuthenticatedFile(`/api/export?format=${option.format}`); }}
              >
                {option.action} →
              </button>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
