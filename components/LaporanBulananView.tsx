"use client";

import { useMemo, useState, useRef, useCallback } from "react";
import type { MonitoringData, ProjectStatus } from "@/lib/types";
import { useProjects } from "@/lib/useProjects";
import { fmtRp, fmtDate, statusPillClass, getInvoiceType } from "@/lib/format";
import { buildMonthlyReport, getAvailableReportPeriods } from "@/lib/report";
import { toPng } from "html-to-image";

type StatusFilter = "all" | ProjectStatus;

const STATUS_FILTER_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "Semua Status" },
  { value: "Invoiced - Unpaid", label: "Not Paid" },
  { value: "In Progress", label: "On Progress" },
  { value: "BAST Done - No Invoice", label: "BAST Done Can't Progress" },
  { value: "Paid", label: "Done Payment" },
];

export default function LaporanBulananView({ data }: { data: MonitoringData }) {
  const { projects } = useProjects(data.projects);
  const { month_order } = data;

  const reportRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  const periods = useMemo(
    () => getAvailableReportPeriods(projects, month_order),
    [projects, month_order]
  );

  const initialPeriod = useMemo(() => {
    const avail = getAvailableReportPeriods(data.projects, data.month_order);
    if (avail.length === 0) return { month: data.month_order[0] || "Januari", year: 2026 };
    return avail[avail.length - 1];
  }, [data.projects, data.month_order]);

  const [year, setYear] = useState<number>(initialPeriod.year);
  const [month, setMonth] = useState<string>(initialPeriod.month);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [jenisFilter, setJenisFilter] = useState<string>("");

  const years = useMemo(
    () => [...new Set(periods.map((p) => p.year))].sort((a, b) => b - a),
    [periods]
  );

  const { rows, summary } = useMemo(
    () => buildMonthlyReport(projects, month, year, month_order),
    [projects, month, year, month_order]
  );

  const filteredRows = useMemo(() => {
    let result = rows;
    if (statusFilter !== "all") {
      result = result.filter((r) => r.status === statusFilter);
    }
    if (jenisFilter) {
      result = result.filter((r) => getInvoiceType(r.no_invoice) === jenisFilter);
    }
    return result;
  }, [rows, statusFilter, jenisFilter]);

  const grandTotal = filteredRows.reduce((a, r) => a + (r.value || 0), 0);

  const handleExportImage = useCallback(async () => {
    if (!reportRef.current) return;
    const el = reportRef.current;
    try {
      setIsExporting(true);
      el.classList.add("exporting-image");

      // Tunggu browser recalculate layout untuk full table width
      await new Promise((resolve) => setTimeout(resolve, 60));

      const dataUrl = await toPng(el, {
        cacheBust: true,
        pixelRatio: 2,
        skipFonts: true,
        width: el.scrollWidth,
        height: el.scrollHeight,
        backgroundColor:
          typeof window !== "undefined"
            ? getComputedStyle(document.body).getPropertyValue("--bg").trim() || "#0f1216"
            : "#0f1216",
        filter: (node) => {
          if (node instanceof HTMLElement) {
            if (node.dataset.exportIgnore === "true") return false;
            const tag = node.tagName.toLowerCase();
            if (
              tag === "script" ||
              tag === "iframe" ||
              tag === "object" ||
              tag === "embed" ||
              tag.includes("-") ||
              node.id.startsWith("chrome-extension") ||
              node.hasAttribute("data-extension-id")
            ) {
              return false;
            }
          }
          return true;
        },
      });

      const link = document.createElement("a");
      link.download = `Summary-Laporan-Bulanan-${month}-${year}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Gagal export gambar:", err);
      alert("Gagal melakukan export summary gambar. Silakan coba lagi.");
    } finally {
      el.classList.remove("exporting-image");
      setIsExporting(false);
    }
  }, [month, year]);

  const kpis = [
    {
      label: "Not Paid",
      value: fmtRp(summary.unpaidTotal),
      sub: `${summary.unpaidCount} invoice`,
      accent: "var(--amber)",
      filter: "Invoiced - Unpaid" as StatusFilter,
    },
    {
      label: "On Progress",
      value: fmtRp(summary.progressTotal),
      sub: `${summary.progressCount} proyek`,
      accent: "var(--coral)",
      filter: "In Progress" as StatusFilter,
    },
    {
      label: "BAST Done Can't Progress",
      value: fmtRp(summary.bastTotal),
      sub: `${summary.bastCount} proyek`,
      accent: "var(--slate)",
      filter: "BAST Done - No Invoice" as StatusFilter,
    },
    {
      label: "Done Paid",
      value: fmtRp(summary.paidTotal),
      sub: `${summary.paidCount} invoice cair periode ini`,
      accent: "var(--mint)",
      filter: "Paid" as StatusFilter,
    },
  ];

  return (
    <div className="wrap wrap--fluid" ref={reportRef}>
      <header>
        <div>
          <div className="brand-eyebrow">// Project Cash</div>
          <h1>Report Bulanan</h1>
          <div className="subtitle">
            Status seluruh invoice per periode — item yang belum lunas otomatis terbawa
            (carry-over) ke laporan bulan berikutnya sampai statusnya Paid
          </div>
        </div>
        <div data-export-ignore="true" style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={handleExportImage}
            disabled={isExporting}
            style={{ gap: 6 }}
          >
            {isExporting ? (
              <>⌛ Mengunduh...</>
            ) : (
              <>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Export Summary (Gambar)
              </>
            )}
          </button>
        </div>
      </header>

      <div className="panel">
        <div className="controls" style={{ marginBottom: 18 }} data-export-ignore="true">
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

        <div className="controls" style={{ marginBottom: 14 }} data-export-ignore="true">
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
          <select value={jenisFilter} onChange={(e) => setJenisFilter(e.target.value)}>
            <option value="">Semua Jenis</option>
            <option value="NFT">NFT</option>
            <option value="Aigen">Aigen</option>
            <option value="GS">GS</option>
            <option value="Lainnya">Lainnya</option>
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

      <div className="foot-note" data-export-ignore="true">
        Klik salah satu kartu ringkasan di atas untuk memfilter tabel sesuai kategori status.
        Invoice yang belum Paid akan terus muncul di laporan bulan-bulan berikutnya sampai
        lunas; invoice yang sudah Paid hanya muncul pada laporan bulan saat ia benar-benar cair.
      </div>
    </div>
  );
}

