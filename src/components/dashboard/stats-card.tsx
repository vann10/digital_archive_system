'use client';

import { 
  FileText, 
  FolderOpen, 
  Users, 
  TrendingUp, 
  ArrowUpRight,
  Minus
} from 'lucide-react';
import { Card, CardContent } from '../ui/card';

interface StatsCardsProps {
  totalArsip: number;
  arsipBulanIni: number;
  penggunaAktif: number;
  growthBulanIni: number;
}

export function StatsCards({
  totalArsip,
  arsipBulanIni,
  penggunaAktif,
  growthBulanIni,
}: StatsCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Card 1: Total Arsip */}
      <Card className="shadow-sm border-slate-200">
        <CardContent className="p-6 flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 mb-1">Total Arsip</p>
            <h3 className="text-2xl font-bold text-slate-900">
              {totalArsip.toLocaleString('id-ID')}
            </h3>
          </div>
          <div className="p-3 bg-blue-50 rounded-lg">
            <FileText className="w-5 h-5 text-blue-600" />
          </div>
        </CardContent>
      </Card>

      {/* Card 2: Arsip Aktif */}
      <Card className="shadow-sm border-slate-200">
        <CardContent className="p-6 flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 mb-1">Arsip Aktif</p>
          </div>
          <div className="p-3 bg-blue-50 rounded-lg">
            <FolderOpen className="w-5 h-5 text-blue-600" />
          </div>
        </CardContent>
      </Card>

      {/* Card 3: Arsip Bulan Ini */}
      <Card className="shadow-sm border-slate-200">
        <CardContent className="p-6 flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 mb-1">Arsip Masuk Bulan Ini</p>
            <h3 className="text-2xl font-bold text-slate-900">
              {arsipBulanIni.toLocaleString('id-ID')}
            </h3>
            <div className={`flex items-center mt-2 text-xs font-medium ${
              growthBulanIni >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              <ArrowUpRight className={`w-3 h-3 mr-1 ${growthBulanIni < 0 ? 'rotate-180' : ''}`} />
              {growthBulanIni >= 0 ? '+' : ''}{growthBulanIni.toFixed(1)}% 
              <span className="text-slate-400 font-normal ml-1">dari bulan lalu</span>
            </div>
          </div>
          <div className="p-3 bg-blue-50 rounded-lg">
            <TrendingUp className="w-5 h-5 text-blue-600" />
          </div>
        </CardContent>
      </Card>

      {/* Card 4: Pengguna Aktif */}
      <Card className="shadow-sm border-slate-200">
        <CardContent className="p-6 flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 mb-1">Pengguna Aktif</p>
            <h3 className="text-2xl font-bold text-slate-900">
              {penggunaAktif}
            </h3>
          </div>
          <div className="p-3 bg-blue-50 rounded-lg">
            <Users className="w-5 h-5 text-blue-600" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}