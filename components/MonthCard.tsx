"use client";

import { useState, useEffect } from "react";
import type { ProjectRow } from "@/lib/types";
import { fmtRp, fmtDate, statusPillClass } from "@/lib/format";

const LAST_OPEN_KEY = "monitoring-proyek:last-open-card";

export default function MonthCard({
  label,
  rows,
  onEdit,
  onDelete,
}: {
  label: string;
  rows: ProjectRow[];
  onEdit: (row: ProjectRow) => void;
  onDelete: (row: ProjectRow) => void;
}) {
  const total = rows.reduce((a, p) => a + p.value, 0);
  const paidCount = rows.filter((p) => p.status === "Paid").length;

  // Sort rows: group by client (alphabetical), then by project name within each client
  const sortedRows = [...rows].sort((a, b) => {
    const clientA = (a.client_norm || a.client || "").toLowerCase();
    const clientB = (b.client_norm || b.client || "").toLowerCase();
    if (clientA !== clientB) return clientA.localeCompare(clientB, "id");
    return (a.project || "").toLowerCase().localeCompare((b.project || "").toLowerCase(), "id");
  });


  // On mount: open only if this card was the last one opened (or none was saved)
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    try {
      const last = localStorage.getItem(LAST_OPEN_KEY);
      // If no record yet (first visit), default all collapsed
      if (last === label) {
        setExpanded(true);
      }
    } catch {
      // localStorage not available, leave collapsed
    }
  }, [label]);

  function toggle() {
    const next = !expanded;
    setExpanded(next);
    if (next) {
      try {
        localStorage.setItem(LAST_OPEN_KEY, label);
      } catch {
        // ignore
      }
    } else {
      // If user collapses the last opened card, clear the stored key
      try {
        const last = localStorage.getItem(LAST_OPEN_KEY);
        if (last === label) localStorage.removeItem(LAST_OPEN_KEY);
      } catch {
        // ignore
      }
    }
  }

  return (
    <div className="month-card">
      <button
        type="button"
        className="month-card-header month-card-toggle"
        onClick={toggle}
        aria-expanded={expanded}
        aria-controls={`mc-body-${label}`}
      >
        <div>
          <div className="month-card-title">{label}</div>
          <div className="month-card-sub">
            {rows.length} invoice · {paidCount} lunas
          </div>
        </div>
        <div className="month-card-header-right">
          <div className="month-card-total">{fmtRp(total)}</div>
          <span
            className={`month-card-chevron${expanded ? " expanded" : ""}`}
            aria-hidden="true"
          >
            ▾
          </span>
        </div>
      </button>

      <div
        id={`mc-body-${label}`}
        className={`month-card-body${expanded ? " open" : ""}`}
      >
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Klien</th>
                <th>Proyek</th>
                <th>No. Kontrak/PO</th>
                <th>PIC</th>
                <th style={{ textAlign: "right" }}>Nilai</th>
                <th>Status</th>
                <th>Tgl Submit Invoice</th>
                <th>Tgl Bayar</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {sortedRows.map((p) => (
                <tr key={p.id}>
                  <td>{p.client_norm}</td>
                  <td className="proj-name">
                    <div>{p.project}</div>
                    {p.no_invoice && (
                      <div style={{ fontSize: "11px", color: "var(--text-dim)", marginTop: "2px" }}>
                        Inv: {p.no_invoice}
                      </div>
                    )}
                  </td>
                  <td style={{ fontSize: "12px", color: p.no_kontrak ? "var(--text)" : "var(--text-dim)" }}>
                    {p.no_kontrak || "—"}
                  </td>
                  <td>{p.pic}</td>
                  <td className="val">{fmtRp(p.value)}</td>
                  <td>
                    <span className={`pill ${statusPillClass(p.status)}`}>
                      {p.status}
                    </span>
                  </td>
                  <td>{fmtDate(p.invoice_submit)}</td>
                  <td>{fmtDate(p.paid_date)}</td>
                  <td className="row-actions">
                    <button
                      type="button"
                      className="btn-icon"
                      title="Edit"
                      aria-label={`Edit ${p.project}`}
                      onClick={() => onEdit(p)}
                    >
                      ✎
                    </button>
                    <button
                      type="button"
                      className="btn-icon danger"
                      title="Hapus"
                      aria-label={`Hapus ${p.project}`}
                      onClick={() => onDelete(p)}
                    >
                      🗑
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
