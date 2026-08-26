"use client";

import { useEffect, useState } from "react";
import type { ProjectRow, ProjectStatus } from "@/lib/types";
import { todayISO } from "@/lib/useProjects";

const STATUS_OPTIONS: ProjectStatus[] = [
  "In Progress",
  "BAST Done - No Invoice",
  "Invoiced - Unpaid",
  "Paid",
];

type FormState = {
  month: string;
  year: string;
  client: string;
  project: string;
  pic: string;
  value: string;
  bast: string;
  no_invoice: string;
  invoice_submit: string;
  paid_date: string;
  status: ProjectStatus;
  status_updated_at: string;
};

const EMPTY_FORM: FormState = {
  month: "",
  year: String(new Date().getFullYear()),
  client: "",
  project: "",
  pic: "",
  value: "",
  bast: "",
  no_invoice: "",
  invoice_submit: "",
  paid_date: "",
  status: "In Progress",
  status_updated_at: "",
};

function rowToForm(row: ProjectRow): FormState {
  return {
    month: row.month,
    year: String(row.year),
    client: row.client_norm,
    project: row.project,
    pic: row.pic,
    value: String(row.value ?? ""),
    bast: row.bast ?? "",
    no_invoice: row.no_invoice ?? "",
    invoice_submit: row.invoice_submit ?? "",
    paid_date: row.paid_date ?? "",
    status: row.status,
    status_updated_at: row.status_updated_at ?? "",
  };
}

export default function InvoiceFormModal({
  mode,
  monthOptions,
  clientOptions = [],
  picOptions = [],
  initial,
  onClose,
  onSubmit,
}: {
  mode: "add" | "edit";
  monthOptions: string[];
  clientOptions?: string[];
  picOptions?: string[];
  initial?: ProjectRow;
  onClose: () => void;
  onSubmit: (data: Omit<ProjectRow, "id">) => void;
}) {
  const [form, setForm] = useState<FormState>(
    initial ? rowToForm(initial) : EMPTY_FORM
  );
  const [statusTouched, setStatusTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initialStatus = initial?.status;

  // Auto-stamp the status-change date when the status is changed by the
  // user, unless they've already edited that date field themselves.
  useEffect(() => {
    if (mode === "edit" && form.status !== initialStatus && !statusTouched) {
      setForm((f) => ({ ...f, status_updated_at: todayISO() }));
    }
  }, [form.status, initialStatus, mode, statusTouched]);

  function set<K extends keyof FormState>(key: K, val: FormState[K]) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.month || !form.year || !form.project.trim() || !form.value) {
      setError("Bulan, tahun, nama invoice, dan nilai wajib diisi.");
      return;
    }
    const numValue = Number(form.value);
    if (isNaN(numValue) || numValue < 0) {
      setError("Nilai harus berupa angka yang valid.");
      return;
    }
    const numYear = Number(form.year);
    if (isNaN(numYear) || numYear < 2000 || numYear > 2100) {
      setError("Tahun harus berupa angka yang valid.");
      return;
    }
    onSubmit({
      month: form.month,
      year: numYear,
      client: form.client.trim() || "Lainnya",
      client_norm: form.client.trim() || "Lainnya",
      project: form.project.trim(),
      pic: form.pic.trim() || "Unassigned",
      value: numValue,
      bast: form.bast.trim(),
      no_invoice: form.no_invoice.trim() || null,
      invoice_submit: form.invoice_submit || null,
      paid_date: form.paid_date || null,
      status: form.status,
      status_updated_at: form.status_updated_at || null,
    });
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{mode === "add" ? "Tambah Invoice" : "Edit Invoice"}</h2>
          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            aria-label="Tutup"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <label className="field">
              <span>Bulan *</span>
              <select
                value={form.month}
                onChange={(e) => set("month", e.target.value)}
                required
              >
                <option value="" disabled>
                  Pilih bulan
                </option>
                {monthOptions.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Tahun *</span>
              <input
                type="number"
                value={form.year}
                onChange={(e) => set("year", e.target.value)}
                placeholder="2026"
                required
              />
            </label>

            <label className="field">
              <span>Klien</span>
              <input
                type="text"
                list="client-options-list"
                value={form.client}
                onChange={(e) => set("client", e.target.value)}
                placeholder="Pilih atau ketik nama klien..."
                autoComplete="off"
              />
              <datalist id="client-options-list">
                {clientOptions.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </label>

            <label className="field field-wide">
              <span>Nama Invoice / Proyek *</span>
              <input
                type="text"
                value={form.project}
                onChange={(e) => set("project", e.target.value)}
                placeholder="mis. BI OCP (Term 1)"
                required
              />
            </label>

            <label className="field">
              <span>PIC</span>
              <input
                type="text"
                list="pic-options-list"
                value={form.pic}
                onChange={(e) => set("pic", e.target.value)}
                placeholder="Pilih atau ketik nama PIC..."
                autoComplete="off"
              />
              <datalist id="pic-options-list">
                {picOptions.map((p) => (
                  <option key={p} value={p} />
                ))}
              </datalist>
            </label>

            <label className="field">
              <span>Nilai (Rp) *</span>
              <input
                type="number"
                min="0"
                step="1"
                value={form.value}
                onChange={(e) => set("value", e.target.value)}
                placeholder="0"
                required
              />
            </label>

            <label className="field">
              <span>No. Invoice</span>
              <input
                type="text"
                value={form.no_invoice}
                onChange={(e) => set("no_invoice", e.target.value)}
                placeholder="Opsional"
              />
            </label>

            <label className="field">
              <span>BAST</span>
              <input
                type="text"
                value={form.bast}
                onChange={(e) => set("bast", e.target.value)}
                placeholder="mis. DONE"
              />
            </label>

            <label className="field">
              <span>Tgl Invoice Submit</span>
              <input
                type="date"
                value={form.invoice_submit}
                onChange={(e) => set("invoice_submit", e.target.value)}
              />
            </label>

            <label className="field">
              <span>Tgl Bayar</span>
              <input
                type="date"
                value={form.paid_date}
                onChange={(e) => set("paid_date", e.target.value)}
              />
            </label>

            <label className="field">
              <span>Status *</span>
              <select
                value={form.status}
                onChange={(e) => set("status", e.target.value as ProjectStatus)}
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Tgl Perubahan Status</span>
              <input
                type="date"
                value={form.status_updated_at}
                onChange={(e) => {
                  setStatusTouched(true);
                  set("status_updated_at", e.target.value);
                }}
              />
            </label>
          </div>

          {error && <div className="form-error">{error}</div>}

          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Batal
            </button>
            <button type="submit" className="btn btn-primary">
              {mode === "add" ? "Simpan Invoice" : "Simpan Perubahan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
