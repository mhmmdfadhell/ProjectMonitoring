import InvoiceView from "@/components/InvoiceView";
import monitoringData from "@/data/monitoring.json";
import type { MonitoringData } from "@/lib/types";

export default function InvoicePage() {
  return <InvoiceView data={monitoringData as unknown as MonitoringData} />;
}
