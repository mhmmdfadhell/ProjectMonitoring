"use client";

import { useMemo } from "react";
import type { MonitoringData } from "@/lib/types";
import { fmtRp, getProjectTransferMonthYear, MONTH_NAMES } from "@/lib/format";
import { useProjects } from "@/lib/useProjects";
import KpiRow from "@/components/KpiRow";
import MonthlyChart from "@/components/MonthlyChart";
import StatusDonut from "@/components/StatusDonut";
import GroupBars from "@/components/GroupBars";

export default function OverviewView({ data }: { data: MonitoringData }) {
  const { projects } = useProjects(data.projects);

  const now = new Date();
  const currentMonthName = MONTH_NAMES[now.getMonth()];
  const currentYear = now.getFullYear();

  const totalProjectValue = useMemo(
    () => projects.reduce((a, p) => a + (p.value || 0), 0),
    [projects]
  );

  const paidProjects = useMemo(
    () => projects.filter((p) => p.status === "Paid"),
    [projects]
  );

  const totalCashIn = useMemo(
    () => paidProjects.reduce((a, p) => a + (p.value || 0), 0),
    [paidProjects]
  );

  const currentMonthPaidProjects = useMemo(() => {
    return paidProjects.filter((p) => {
      const trf = getProjectTransferMonthYear(p);
      return trf && trf.month === currentMonthName && trf.year === currentYear;
    });
  }, [paidProjects, currentMonthName, currentYear]);

  const currentMonthCashIn = useMemo(
    () => currentMonthPaidProjects.reduce((a, p) => a + (p.value || 0), 0),
    [currentMonthPaidProjects]
  );

  const monthlyTotals = useMemo(() => {
    const map: Record<string, number> = {};
    data.month_order.forEach((m) => {
      map[m] = 0;
    });
    for (const p of paidProjects) {
      const trf = getProjectTransferMonthYear(p);
      if (trf && trf.year === currentYear) {
        map[trf.month] = (map[trf.month] || 0) + (p.value || 0);
      }
    }
    return map;
  }, [paidProjects, data.month_order, currentYear]);

  return (
    <div className="wrap">
      <header>
        <div>
          <div className="brand-eyebrow">// Project Cash</div>
          <h1>Overview</h1>
          <div className="subtitle">
            Summarycash-in dan status invoice per proyek
          </div>
        </div>
        <div className="header-right">
          <div className="header-total-label">Total Cash In</div>
          <div className="header-total">{fmtRp(totalCashIn)}</div>
        </div>
      </header>

      <KpiRow
        cashinCount={currentMonthPaidProjects.length}
        totalIncome={currentMonthCashIn}
        projects={projects}
        totalProjectValue={totalProjectValue}
        monthName={currentMonthName}
        year={currentYear}
      />

      <div className="grid">
        <div className="panel">
          <div className="panel-title">
            Cash In per Bulan <span className="tag">IDR</span>
          </div>
          <MonthlyChart data={data} monthlyTotals={monthlyTotals} />
        </div>
        <div className="panel">
          <div className="panel-title">Status Invoice</div>
          <StatusDonut projects={projects} />
        </div>
      </div>

      <div className="grid">
        <div className="panel">
          <div className="panel-title">Nilai Proyek per Klien</div>
          <GroupBars projects={projects} groupKey="client_norm" topN={8} />
        </div>
        <div className="panel">
          <div className="panel-title">Nilai Proyek per PIC</div>
          <GroupBars projects={projects} groupKey="pic" topN={8} />
        </div>
      </div>

      <div className="foot-note">
        Data diproses dari file monitoring proyek yang diupload · lihat menu
        "Rekap Bulanan" dan "Kelola Invoice" di sidebar untuk detail lebih
        lanjut
      </div>
    </div>
  );
}
