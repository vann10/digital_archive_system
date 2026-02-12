'use client';

import { 
  FileText, 
  FolderKanban, 
  Users, 
  TrendingUp, 
  ArrowUpRight,
} from 'lucide-react';
import { Card, CardContent } from '../ui/card';

interface StatsCardsProps {
  totalArsip: number;
  arsipBulanIni: number;
  penggunaAktif: number;
  totalJenisArsip: number;
}

export function StatsCards({
  totalArsip,
  arsipBulanIni,
  penggunaAktif,
  totalJenisArsip,
}: StatsCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Card 1: Total Arsip */}
      <Card className="shadow-sm border-slate-200 hover:shadow-md transition-shadow">
        <CardContent className="p-6 flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 mb-1">Total Arsip</p>
            <h3 className="text-2xl font-bold text-slate-900">
              {totalArsip.toLocaleString('id-ID')}
            </h3>
            <p className="text-xs text-slate-400 mt-1">Semua dokumen</p>
          </div>
          <div className="p-3 bg-blue-50 rounded-lg">
            <FileText className="w-5 h-5 text-blue-600" />
          </div>
        </CardContent>
      </Card>

      {/* Card 2: Total Jenis Arsip */}
      <Card className="shadow-sm border-slate-200 hover:shadow-md transition-shadow">
        <CardContent className="p-6 flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 mb-1">Total Jenis Arsip</p>
            <h3 className="text-2xl font-bold text-slate-900">
              {totalJenisArsip}
            </h3>
            <p className="text-xs text-slate-400 mt-1">Kategori aktif</p>
          </div>
          <div className="p-3 bg-green-50 rounded-lg">
            <FolderKanban className="w-5 h-5 text-green-600" />
          </div>
        </CardContent>
      </Card>

      {/* Card 3: Arsip Bulan Ini */}
      <Card className="shadow-sm border-slate-200 hover:shadow-md transition-shadow">
        <CardContent className="p-6 flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 mb-1">Arsip Bulan Ini</p>
            <h3 className="text-2xl font-bold text-slate-900">
              {arsipBulanIni.toLocaleString('id-ID')}
            </h3>
            <p className="text-xs text-slate-400 mt-1">Dokumen baru</p>
          </div>
          <div className="p-3 bg-orange-50 rounded-lg">
            <TrendingUp className="w-5 h-5 text-orange-600" />
          </div>
        </CardContent>
      </Card>

      {/* Card 4: Pengguna Aktif */}
      <Card className="shadow-sm border-slate-200 hover:shadow-md transition-shadow">
        <CardContent className="p-6 flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 mb-1">Pengguna Aktif</p>
            <h3 className="text-2xl font-bold text-slate-900">
              {penggunaAktif}
            </h3>
            <p className="text-xs text-slate-400 mt-1">User terdaftar</p>
          </div>
          <div className="p-3 bg-purple-50 rounded-lg">
            <Users className="w-5 h-5 text-purple-600" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}