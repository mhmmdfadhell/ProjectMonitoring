"use client";

import { useMemo, useState } from "react";
import type { MonitoringData } from "@/lib/types";
import { fmtRp, getProjectTransferMonthYear, MONTH_NAMES, getInvoiceType, availableYears } from "@/lib/format";
import { useProjects } from "@/lib/useProjects";
import KpiRow from "@/components/KpiRow";
import MonthlyChart from "@/components/MonthlyChart";
import StatusDonut from "@/components/StatusDonut";
import GroupBars from "@/components/GroupBars";

export default function OverviewView({ data }: { data: MonitoringData }) {
  const { projects } = useProjects(data.projects);

  const now = new Date();
  const currentMonthName = MONTH_NAMES[now.getMonth()];
  
  const allYears = useMemo(() => availableYears(projects), [projects]);
  const defaultYear = allYears.length > 0 ? allYears[0] : now.getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(defaultYear);

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
      return trf && trf.month === currentMonthName && trf.year === selectedYear;
    });
  }, [paidProjects, currentMonthName, selectedYear]);

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
      if (trf && trf.year === selectedYear) {
        map[trf.month] = (map[trf.month] || 0) + (p.value || 0);
      }
    }
    return map;
  }, [paidProjects, data.month_order, selectedYear]);

  const invoiceTypeStats = useMemo(() => {
    const stats = {
      NFT: { submitCount: 0, paidCount: 0, submitValue: 0, paidValue: 0 },
      Aigen: { submitCount: 0, paidCount: 0, submitValue: 0, paidValue: 0 },
      GS: { submitCount: 0, paidCount: 0, submitValue: 0, paidValue: 0 },
    };
    for (const p of projects) {
      const type = getInvoiceType(p.no_invoice) as keyof typeof stats;
      if (stats[type]) {
        const isPaid = p.status === "Paid";
        const isSubmit = isPaid || p.status === "Invoiced - Unpaid" || !!p.invoice_submit;
        
        if (isSubmit) {
          stats[type].submitCount++;
          stats[type].submitValue += (p.value || 0);
        }
        if (isPaid) {
          stats[type].paidCount++;
          stats[type].paidValue += (p.value || 0);
        }
      }
    }
    return stats;
  }, [projects]);

  return (
    <div className="wrap">
      <header>
        <div>
          <div className="brand-eyebrow">// Project Cash</div>
          <h1>Overview</h1>
          <div className="subtitle" style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "8px" }}>
            Summary cash-in per proyek untuk tahun
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              style={{
                background: "var(--surface2)",
                border: "1px solid var(--border)",
                color: "var(--text)",
                padding: "2px 8px",
                borderRadius: "6px",
                fontSize: "12px",
                cursor: "pointer",
                outline: "none"
              }}
            >
              {allYears.length === 0 && <option value={selectedYear}>{selectedYear}</option>}
              {allYears.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
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
        year={selectedYear}
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
          <div className="panel-title">Jumlah Invoice per Jenis</div>
          <div className="table-wrap" style={{ marginTop: 12, border: "none" }}>
            <table>
              <thead>
                <tr>
                  <th>Jenis Invoice</th>
                  <th style={{ textAlign: "right" }}>Jml Submit</th>
                  <th style={{ textAlign: "right" }}>Nilai Submit</th>
                  <th style={{ textAlign: "right" }}>Jml Paid</th>
                  <th style={{ textAlign: "right" }}>Nilai Paid</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ fontWeight: 600 }}>NFT</td>
                  <td className="val">{invoiceTypeStats.NFT.submitCount}</td>
                  <td className="val">{fmtRp(invoiceTypeStats.NFT.submitValue)}</td>
                  <td className="val">{invoiceTypeStats.NFT.paidCount}</td>
                  <td className="val">{fmtRp(invoiceTypeStats.NFT.paidValue)}</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 600 }}>Aigen</td>
                  <td className="val">{invoiceTypeStats.Aigen.submitCount}</td>
                  <td className="val">{fmtRp(invoiceTypeStats.Aigen.submitValue)}</td>
                  <td className="val">{invoiceTypeStats.Aigen.paidCount}</td>
                  <td className="val">{fmtRp(invoiceTypeStats.Aigen.paidValue)}</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 600 }}>GS</td>
                  <td className="val">{invoiceTypeStats.GS.submitCount}</td>
                  <td className="val">{fmtRp(invoiceTypeStats.GS.submitValue)}</td>
                  <td className="val">{invoiceTypeStats.GS.paidCount}</td>
                  <td className="val">{fmtRp(invoiceTypeStats.GS.paidValue)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div className="panel">
          <div className="panel-title">Nilai Proyek per Klien</div>
          <GroupBars projects={projects} groupKey="client_norm" topN={8} />
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
