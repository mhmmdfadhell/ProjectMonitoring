# Monitoring Proyek 2026 — Dashboard (Next.js)

Dashboard cash-in dan status invoice per proyek, dibangun dengan Next.js 14
(App Router) + TypeScript + Chart.js.

## Menjalankan secara lokal

```bash
npm install
npm run dev
```

Buka http://localhost:3000

## Build production

```bash
npm run build
npm start
```

## Struktur

```
app/
  layout.tsx        Root layout: shell dengan Sidebar + area konten, init tema
  page.tsx           Route "/" — Overview (KPI, chart, breakdown klien/PIC)
  rekap/page.tsx      Route "/rekap" — Rekap Bulanan (filter Tahun/Bulan/7 Hari)
  invoice/page.tsx    Route "/invoice" — Kelola Invoice (CRUD + card per bulan)
  globals.css          Semua styling dashboard + shell/sidebar + tema light/dark
components/
  Sidebar.tsx           Navigasi sidebar (3 menu) + tombol ganti tema
  ThemeToggle.tsx        Tombol Light/Dark mode, tersimpan di localStorage
  OverviewView.tsx       Isi halaman Overview
  RekapView.tsx           Isi halaman Rekap Bulanan (mode Tahun/Bulan/7 Hari)
  InvoiceView.tsx          Isi halaman Kelola Invoice
  KpiRow.tsx               4 kartu ringkasan (KPI) — dipakai di Overview
  MonthlyChart.tsx          Grafik batang cash-in per bulan — dipakai di Overview
  StatusDonut.tsx           Donut chart status invoice — dipakai di Overview
  GroupBars.tsx             Bar list nilai proyek per klien/PIC — dipakai di Overview
  SummaryTable.tsx           Tabel ringkasan generik (dipakai Rekap Bulanan, 3 mode)
  MonthCard.tsx               Card per bulan berisi tabel invoice — dipakai di Kelola Invoice
  ProjectTable.tsx             Filter + grouping card + CRUD — dipakai di Kelola Invoice
  InvoiceFormModal.tsx          Form tambah/edit invoice (termasuk field Tahun)
lib/
  types.ts             Tipe data TypeScript (termasuk field `year`)
  format.ts            Helper format Rupiah (angka penuh), tanggal, sort bulan,
                         daftar tahun, dan 7 hari terakhir
  useProjects.ts        Hook CRUD (create/update/delete) + persist ke localStorage
data/
  monitoring.json      Data proyek hasil pembersihan dari file Excel (data awal / seed)
```

## Navigasi

Sidebar di kiri punya 3 menu, plus tombol ganti tema di bagian bawah:
- **Overview** (`/`) — ringkasan KPI, grafik cash-in bulanan, status invoice, dan
  breakdown per klien/PIC. Klien "Otsuka I" dan "Otsuka Indo" sudah digabung
  jadi satu ("Otsuka Indo") di seluruh dashboard.
- **Rekap Bulanan** (`/rekap`) — punya 3 mode filter:
  - **Per Tahun**: rekap 12 bulan untuk tahun yang dipilih.
  - **Per Bulan**: rekap satu bulan+tahun spesifik.
  - **7 Hari Terakhir**: rekap harian untuk 7 hari terakhir (berdasarkan
    tanggal transfer cash-in dan tanggal bayar/submit invoice).
- **Kelola Invoice** (`/invoice`) — tabel detail proyek dengan fitur CRUD
  penuh, sekarang ditampilkan sebagai **card per bulan** (mis. "Card Bulan
  Januari 2026"), dengan filter Tahun dan Bulan untuk menampilkan card yang
  relevan saja.

## Fitur CRUD Invoice (menu "Kelola Invoice")

- **Tambah Invoice**: tombol "+ Tambah Invoice" di atas daftar card membuka
  form untuk membuat entri invoice baru (bulan, **tahun**, klien, PIC, nilai,
  status, dsb).
- **Edit**: ikon pensil di setiap baris (di dalam card) membuka form yang
  sama, terisi data yang sudah ada.
- **Ubah status**: saat status diubah (mis. jadi "Paid"), kolom
  **Tanggal Perubahan Status** otomatis terisi tanggal hari ini — bisa
  ditimpa manual di form kalau perlu tanggal lain.
- **Hapus**: ikon tempat sampah, dengan konfirmasi sebelum data dihapus.
- **Filter Tahun & Bulan**: menentukan card mana saja yang ditampilkan.
  Kolom "Bulan" di header setiap card kini juga menampilkan tahunnya
  (contoh: "Januari 2026"), bukan cuma nama bulan saja.
- **Urutkan**: dropdown "Urutkan" (Nilai/Klien/PIC/Status/Tgl Bayar) + tombol
  arah panah untuk sort naik/turun di dalam setiap card.
- **Reset ke data awal**: tautan kecil di bawah daftar card untuk
  mengembalikan data ke kondisi awal (seed dari Excel).

Semua perubahan (tambah/edit/hapus) disimpan otomatis di **localStorage**
browser, jadi tetap ada saat halaman di-refresh dan terlihat konsisten di
ketiga menu (Overview, Rekap Bulanan, Kelola Invoice). Ini penyimpanan sisi
klien untuk kebutuhan personal — kalau butuh berbagi data antar device atau
tim lain, sambungkan `lib/useProjects.ts` ke backend/API atau database.

## Tema (Light / Dark Mode)

Tombol di bagian bawah sidebar mengganti antara Dark Mode (default) dan
Light Mode. Pilihan tersimpan di localStorage sehingga tetap konsisten saat
halaman dibuka ulang, dan diterapkan sebelum halaman sempat "kedip" ke tema
lain lewat skrip kecil di `app/layout.tsx`.

## Font

Semua teks di dashboard memakai **Plus Jakarta Sans**.

## Format angka

Semua nilai Rupiah ditulis penuh dengan pemisah ribuan, misalnya
`Rp100.000.000` — tidak lagi disingkat menjadi "100 Jt" atau "2.1 M".

## Penyimpanan & Troubleshooting

Semua perubahan CRUD disimpan otomatis ke `localStorage` browser lewat
`lib/useProjects.ts`. Jika penyimpanan gagal (mis. mode privat/incognito,
pengaturan privasi browser yang memblokir storage, atau kuota penuh), akan
muncul **banner kuning** di halaman "Kelola Invoice" yang memberi tahu bahwa
perubahan hanya berlaku untuk sesi saat ini dan tidak akan tersimpan setelah
refresh — supaya tidak ada perubahan yang hilang secara diam-diam tanpa
disadari.

## Mengganti data

Ganti isi `data/monitoring.json` mengikuti bentuk (shape) yang didefinisikan
di `lib/types.ts` (perhatikan field `year` yang wajib ada di setiap baris
`cashin` maupun `projects`). Data ini hanya dipakai sebagai seed awal —
begitu ada perubahan CRUD, browser akan memakai data dari localStorage.
