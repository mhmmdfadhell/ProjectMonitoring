import OverviewView from "@/components/OverviewView";
import monitoringData from "@/data/monitoring.json";
import type { MonitoringData } from "@/lib/types";

export default function Home() {
  return <OverviewView data={monitoringData as unknown as MonitoringData} />;
}
