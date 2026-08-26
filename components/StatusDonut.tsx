"use client";

import { Chart as ChartJS, ArcElement, Tooltip, type ChartOptions } from "chart.js";
import { Doughnut } from "react-chartjs-2";
import type { ProjectRow } from "@/lib/types";
import { STATUS_COLORS, fmtRp } from "@/lib/format";

ChartJS.register(ArcElement, Tooltip);

const STATUS_ORDER = [
  "Paid",
  "Invoiced - Unpaid",
  "BAST Done - No Invoice",
  "In Progress",
];

export default function StatusDonut({ projects }: { projects: ProjectRow[] }) {
  // Group by status and sum values (in IDR)
  const statusValues: Record<string, number> = {};
  for (const s of STATUS_ORDER) {
    statusValues[s] = projects
      .filter((p) => p.status === s)
      .reduce((a, p) => a + (p.value || 0), 0);
  }

  const labelsPresent = STATUS_ORDER.filter((s) => statusValues[s] > 0);
  const valsPresent = labelsPresent.map((s) => statusValues[s]);

  const chartData = {
    labels: labelsPresent,
    datasets: [
      {
        data: valsPresent,
        backgroundColor: labelsPresent.map((s) => STATUS_COLORS[s]),
        borderColor: "transparent",
        borderWidth: 3,
      },
    ],
  };

  const options: ChartOptions<"doughnut"> = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "68%",
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#1D222A",
        titleColor: "#E9E7E0",
        bodyColor: "#E9E7E0",
        borderColor: "#2A3038",
        borderWidth: 1,
        padding: 10,
        callbacks: {
          label: (ctx) => ` ${fmtRp(ctx.raw as number)}`,
        },
      },
    },
  };

  return (
    <>
      <div className="chart-container-donut">
        <Doughnut data={chartData} options={options} />
      </div>
      <div className="legend-list">
        {labelsPresent.map((s) => (
          <div className="legend-item" key={s}>
            <div
              className="legend-dot"
              style={{ background: STATUS_COLORS[s] }}
            />
            <div className="lbl">{s}</div>
            <div className="val">{fmtRp(statusValues[s])}</div>
          </div>
        ))}
      </div>
    </>
  );
}
