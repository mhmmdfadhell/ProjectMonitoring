import type { ProjectRow } from "@/lib/types";
import { fmtRp, MONTH_NAMES } from "@/lib/format";

export default function KpiRow({
  cashinCount,
  totalIncome,
  projects,
  totalProjectValue,
  monthName,
  year,
}: {
  cashinCount: number;
  totalIncome: number;
  projects: ProjectRow[];
  totalProjectValue: number;
  monthName?: string;
  year?: number;
}) {
  const now = new Date();
  const currentMonth = monthName ?? MONTH_NAMES[now.getMonth()];
  const currentYear = year ?? now.getFullYear();

  const paidCount = projects.filter((p) => p.status === "Paid").length;
  const unpaid = projects.filter((p) => p.status !== "Paid");
  const unpaidValue = unpaid.reduce((a, p) => a + p.value, 0);

  const kpis = [
    {
      label: `Total Cash In ${currentMonth} ${currentYear}`,
      value: fmtRp(totalIncome),
      sub: `${cashinCount} transaksi tercatat`,
      accent: "var(--mint)",
    },
    {
      label: "Total Nilai Proyek",
      value: fmtRp(totalProjectValue),
      sub: `${projects.length} proyek`,
      accent: "var(--mint)",
    },
    {
      label: "Belum Lunas",
      value: fmtRp(unpaidValue),
      sub: `${unpaid.length} proyek outstanding`,
      accent: "var(--amber)",
    },
    {
      label: "Proyek Lunas",
      value: `${paidCount} / ${projects.length || 0}`,
      sub: projects.length
        ? `${Math.round((paidCount / projects.length) * 100)}% dari total proyek`
        : "Belum ada proyek",
      accent: "var(--mint)",
    },
  ];

  return (
    <div className="kpi-row">
      {kpis.map((k) => (
        <div
          className="kpi"
          key={k.label}
          style={{ ["--kpi-accent" as string]: k.accent }}
        >
          <div className="kpi-label">{k.label}</div>
          <div className="kpi-value">{k.value}</div>
          <div className="kpi-sub">{k.sub}</div>
        </div>
      ))}
    </div>
  );
}
