"use client";

import { useMemo, useState } from "react";
import type { ProjectRow } from "@/lib/types";
import { availableYears, monthComparator, monthYearLabel } from "@/lib/format";
import InvoiceFormModal from "@/components/InvoiceFormModal";
import MonthCard from "@/components/MonthCard";

type SortKey = "value" | "client_norm" | "pic" | "status" | "paid_date";

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "value", label: "Nilai" },
  { key: "client_norm", label: "Klien" },
  { key: "pic", label: "PIC" },
  { key: "status", label: "Status" },
  { key: "paid_date", label: "Tgl Bayar" },
];

const STATUS_OPTIONS = [
  "Paid",
  "Invoiced - Unpaid",
  "BAST Done - No Invoice",
  "In Progress",
];

export default function ProjectTable({
  projects,
  monthOrder,
  onAdd,
  onUpdate,
  onDelete,
  onReset,
}: {
  projects: ProjectRow[];
  monthOrder: string[];
  onAdd: (data: Omit<ProjectRow, "id">) => void;
  onUpdate: (id: string, patch: Partial<Omit<ProjectRow, "id">>) => void;
  onDelete: (id: string) => void;
  onReset: () => void;
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [picFilter, setPicFilter] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const [monthFilter, setMonthFilter] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("value");
  const [sortDir, setSortDir] = useState<1 | -1>(-1);
  const [modal, setModal] = useState<
    { mode: "add" } | { mode: "edit"; row: ProjectRow } | null
  >(null);

  const cmpMonth = monthComparator(monthOrder);

  const years = useMemo(() => availableYears(projects), [projects]);
  const clientOptions = useMemo(
    () =>
      [
        ...new Set(
          projects
            .map((p) => (p.client_norm || p.client || "").trim())
            .filter(Boolean)
        ),
      ].sort(),
    [projects]
  );
  const picOptions = useMemo(
    () =>
      [
        ...new Set(
          projects.map((p) => (p.pic || "").trim()).filter(Boolean)
        ),
      ].sort(),
    [projects]
  );

  const filteredSorted = useMemo(() => {
    const q = search.toLowerCase();
    let filtered = projects.filter((p) => {
      if (statusFilter && p.status !== statusFilter) return false;
      if (picFilter && p.pic !== picFilter) return false;
      if (yearFilter && String(p.year) !== yearFilter) return false;
      if (monthFilter && p.month !== monthFilter) return false;
      if (q) {
        const hay = `${p.project} ${p.client_norm} ${p.pic} ${p.no_kontrak || ""} ${p.no_invoice || ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    filtered = [...filtered].sort((a, b) => {
      if (sortKey === "value") return (a.value - b.value) * sortDir;
      const av = (a[sortKey] || "").toString();
      const bv = (b[sortKey] || "").toString();
      return av.localeCompare(bv) * sortDir;
    });

    return filtered;
  }, [projects, search, statusFilter, picFilter, yearFilter, monthFilter, sortKey, sortDir]);

  // Group into cards by year+month, ordered chronologically regardless of row sort above.
  const groups = useMemo(() => {
    const map = new Map<string, { year: number; month: string; rows: ProjectRow[] }>();
    for (const p of filteredSorted) {
      const key = `${p.year}-${p.month}`;
      if (!map.has(key)) map.set(key, { year: p.year, month: p.month, rows: [] });
      map.get(key)!.rows.push(p);
    }
    return [...map.values()].sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return cmpMonth(a.month, b.month);
    });
  }, [filteredSorted, cmpMonth]);

  function handleDelete(row: ProjectRow) {
    if (
      window.confirm(
        `Hapus invoice "${row.project}"? Tindakan ini tidak bisa dibatalkan.`
      )
    ) {
      onDelete(row.id);
    }
  }

  return (
    <>
      <div className="table-toolbar">
        <div className="toolbar-search-row">
          <input
            type="text"
            className="search-input"
            placeholder="Cari proyek, klien, PIC, no. kontrak, no. invoice..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button
            type="button"
            className="btn btn-primary btn-add-invoice"
            onClick={() => setModal({ mode: "add" })}
          >
            + Tambah Invoice
          </button>
        </div>

        <div className="controls toolbar-filters">
          <select value={yearFilter} onChange={(e) => setYearFilter(e.target.value)}>
            <option value="">Semua Tahun</option>
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
          <select value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)}>
            <option value="">Semua Bulan</option>
            {monthOrder.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">Semua Status</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <select value={picFilter} onChange={(e) => setPicFilter(e.target.value)}>
            <option value="">Semua PIC</option>
            {picOptions.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          <div className="sort-group">
            <select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as SortKey)}
            >
              {SORT_OPTIONS.map((s) => (
                <option key={s.key} value={s.key}>
                  Urut: {s.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="btn-icon"
              title={sortDir === 1 ? "Menaik" : "Menurun"}
              onClick={() => setSortDir((d) => (d === 1 ? -1 : 1))}
            >
              {sortDir === 1 ? "▲" : "▼"}
            </button>
          </div>
        </div>
      </div>

      {groups.length === 0 && (
        <div className="panel" style={{ textAlign: "center", color: "var(--text-dim)" }}>
          Tidak ada invoice yang cocok dengan filter.
        </div>
      )}

      {groups.map((g) => (
        <MonthCard
          key={`${g.year}-${g.month}`}
          label={monthYearLabel(g.month, g.year)}
          rows={g.rows}
          onEdit={(row) => setModal({ mode: "edit", row })}
          onDelete={handleDelete}
        />
      ))}

      <div style={{ marginTop: 10 }}>
        <button type="button" className="text-link" onClick={onReset}>
          Reset ke data awal
        </button>
      </div>

      {modal && (
        <InvoiceFormModal
          mode={modal.mode}
          monthOptions={monthOrder}
          clientOptions={clientOptions}
          picOptions={picOptions}
          initial={modal.mode === "edit" ? modal.row : undefined}
          onClose={() => setModal(null)}
          onSubmit={(data) => {
            if (modal.mode === "add") {
              onAdd(data);
            } else {
              onUpdate(modal.row.id, data);
            }
            setModal(null);
          }}
        />
      )}
    </>
  );
}
