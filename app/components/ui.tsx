import type { ReactNode } from "react";
import type { TimelineEntry, ViewId } from "../lib/types";

export function Badge({ children, kind = "neutral" }: { children: ReactNode; kind?: string }) {
  return <span className={`badge ${kind}`}>{children}</span>;
}

export function TimelineList({ items = [], compact = false, onSelect }: { items?: TimelineEntry[]; compact?: boolean; onSelect?: (view: ViewId) => void }) {
  return (
    <div className="timeline-list">
      {items.length === 0 ? <div className="timeline-empty">No health activity has been recorded yet.</div> : items.map((item) => (
        <button className="timeline-item" key={item.id} onClick={() => onSelect?.(item.destination)}>
          <span className={`timeline-dot ${item.tone}`} />
          <span className="timeline-copy">
            <span className="eyebrow">{new Date(item.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} · {item.type}</span>
            <strong>{item.title}</strong>
            <span className="muted">{item.provider}</span>
            {!compact && (
              <Badge kind={item.source === "Entered by you" ? "self" : "upload"}>
                {item.source}
              </Badge>
            )}
          </span>
          <span className="chevron">›</span>
        </button>
      ))}
    </div>
  );
}
