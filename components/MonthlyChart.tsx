"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  type ChartOptions,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import type { MonitoringData } from "@/lib/types";
import { fmtRp, MONTH_LABELS_SHORT } from "@/lib/format";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

export default function MonthlyChart({
  data,
  monthlyTotals,
}: {
  data: MonitoringData;
  monthlyTotals?: Record<string, number>;
}) {
  const months = data.month_order;
  const values = months.map(
    (m) => (monthlyTotals ? monthlyTotals[m] : data.monthly_totals[m]) || 0
  );

  const chartData = {
    labels: months.map((m) => MONTH_LABELS_SHORT[m] || m),
    datasets: [
      {
        data: values,
        backgroundColor: values.map((v) =>
          v > 0 ? "rgba(94,234,212,0.75)" : "rgba(124,135,152,0.15)"
        ),
        borderRadius: 4,
        maxBarThickness: 42,
      },
    ],
  };

  const options: ChartOptions<"bar"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: { label: (ctx) => fmtRp(ctx.raw as number) },
        backgroundColor: "#1D222A",
        titleColor: "#E9E7E0",
        bodyColor: "#5EEAD4",
        borderColor: "#2A3038",
        borderWidth: 1,
        padding: 10,
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          color: "#8B93A0",
          font: { family: "Plus Jakarta Sans", size: 11 },
          maxRotation: 45,
          minRotation: 0,
          autoSkip: false,
        },
      },
      y: {
        grid: { color: "rgba(140,148,160,0.18)" },
        ticks: {
          color: "#8B93A0",
          font: { family: "Plus Jakarta Sans", size: 10 },
          maxTicksLimit: 6,
          callback: (v) => fmtRp(v as number),
        },
      },
    },
  };

  return (
    <div className="chart-container-bar">
      <Bar data={chartData} options={options} />
    </div>
  );
}
