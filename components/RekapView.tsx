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
      return days.map((d) => {
        const cashInTotal = projects
          .filter(
            (p) =>
              p.status === "Paid" &&
              (p.paid_date === d.date || (!p.paid_date && p.status_updated_at === d.date))
          )
          .reduce((a, p) => a + (p.value || 0), 0);
        const dayProjects = projects.filter(
          (p) => (p.paid_date || p.invoice_submit || p.status_updated_at) === d.date
        );
        const invoiceTotal = dayProjects.reduce((a, p) => a + (p.value || 0), 0);
        const paidTotal = dayProjects
          .filter((p) => p.status === "Paid")
          .reduce((a, p) => a + (p.value || 0), 0);
        return {
          key: d.date,
          label: d.label,
          cashInTotal,
          invoiceCount: dayProjects.length,
          invoiceTotal,
          paidTotal,
          unpaidTotal: invoiceTotal - paidTotal,
        };
      });
    }
    // 7 hari terakhir
    const days = lastNDays(7);
    return days.map((d) => {
      const cashInTotal = projects
        .filter(
          (p) =>
            p.status === "Paid" &&
            (p.paid_date === d.date || (!p.paid_date && p.status_updated_at === d.date))
        )
        .reduce((a, p) => a + (p.value || 0), 0);
      const dayProjects = projects.filter(
        (p) => (p.paid_date || p.invoice_submit || p.status_updated_at) === d.date
      );
      const invoiceTotal = dayProjects.reduce((a, p) => a + (p.value || 0), 0);
      const paidTotal = dayProjects
        .filter((p) => p.status === "Paid")
        .reduce((a, p) => a + (p.value || 0), 0);
      return {
        key: d.date,
        label: d.label,
        cashInTotal,
        invoiceCount: dayProjects.length,
        invoiceTotal,
        paidTotal,
        unpaidTotal: invoiceTotal - paidTotal,
      };
    });
  }, [mode, year, month, month_order, projects]);

  const modalProjects = useMemo(() => {
    if (!selectedRow) return [];
    if (mode === "tahun") {
      const [rowMonth, rowYearStr] = selectedRow.key.split("-");
      const rowYear = parseInt(rowYearStr, 10);
      return projects.filter((p) => {
        const isInvoiceMonth = p.month === rowMonth && p.year === rowYear;
        const trf = getProjectTransferMonthYear(p);
        const isTrfMonth = trf && trf.month === rowMonth && trf.year === rowYear;
        return isInvoiceMonth || isTrfMonth;
      });
    }

    // mode === "bulan" or mode === "7hari": selectedRow.key is a date string like "2026-08-12"
    const targetDate = selectedRow.key;
    return projects.filter((p) => {
      const isPaidOnDate =
        p.status === "Paid" &&
        (p.paid_date === targetDate || (!p.paid_date && p.status_updated_at === targetDate));
      const isSubmitOnDate = p.invoice_submit === targetDate;
      const isStatusOnDate = p.status_updated_at === targetDate;
      return isPaidOnDate || isSubmitOnDate || isStatusOnDate;
    });
  }, [selectedRow, mode, projects]);

  return (
    <div className="wrap">
      <header>
        <div>
          <div className="brand-eyebrow">// Project Cash</div>
          <h1>Rekap Bulanan</h1>
          <div className="subtitle">
            Total dibaca per periode — cash in (berdasarkan tgl transfer invoice), nilai invoice, sudah dibayar,
            dan belum dibayar
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
        Klik icon 👁 pada baris tabel untuk melihat rincian transaksi harian/bulanan secara mendalam
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

function buildMonthRow(
  month: string,
  year: number,
  projects: ProjectRow[]
): SummaryRow {
  // Cash in = total uang yang ditransfer pada bulan & tahun ini dari invoice status Paid
  const cashInTotal = projects.reduce((sum, p) => {
    const trf = getProjectTransferMonthYear(p);
    if (trf && trf.month === month && trf.year === year) {
      return sum + (p.value || 0);
    }
    return sum;
  }, 0);

  const monthProjects = projects.filter((p) => p.month === month && p.year === year);
  const invoiceTotal = monthProjects.reduce((a, p) => a + (p.value || 0), 0);
  const paidTotal = monthProjects
    .filter((p) => p.status === "Paid")
    .reduce((a, p) => a + (p.value || 0), 0);
  return {
    key: `${month}-${year}`,
    label: MONTH_LABELS_SHORT[month] || month,
    cashInTotal,
    invoiceCount: monthProjects.length,
    invoiceTotal,
    paidTotal,
    unpaidTotal: invoiceTotal - paidTotal,
  };
}
