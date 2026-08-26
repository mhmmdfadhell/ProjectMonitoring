export function fmtRp(n: number | null | undefined): string {
  if (n === null || n === undefined || isNaN(n)) return "—";
  return "Rp" + Math.round(n).toLocaleString("id-ID");
}


export function fmtDate(s: string | null | undefined): string {
  if (!s) return "—";
  try {
    const d = new Date(s);
    if (isNaN(d.getTime())) return s;
    return d.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return s;
  }
}

export const MONTH_NAMES = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

/**
 * Returns the month and year when a project's payment was transferred (based on paid_date or status_updated_at).
 * Returns null if the project is not Paid.
 */
export function getProjectTransferMonthYear(p: {
  status: string;
  paid_date?: string | null;
  status_updated_at?: string | null;
  month: string;
  year: number;
}): { month: string; year: number } | null {
  if (p.status !== "Paid") return null;
  const dateStr = p.paid_date || p.status_updated_at;
  if (dateStr) {
    const parts = dateStr.split("-");
    if (parts.length >= 2) {
      const yr = parseInt(parts[0], 10);
      const moIdx = parseInt(parts[1], 10) - 1;
      if (!isNaN(yr) && moIdx >= 0 && moIdx < 12) {
        return { month: MONTH_NAMES[moIdx], year: yr };
      }
    }
  }
  return { month: p.month, year: p.year };
}

export const MONTH_LABELS_SHORT: Record<string, string> = {
  Januari: "Jan",
  Februari: "Feb",
  Maret: "Mar",
  April: "Apr",
  Mei: "Mei",
  Juni: "Jun",
  Juli: "Jul",
  Agustus: "Agu",
  September: "Sep",
  Oktober: "Okt",
  November: "Nov",
  Desember: "Des",
};

export const STATUS_COLORS: Record<string, string> = {
  Paid: "#5EEAD4",
  "Invoiced - Unpaid": "#F0B429",
  "BAST Done - No Invoice": "#7C8798",
  "In Progress": "#F2685B",
};

export function statusPillClass(s: string): string {
  if (s === "Paid") return "paid";
  if (s === "In Progress") return "progress";
  return "unpaid";
}

/** Returns a comparator that sorts by chronological month order, unknown months last. */
export function monthComparator(monthOrder: string[]) {
  return (a: string, b: string) => {
    const ai = monthOrder.indexOf(a);
    const bi = monthOrder.indexOf(b);
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
  };
}

export function monthYearLabel(month: string, year: number): string {
  return `${month} ${year}`;
}

export function availableYears(records: { year: number }[]): number[] {
  return [...new Set(records.map((r) => r.year))].sort((a, b) => b - a);
}

export interface DayBucket {
  date: string; // YYYY-MM-DD
  label: string; // "18 Agu"
}

/** Last N days (inclusive of today), oldest first. */
export function lastNDays(n: number): DayBucket[] {
  const days: DayBucket[] = [];
  const today = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const date = d.toISOString().slice(0, 10);
    const label = d.toLocaleDateString("id-ID", { day: "2-digit", month: "short" });
    days.push({ date, label });
  }
  return days;
}

/** All days in a given month and year (from day 1 to end of month). */
export function getDaysInMonth(month: string, year: number): DayBucket[] {
  const monthIndex = MONTH_NAMES.indexOf(month);
  if (monthIndex === -1) return [];
  const numDays = new Date(year, monthIndex + 1, 0).getDate();
  const shortMonth = MONTH_LABELS_SHORT[month] || month;
  const monthStr = String(monthIndex + 1).padStart(2, "0");
  const days: DayBucket[] = [];
  for (let day = 1; day <= numDays; day++) {
    const dayStr = String(day).padStart(2, "0");
    const date = `${year}-${monthStr}-${dayStr}`;
    const label = `${dayStr} ${shortMonth}`;
    days.push({ date, label });
  }
  return days;
}


