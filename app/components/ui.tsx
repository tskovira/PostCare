import type { ReactNode } from "react";
import { timelineEntries } from "../lib/demo-data";

export function Badge({ children, kind = "neutral" }: { children: ReactNode; kind?: string }) {
  return <span className={`badge ${kind}`}>{children}</span>;
}

export function TimelineList({ compact = false }: { compact?: boolean }) {
  return (
    <div className="timeline-list">
      {timelineEntries.map((item) => (
        <button className="timeline-item" key={`${item.date}-${item.title}`}>
          <span className={`timeline-dot ${item.tone}`} />
          <span className="timeline-copy">
            <span className="eyebrow">{item.date} · {item.type}</span>
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
