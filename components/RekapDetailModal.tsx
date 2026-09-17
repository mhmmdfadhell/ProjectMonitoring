"use client";

import { useEffect } from "react";
import type { ProjectRow } from "@/lib/types";
import { fmtRp, fmtDate, statusPillClass } from "@/lib/format";
import type { SummaryRow } from "@/components/SummaryTable";

export default function RekapDetailModal({
  row,
  projects,
  onClose,
}: {
  row: SummaryRow;
  projects: ProjectRow[];
  onClose: () => void;
}) {
  // Close on Escape key press
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-card"
        style={{ maxWidth: "860px" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <h2>Invoice Masuk — {row.label}</h2>
            <div style={{ color: "var(--text-dim)", fontSize: "12px", marginTop: "3px" }}>
              {projects.length} invoice cair jadi cash-in pada periode ini, terurut sesuai tanggal masuk
            </div>
          </div>
          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            aria-label="Tutup"
          >
            ×
          </button>
        </div>

        {/* Quick summary KPI mini-cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
            gap: "10px",
            marginBottom: "16px",
          }}
        >
          <div
            style={{
              background: "var(--surface2)",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              padding: "10px 12px",
            }}
          >
            <div style={{ fontSize: "10.5px", color: "var(--text-faint)", textTransform: "uppercase", fontFamily: "var(--font-mono)", fontWeight: 600 }}>
              Cash In
            </div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "15px", fontWeight: 700, color: "var(--mint)", marginTop: "4px" }}>
              {fmtRp(row.cashInTotal)}
            </div>
          </div>

          <div
            style={{
              background: "var(--surface2)",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              padding: "10px 12px",
            }}
          >
            <div style={{ fontSize: "10.5px", color: "var(--text-faint)", textTransform: "uppercase", fontFamily: "var(--font-mono)", fontWeight: 600 }}>
              Jml Invoice
            </div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "15px", fontWeight: 700, color: "var(--text)", marginTop: "4px" }}>
              {row.invoiceCount}
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Tgl Masuk</th>
                <th>Klien</th>
                <th>Proyek / Invoice</th>
                <th>PIC</th>
                <th style={{ textAlign: "right" }}>Nilai (Rp)</th>
                <th>Status</th>
                <th>No. Invoice</th>
                <th>No. Kontrak/PO</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((p) => (
                <tr key={p.id}>
                  <td>{fmtDate(p.paid_date || p.status_updated_at)}</td>
                  <td>{p.client_norm || p.client}</td>
                  <td className="proj-name">{p.project}</td>
                  <td>{p.pic}</td>
                  <td className="val">{fmtRp(p.value)}</td>
                  <td>
                    <span className={`pill ${statusPillClass(p.status)}`}>
                      {p.status}
                    </span>
                  </td>
                  <td>{p.no_invoice || "—"}</td>
                  <td>{p.no_kontrak || "—"}</td>
                </tr>
              ))}

              {projects.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: "24px", color: "var(--text-dim)" }}>
                    Tidak ada invoice yang masuk pada periode ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Modal Actions */}
        <div className="modal-actions" style={{ marginTop: "18px" }}>
          <button type="button" className="btn btn-primary" onClick={onClose}>
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
