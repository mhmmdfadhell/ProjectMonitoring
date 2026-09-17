import type { ProjectRow, ProjectStatus } from "./types";
import { getProjectTransferMonthYear } from "./format";

export interface ReportPeriod {
  key: string; // "Month-Year"
  month: string;
  year: number;
}

export interface ReportRow extends ProjectRow {
  originLabel: string; // e.g. "Juli 2026" — bulan asal invoice ini pertama kali tercatat
  isCarriedOver: boolean; // true jika berasal dari bulan sebelum periode laporan
}

export interface ReportSummary {
  unpaidCount: number;
  unpaidTotal: number;
  progressCount: number;
  progressTotal: number;
  bastCount: number;
  bastTotal: number;
  paidCount: number;
  paidTotal: number;
  outstandingCount: number;
  outstandingTotal: number;
}

/** Urutan tampilan status pada tabel laporan. */
const STATUS_ORDER: ProjectStatus[] = [
  "Invoiced - Unpaid",
  "In Progress",
  "BAST Done - No Invoice",
  "Paid",
];

/**
 * Menghitung posisi kronologis (year, month) sebagai satu angka yang bisa dibandingkan,
 * berdasarkan urutan bulan yang diberikan (month_order).
 */
function chronoKey(year: number, month: string, monthOrder: string[]): number {
  const idx = monthOrder.indexOf(month);
  return year * 12 + (idx === -1 ? 0 : idx);
}

/**
 * Mengambil daftar periode (bulan+tahun) unik yang tersedia dari data proyek,
 * terurut kronologis menaik. Dipakai untuk mengisi pilihan dropdown periode laporan.
 */
export function getAvailableReportPeriods(
  projects: ProjectRow[],
  monthOrder: string[]
): ReportPeriod[] {
  const map = new Map<string, ReportPeriod>();
  for (const p of projects) {
    const key = `${p.month}-${p.year}`;
    if (!map.has(key)) map.set(key, { key, month: p.month, year: p.year });
  }
  return [...map.values()].sort(
    (a, b) => chronoKey(a.year, a.month, monthOrder) - chronoKey(b.year, b.month, monthOrder)
  );
}

/**
 * Membangun data Report Bulanan untuk periode (month, year) tertentu.
 *
 * Aturan carry-forward:
 * - Semua invoice yang BELUM Paid (Invoiced - Unpaid / In Progress / BAST Done - No Invoice)
 *   dari bulan tersebut DAN semua bulan sebelumnya akan selalu muncul, sampai statusnya Paid.
 * - Invoice yang statusnya Paid hanya muncul pada laporan bulan saat ia benar-benar cair
 *   (berdasarkan tanggal transfer / paid_date), sehingga begitu lunas ia tidak lagi
 *   "menumpuk" di laporan bulan-bulan berikutnya.
 */
export function buildMonthlyReport(
  projects: ProjectRow[],
  month: string,
  year: number,
  monthOrder: string[]
): { rows: ReportRow[]; summary: ReportSummary } {
  const targetKey = chronoKey(year, month, monthOrder);

  const backlog: ReportRow[] = projects
    .filter((p) => p.status !== "Paid")
    .filter((p) => chronoKey(p.year, p.month, monthOrder) <= targetKey)
    .map((p) => ({
      ...p,
      originLabel: `${p.month} ${p.year}`,
      isCarriedOver: chronoKey(p.year, p.month, monthOrder) < targetKey,
    }));

  const paidThisPeriod: ReportRow[] = projects
    .filter((p) => p.status === "Paid")
    .filter((p) => {
      const trf = getProjectTransferMonthYear(p);
      return trf && trf.month === month && trf.year === year;
    })
    .map((p) => ({
      ...p,
      originLabel: `${p.month} ${p.year}`,
      isCarriedOver: chronoKey(p.year, p.month, monthOrder) < targetKey,
    }));

  const rows = [...backlog, ...paidThisPeriod].sort((a, b) => {
    const sa = STATUS_ORDER.indexOf(a.status);
    const sb = STATUS_ORDER.indexOf(b.status);
    if (sa !== sb) return sa - sb;
    const ka = chronoKey(a.year, a.month, monthOrder);
    const kb = chronoKey(b.year, b.month, monthOrder);
    if (ka !== kb) return ka - kb; // paling lama (overdue) tampil duluan
    return (b.value || 0) - (a.value || 0);
  });

  const summary: ReportSummary = {
    unpaidCount: 0,
    unpaidTotal: 0,
    progressCount: 0,
    progressTotal: 0,
    bastCount: 0,
    bastTotal: 0,
    paidCount: paidThisPeriod.length,
    paidTotal: paidThisPeriod.reduce((a, p) => a + (p.value || 0), 0),
    outstandingCount: backlog.length,
    outstandingTotal: backlog.reduce((a, p) => a + (p.value || 0), 0),
  };

  for (const p of backlog) {
    if (p.status === "Invoiced - Unpaid") {
      summary.unpaidCount++;
      summary.unpaidTotal += p.value || 0;
    } else if (p.status === "In Progress") {
      summary.progressCount++;
      summary.progressTotal += p.value || 0;
    } else if (p.status === "BAST Done - No Invoice") {
      summary.bastCount++;
      summary.bastTotal += p.value || 0;
    }
  }

  return { rows, summary };
}
