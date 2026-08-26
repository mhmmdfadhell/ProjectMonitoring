"use client";

import type { MonitoringData } from "@/lib/types";
import { useProjects } from "@/lib/useProjects";
import ProjectTable from "@/components/ProjectTable";

export default function InvoiceView({ data }: { data: MonitoringData }) {
  const {
    projects,
    addProject,
    updateProject,
    deleteProject,
    resetToSeed,
    storageOk,
  } = useProjects(data.projects);

  return (
    <div className="wrap">
      <header>
        <div>
          <div className="brand-eyebrow">// Project Cash </div>
          <h1>Kelola Invoice</h1>
          <div className="subtitle">
            Tambah, ubah status, dan hapus data invoice proyek
          </div>
        </div>
      </header>

      {!storageOk && (
        <div className="storage-warning">
          ⚠ Penyimpanan otomatis di browser ini tidak berhasil (mode privat,
          pengaturan privasi, atau kuota penuh). Perubahan hanya berlaku
          selama sesi ini dan akan hilang saat halaman ditutup/refresh.
        </div>
      )}

      <div className="panel">
        <div className="panel-title">
          Detail Proyek <span className="tag">{projects.length} proyek</span>
        </div>
        <ProjectTable
          projects={projects}
          monthOrder={data.month_order}
          onAdd={addProject}
          onUpdate={updateProject}
          onDelete={deleteProject}
          onReset={resetToSeed}
        />
      </div>

      <div className="foot-note">
        Perubahan tersimpan otomatis di browser ini · terlihat juga di menu
        Overview dan Rekap Bulanan
      </div>
    </div>
  );
}
