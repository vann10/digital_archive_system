import { Sidebar } from '../../components/layout/Sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // Gunakan Flexbox: Sidebar diam, Konten mengisi sisa ruang
    <div className="flex min-h-screen bg-slate-50">
      
      {/* Sidebar akan mengatur lebarnya sendiri (w-64 atau w-20) */}
      <Sidebar />

      {/* Area Konten Utama */}
      <main className="flex-1 p-8 overflow-y-auto h-screen">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>

    </div>
  );
}