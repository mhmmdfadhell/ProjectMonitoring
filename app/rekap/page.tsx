import RekapView from "@/components/RekapView";
import monitoringData from "@/data/monitoring.json";
import type { MonitoringData } from "@/lib/types";

export default function RekapPage() {
  return <RekapView data={monitoringData as unknown as MonitoringData} />;
}
