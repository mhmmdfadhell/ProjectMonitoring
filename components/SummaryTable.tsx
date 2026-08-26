import { fmtRp } from "@/lib/format";

export interface SummaryRow {
  key: string;
  label: string;
  cashInTotal: number;
  invoiceCount: number;
  invoiceTotal: number;
  paidTotal: number;
  unpaidTotal: number;
}

export default function SummaryTable({
  rows,
  labelHeader = "Periode",
  showTotal = true,
  onView,
}: {
  rows: SummaryRow[];
  labelHeader?: string;
  showTotal?: boolean;
  onView?: (row: SummaryRow) => void;
}) {
  const grand = rows.reduce(
    (acc, r) => ({
      cashInTotal: acc.cashInTotal + (r.cashInTotal || 0),
      invoiceCount: acc.invoiceCount + (r.invoiceCount || 0),
      invoiceTotal: acc.invoiceTotal + (r.invoiceTotal || 0),
      paidTotal: acc.paidTotal + (r.paidTotal || 0),
      unpaidTotal: acc.unpaidTotal + (r.unpaidTotal || 0),
    }),
    { cashInTotal: 0, invoiceCount: 0, invoiceTotal: 0, paidTotal: 0, unpaidTotal: 0 }
  );

  return (
    <div className="table-wrap">
      <table className="summary-table">
        <thead>
          <tr>
            <th>{labelHeader}</th>
            <th style={{ textAlign: "right" }}>Cash In (Bank)</th>
            <th style={{ textAlign: "right" }}>Jml Invoice</th>
            <th style={{ textAlign: "right" }}>Nilai Invoice</th>
            <th style={{ textAlign: "right" }}>Sudah Dibayar</th>
            <th style={{ textAlign: "right" }}>Belum Dibayar</th>
            {onView && <th style={{ textAlign: "center", width: "70px" }}>Aksi</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.key}>
              <td>{r.label}</td>
              <td className={`num${r.cashInTotal === 0 ? " dim" : ""}`}>
                {r.cashInTotal === 0 ? "—" : fmtRp(r.cashInTotal)}
              </td>
              <td className={`num${r.invoiceCount === 0 ? " dim" : ""}`}>
                {r.invoiceCount || "—"}
              </td>
              <td className={`num${r.invoiceTotal === 0 ? " dim" : ""}`}>
                {r.invoiceTotal === 0 ? "—" : fmtRp(r.invoiceTotal)}
              </td>
              <td className={`num${r.paidTotal === 0 ? " dim" : ""}`}>
                {r.paidTotal === 0 ? "—" : fmtRp(r.paidTotal)}
              </td>
              <td className={`num${r.unpaidTotal === 0 ? " dim" : ""}`}>
                {r.unpaidTotal === 0 ? "—" : fmtRp(r.unpaidTotal)}
              </td>
              {onView && (
                <td style={{ textAlign: "center" }}>
                  <button
                    type="button"
                    className="btn-icon"
                    title={`Lihat rincian transaksi ${r.label}`}
                    aria-label={`Lihat rincian transaksi ${r.label}`}
                    onClick={() => onView(r)}
                  >
                    👁
                  </button>
                </td>
              )}
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={onView ? 7 : 6} style={{ textAlign: "center", padding: "20px" }}>
                Tidak ada data untuk periode ini.
              </td>
            </tr>
          )}
          {showTotal && rows.length > 0 && (
            <tr className="total-row">
              <td>Total</td>
              <td className="num">{fmtRp(grand.cashInTotal)}</td>
              <td className="num">{grand.invoiceCount}</td>
              <td className="num">{fmtRp(grand.invoiceTotal)}</td>
              <td className="num">{fmtRp(grand.paidTotal)}</td>
              <td className="num">{fmtRp(grand.unpaidTotal)}</td>
              {onView && <td style={{ textAlign: "center", color: "var(--text-faint)" }}>—</td>}
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
