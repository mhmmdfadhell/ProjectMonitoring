"use client";

import { useMemo, useState } from "react";
import type { MonitoringData, ProjectStatus } from "@/lib/types";
import { useProjects } from "@/lib/useProjects";
import { fmtRp, fmtDate, statusPillClass } from "@/lib/format";
import { buildMonthlyReport, getAvailableReportPeriods } from "@/lib/report";

type StatusFilter = "all" | ProjectStatus;

const STATUS_FILTER_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "Semua Status" },
  { value: "Invoiced - Unpaid", label: "Belum Terbayar" },
  { value: "In Progress", label: "Dalam Progress" },
  { value: "BAST Done - No Invoice", label: "Menunggu BAST Done" },
  { value: "Paid", label: "Sudah Terbayar (periode ini)" },
];

export default function LaporanBulananView({ data }: { data: MonitoringData }) {
  const { projects } = useProjects(data.projects);
  const { month_order } = data;

  const periods = useMemo(
    () => getAvailableReportPeriods(projects, month_order),
    [projects, month_order]
  );

  const defaultPeriod = useMemo(() => {
    if (periods.length === 0) {
      const now = new Date();
      return { month: month_order[now.getMonth()], year: now.getFullYear() };
    }
    // Coba cocokkan ke bulan berjalan (real-world) bila datanya tersedia,
    // jika tidak pakai periode terbaru yang ada di data.
    const now = new Date();
    const nowMonth = month_order[now.getMonth()];
    const nowYear = now.getFullYear();
    const match = periods.find((p) => p.month === nowMonth && p.year === nowYear);
    return match || periods[periods.length - 1];
  }, [periods, month_order]);

  const [year, setYear] = useState<number>(defaultPeriod.year);
  const [month, setMonth] = useState<string>(defaultPeriod.month);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const years = useMemo(
    () => [...new Set(periods.map((p) => p.year))].sort((a, b) => b - a),
    [periods]
  );

  const { rows, summary } = useMemo(
    () => buildMonthlyReport(projects, month, year, month_order),
    [projects, month, year, month_order]
  );

  const filteredRows = useMemo(() => {
    if (statusFilter === "all") return rows;
    return rows.filter((r) => r.status === statusFilter);
  }, [rows, statusFilter]);

  const grandTotal = filteredRows.reduce((a, r) => a + (r.value || 0), 0);

  const kpis = [
    {
      label: "Belum Terbayar",
      value: fmtRp(summary.unpaidTotal),
      sub: `${summary.unpaidCount} invoice`,
      accent: "var(--amber)",
      filter: "Invoiced - Unpaid" as StatusFilter,
    },
    {
      label: "Dalam Progress",
      value: fmtRp(summary.progressTotal),
      sub: `${summary.progressCount} proyek`,
      accent: "var(--coral)",
      filter: "In Progress" as StatusFilter,
    },
    {
      label: "Menunggu BAST Done",
      value: fmtRp(summary.bastTotal),
      sub: `${summary.bastCount} proyek`,
      accent: "var(--slate)",
      filter: "BAST Done - No Invoice" as StatusFilter,
    },
    {
      label: "Sudah Terbayar",
      value: fmtRp(summary.paidTotal),
      sub: `${summary.paidCount} invoice cair periode ini`,
      accent: "var(--mint)",
      filter: "Paid" as StatusFilter,
    },
  ];

  return (
    <div className="wrap">
      <header>
        <div>
          <div className="brand-eyebrow">// Project Cash</div>
          <h1>Report Bulanan</h1>
          <div className="subtitle">
            Status seluruh invoice per periode — item yang belum lunas otomatis terbawa
            (carry-over) ke laporan bulan berikutnya sampai statusnya Paid
          </div>
        </div>
      </header>

      <div className="panel">
        <div className="controls" style={{ marginBottom: 18 }}>
          <select value={month} onChange={(e) => setMonth(e.target.value)}>
            {month_order.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
          <select value={year} onChange={(e) => setYear(Number(e.target.value))}>
            {years.length === 0 && <option value={year}>{year}</option>}
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        <div className="kpi-row">
          {kpis.map((k) => (
            <button
              type="button"
              key={k.label}
              className="kpi kpi-clickable"
              style={{ ["--kpi-accent" as string]: k.accent }}
              onClick={() =>
                setStatusFilter((cur) => (cur === k.filter ? "all" : k.filter))
              }
              aria-pressed={statusFilter === k.filter}
            >
              <div className="kpi-label">{k.label}</div>
              <div className="kpi-value">{k.value}</div>
              <div className="kpi-sub">{k.sub}</div>
            </button>
          ))}
        </div>

        <div className="panel-title">
          Report {month} {year}
          <span className="tag">{filteredRows.length} baris · {fmtRp(grandTotal)}</span>
        </div>

        <div className="controls" style={{ marginBottom: 14 }}>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
          >
            {STATUS_FILTER_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Bulan Asal</th>
                <th>Klien</th>
                <th>Proyek / Invoice</th>
                <th>PIC</th>
                <th style={{ textAlign: "right" }}>Nilai</th>
                <th>Status</th>
                <th>No. Invoice</th>
                <th>No. Kontrak/PO</th>
                <th>Tgl Submit</th>
                <th>Tgl Bayar</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((r) => (
                <tr key={r.id}>
                  <td>
                    {r.originLabel}
                    {r.isCarriedOver && (
                      <span
                        className="pill unpaid"
                        style={{ marginLeft: 6, fontSize: "10px" }}
                        title="Belum selesai dari bulan sebelumnya"
                      >
                        Carry-over
                      </span>
                    )}
                  </td>
                  <td>{r.client_norm || r.client}</td>
                  <td className="proj-name">{r.project}</td>
                  <td>{r.pic}</td>
                  <td className="val">{fmtRp(r.value)}</td>
                  <td>
                    <span className={`pill ${statusPillClass(r.status)}`}>
                      {r.status}
                    </span>
                  </td>
                  <td>{r.no_invoice || "—"}</td>
                  <td>{r.no_kontrak || "—"}</td>
                  <td>{fmtDate(r.invoice_submit)}</td>
                  <td>{fmtDate(r.paid_date)}</td>
                </tr>
              ))}

              {filteredRows.length === 0 && (
                <tr>
                  <td colSpan={10} style={{ textAlign: "center", padding: "24px", color: "var(--text-dim)" }}>
                    Tidak ada invoice untuk status/periode ini.
                  </td>
                </tr>
              )}

              {filteredRows.length > 0 && (
                <tr className="total-row">
                  <td colSpan={4}>Total</td>
                  <td className="val">{fmtRp(grandTotal)}</td>
                  <td colSpan={5} />
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="foot-note">
        Klik salah satu kartu ringkasan di atas untuk memfilter tabel sesuai kategori status.
        Invoice yang belum Paid akan terus muncul di laporan bulan-bulan berikutnya sampai
        lunas; invoice yang sudah Paid hanya muncul pada laporan bulan saat ia benar-benar cair.
      </div>
    </div>
  );
}
