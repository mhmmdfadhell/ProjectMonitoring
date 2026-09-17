"use client";

import { useMemo, useState } from "react";
import type { MonitoringData, ProjectRow } from "@/lib/types";
import { useProjects } from "@/lib/useProjects";
import SummaryTable, { type SummaryRow } from "@/components/SummaryTable";
import RekapDetailModal from "@/components/RekapDetailModal";
import {
  getDaysInMonth,
  getProjectTransferMonthYear,
  lastNDays,
  MONTH_LABELS_SHORT,
} from "@/lib/format";

type Mode = "tahun" | "bulan" | "7hari";

// Tanggal cash-in efektif suatu invoice: hanya invoice berstatus Paid yang dianggap "masuk".
function cashInDate(p: ProjectRow): string | null {
  if (p.status !== "Paid") return null;
  return p.paid_date || p.status_updated_at || null;
}

// Ambil semua invoice yang cair jadi cash-in pada bulan & tahun tertentu, urut naik sesuai tanggal masuk.
function getCashInProjectsForMonth(
  projects: ProjectRow[],
  month: string,
  year: number
): ProjectRow[] {
  return projects
    .filter((p) => {
      const trf = getProjectTransferMonthYear(p);
      return trf && trf.month === month && trf.year === year;
    })
    .sort((a, b) => (cashInDate(a) || "").localeCompare(cashInDate(b) || ""));
}

// Ambil semua invoice yang cair jadi cash-in pada tanggal tertentu, urut naik sesuai tanggal masuk.
function getCashInProjectsForDate(projects: ProjectRow[], date: string): ProjectRow[] {
  return projects
    .filter((p) => cashInDate(p) === date)
    .sort((a, b) => (cashInDate(a) || "").localeCompare(cashInDate(b) || ""));
}

export default function RekapView({ data }: { data: MonitoringData }) {
  const { projects } = useProjects(data.projects);
  const { month_order } = data;

  const years = useMemo(() => {
    const yrSet = new Set<number>();
    projects.forEach((p) => {
      yrSet.add(p.year);
      const trf = getProjectTransferMonthYear(p);
      if (trf) yrSet.add(trf.year);
    });
    const arr = [...yrSet].sort((a, b) => b - a);
    return arr.length > 0 ? arr : [new Date().getFullYear()];
  }, [projects]);

  const [mode, setMode] = useState<Mode>("tahun");
  const [year, setYear] = useState<number>(years[0] ?? new Date().getFullYear());
  const [month, setMonth] = useState<string>(month_order[0]);
  const [selectedRow, setSelectedRow] = useState<SummaryRow | null>(null);

  const rows: SummaryRow[] = useMemo(() => {
    if (mode === "tahun") {
      return month_order.map((m) => buildMonthRow(m, year, projects));
    }
    if (mode === "bulan") {
      const days = getDaysInMonth(month, year);
      return days.map((d) => buildDayRow(d.date, d.label, projects));
    }
    // 7 hari terakhir
    const days = lastNDays(7);
    return days.map((d) => buildDayRow(d.date, d.label, projects));
  }, [mode, year, month, month_order, projects]);

  const modalProjects = useMemo(() => {
    if (!selectedRow) return [];
    if (mode === "tahun") {
      const [rowMonth, rowYearStr] = selectedRow.key.split("-");
      const rowYear = parseInt(rowYearStr, 10);
      return getCashInProjectsForMonth(projects, rowMonth, rowYear);
    }
    // mode === "bulan" or mode === "7hari": selectedRow.key is a date string like "2026-08-12"
    return getCashInProjectsForDate(projects, selectedRow.key);
  }, [selectedRow, mode, projects]);

  return (
    <div className="wrap">
      <header>
        <div>
          <div className="brand-eyebrow">// Project Cash</div>
          <h1>Rekap Bulanan</h1>
          <div className="subtitle">
            Cash in per periode — dihitung dari invoice yang sudah cair (tgl transfer), beserta jumlah invoicenya
          </div>
        </div>
      </header>

      <div className="panel">
        <div className="controls" style={{ marginBottom: 18 }}>
          <select value={mode} onChange={(e) => setMode(e.target.value as Mode)}>
            <option value="tahun">Per Tahun (12 Bulan)</option>
            <option value="bulan">Per Bulan (Harian Tanggal Awal - Akhir)</option>
            <option value="7hari">7 Hari Terakhir</option>
          </select>

          {(mode === "tahun" || mode === "bulan") && (
            <select value={year} onChange={(e) => setYear(Number(e.target.value))}>
              {years.length === 0 && <option value={year}>{year}</option>}
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          )}

          {mode === "bulan" && (
            <select value={month} onChange={(e) => setMonth(e.target.value)}>
              {month_order.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="panel-title">
          Rekap {mode === "tahun" && `Tahun ${year}`}
          {mode === "bulan" && `Harian ${month} ${year} (Tanggal 01 s/d Akhir Bulan)`}
          {mode === "7hari" && "7 Hari Terakhir"}
        </div>
        <SummaryTable
          rows={rows}
          labelHeader={mode === "tahun" ? "Bulan" : "Tanggal"}
          showTotal={true}
          onView={(row) => setSelectedRow(row)}
        />
      </div>

      <div className="foot-note">
        Klik icon 👁 pada baris tabel untuk melihat invoice mana saja yang masuk pada periode tersebut, terurut sesuai tanggal masuknya
      </div>

      {selectedRow && (
        <RekapDetailModal
          row={selectedRow}
          projects={modalProjects}
          onClose={() => setSelectedRow(null)}
        />
      )}
    </div>
  );
}

function buildMonthRow(month: string, year: number, projects: ProjectRow[]): SummaryRow {
  const cashedIn = getCashInProjectsForMonth(projects, month, year);
  return {
    key: `${month}-${year}`,
    label: MONTH_LABELS_SHORT[month] || month,
    cashInTotal: cashedIn.reduce((a, p) => a + (p.value || 0), 0),
    invoiceCount: cashedIn.length,
    invoiceTotal: 0,
    paidTotal: 0,
    unpaidTotal: 0,
  };
}

function buildDayRow(date: string, label: string, projects: ProjectRow[]): SummaryRow {
  const cashedIn = getCashInProjectsForDate(projects, date);
  return {
    key: date,
    label,
    cashInTotal: cashedIn.reduce((a, p) => a + (p.value || 0), 0),
    invoiceCount: cashedIn.length,
    invoiceTotal: 0,
    paidTotal: 0,
    unpaidTotal: 0,
  };
}
