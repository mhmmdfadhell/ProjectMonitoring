import type { ProjectRow } from "@/lib/types";
import { fmtRp } from "@/lib/format";

export default function GroupBars({
  projects,
  groupKey,
  topN,
}: {
  projects: ProjectRow[];
  groupKey: "client_norm" | "pic";
  topN: number;
}) {
  const totals: Record<string, number> = {};
  projects.forEach((p) => {
    const key = p[groupKey];
    totals[key] = (totals[key] || 0) + p.value;
  });

  const entries = Object.entries(totals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN);
  const max = entries.length ? entries[0][1] : 1;

  if (entries.length === 0) {
    return <div style={{ color: "var(--text-faint)", fontSize: 13 }}>Tidak ada data.</div>;
  }

  return (
    <div>
      {entries.map(([name, val]) => (
        <div className="bar-row" key={name}>
          <div className="bar-top">
            <span className="name" title={name}>{name}</span>
            <span className="amt">{fmtRp(val)}</span>
          </div>
          <div className="bar-track">
            <div
              className="bar-fill"
              style={{ width: `${((val / max) * 100).toFixed(1)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
