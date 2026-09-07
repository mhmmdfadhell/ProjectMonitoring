export type ProjectStatus =
  | "Paid"
  | "Invoiced - Unpaid"
  | "BAST Done - No Invoice"
  | "In Progress";

export interface CashInRow {
  month: string;
  year: number;
  project: string;
  income: number;
  trf_date: string | null;
}

export interface ProjectRow {
  id: string;
  month: string;
  year: number;
  client: string;
  client_norm: string;
  project: string;
  pic: string;
  value: number;
  bast: string;
  no_invoice: string | null;
  no_kontrak: string | null;
  invoice_submit: string | null;
  paid_date: string | null;
  status: ProjectStatus;
  /** Tanggal terakhir status invoice ini diubah (mis. saat ditandai Lunas) */
  status_updated_at: string | null;
}

export interface MonitoringData {
  cashin: CashInRow[];
  monthly_totals: Record<string, number>;
  total_income: number;
  projects: ProjectRow[];
  month_order: string[];
}
