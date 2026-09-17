import LaporanBulananView from "@/components/LaporanBulananView";
import monitoringData from "@/data/monitoring.json";
import type { MonitoringData } from "@/lib/types";

export default function LaporanPage() {
  return <LaporanBulananView data={monitoringData as unknown as MonitoringData} />;
}
