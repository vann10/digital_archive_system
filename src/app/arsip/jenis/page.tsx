import Link from "next/link";
import { getJenisArsipList } from "../../../app/actions/jenis-arsip";
import {
  Plus,
  FolderOpen,
  Pencil,
  LayoutTemplate,
} from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
// Import komponen delete yang baru dibuat
import { DeleteJenisButton } from "../../../components/arsip/delete-button";

export const dynamic = "force-dynamic";

export default async function JenisArsipPage() {
  const jenisList = await getJenisArsipList();

  return (
    <div className="space-y-5 animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Manajemen Jenis Arsip
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Buat dan atur template struktur data untuk setiap jenis arsip.
        </p>
      </div>

      {/* Grid Container */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* CARD 1: CREATE NEW */}
        <Link href="/arsip/jenis/form" className="group block h-full">
          <div className="h-full border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center p-8 text-center hover:border-blue-500 hover:bg-blue-50/30 transition-all cursor-pointer min-h-[180px]">
            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Plus className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-slate-900 group-hover:text-blue-700">
              Buat Jenis Baru
            </h3>
            <p className="text-sm text-slate-500 mt-1 max-w-[200px]">
              Tambahkan template arsip dengan kolom kustom.
            </p>
          </div>
        </Link>

        {/* MAPPING EXISTING CARDS */}
        {jenisList.map((item: any) => (
          <div
            key={item.id}
            className="group relative bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md hover:border-blue-200 transition-all flex flex-col"
          >
            {/* CARD HEADER & ACTIONS */}
            <div className="p-5 flex items-start justify-between pb-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center border border-slate-200 text-slate-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <LayoutTemplate className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 leading-tight">
                    {item.nama}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge
                      variant="secondary"
                      className="text-[10px] bg-slate-100 text-slate-600 px-1.5 h-5 font-normal"
                    >
                      {item.colCount || 0} Kolom
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center">
                <Button
                  asChild
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-slate-400 hover:text-blue-600"
                  title="Edit Konfigurasi"
                >
                  <Link href={`/arsip/jenis/form?id=${item.id}`}>
                    <Pencil className="w-4 h-4" />
                  </Link>
                </Button>

                {/* Gunakan Component Delete Baru */}
                <DeleteJenisButton id={item.id} />
              </div>
            </div>

            {/* DESCRIPTION */}
            <div className="px-5 pb-4 flex-1">
              <p className="text-sm text-slate-500 line-clamp-2 min-h-[40px]">
                {item.deskripsi || "Tidak ada deskripsi."}
              </p>
            </div>

            {/* FOOTER LINK */}
            <Link
              href={`/arsip?jenis=${item.id}`}
              className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 rounded-b-xl flex items-center justify-between text-sm font-medium text-slate-600 hover:text-blue-600 hover:bg-blue-50/30 transition-colors"
            >
              <span>Lihat Data Arsip</span>
              <FolderOpen className="w-4 h-4" />
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}