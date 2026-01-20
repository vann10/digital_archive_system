'use client';

import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  FileText, 
  FolderOpen, 
  Users, 
  TrendingUp, 
  MoreHorizontal,
  ArrowUpRight,
  Clock,
  Minus
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';

// --- DATA DUMMY ---

const dataArsipPerBulan = [
  { name: 'Jan', total: 45 },
  { name: 'Feb', total: 52 },
  { name: 'Mar', total: 38 },
  { name: 'Apr', total: 65 },
  { name: 'Mei', total: 72 },
  { name: 'Jun', total: 58 },
  { name: 'Jul', total: 48 },
  { name: 'Agu', total: 55 },
  { name: 'Sep', total: 62 },
  { name: 'Okt', total: 78 },
  { name: 'Nov', total: 85 },
  { name: 'Des', total: 42 },
];

const dataJenisArsip = [
  { name: 'Surat Masuk', value: 45, color: '#3B82F6' }, // Blue
  { name: 'Surat Keluar', value: 25, color: '#22C55E' }, // Green
  { name: 'Laporan', value: 20, color: '#F59E0B' }, // Orange
  { name: 'Dokumen Internal', value: 10, color: '#8B5CF6' }, // Purple
];

const dataArsipTerbaru = [
  {
    judul: 'Undangan Rapat Koordinasi Program Bantuan Sosial',
    kode: 'SM-001/DINSOS/2024',
    jenis: 'Surat Masuk',
    tahun: '2024',
    tanggal: '15/1/2024'
  },
  {
    judul: 'Permohonan Data Penerima PKH Triwulan I',
    kode: 'SM-002/DINSOS/2024',
    jenis: 'Surat Masuk',
    tahun: '2024',
    tanggal: '20/1/2024'
  },
  {
    judul: 'Pengiriman Laporan Realisasi Anggaran Tahun 2023',
    kode: 'SK-001/DINSOS/2024',
    jenis: 'Surat Keluar',
    tahun: '2024',
    tanggal: '22/1/2024'
  },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* 1. HEADER SECTION */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-slate-900">Selamat Datang, Admin</h1>
        <p className="text-sm text-slate-500">Ringkasan aktivitas arsip digital Dinas Sosial</p>
      </div>

      {/* 2. STATS CARDS ROW */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Total Arsip */}
        <Card className="shadow-sm border-slate-200">
          <CardContent className="p-6 flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 mb-1">Total Arsip</p>
              <h3 className="text-2xl font-bold text-slate-900">1,247</h3>
              <div className="flex items-center mt-2 text-xs font-medium text-green-600">
                <ArrowUpRight className="w-3 h-3 mr-1" />
                +12.5% <span className="text-slate-400 font-normal ml-1">dari bulan lalu</span>
              </div>
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
              <h3 className="text-2xl font-bold text-slate-900">892</h3>
              <div className="flex items-center mt-2 text-xs font-medium text-green-600">
                <ArrowUpRight className="w-3 h-3 mr-1" />
                +5.2% <span className="text-slate-400 font-normal ml-1">dari bulan lalu</span>
              </div>
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
              <p className="text-xs font-medium text-slate-500 mb-1">Arsip Bulan Ini</p>
              <h3 className="text-2xl font-bold text-slate-900">85</h3>
              <div className="flex items-center mt-2 text-xs font-medium text-green-600">
                <ArrowUpRight className="w-3 h-3 mr-1" />
                +18.3% <span className="text-slate-400 font-normal ml-1">dari bulan lalu</span>
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
              <h3 className="text-2xl font-bold text-slate-900">12</h3>
              <div className="flex items-center mt-2 text-xs font-medium text-slate-500">
                <Minus className="w-3 h-3 mr-1" />
                Stabil
              </div>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3. CHARTS ROW */}
      <div className="grid gap-6 md:grid-cols-7 lg:grid-cols-7">
        
        {/* LEFT CHART: BAR CHART (Ambil 4 dari 7 kolom grid) */}
        <Card className="col-span-4 shadow-sm border-slate-200">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-slate-800">Arsip per Bulan</CardTitle>
          </CardHeader>
          <CardContent className="pl-0">
            <div className="h-[300px] w-full">
              {/* ResponsiveContainer KUNCI agar chart resize mengikuti sidebar */}
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dataArsipPerBulan} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748B', fontSize: 12 }} 
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748B', fontSize: 12 }} 
                  />
                  <Tooltip 
                    cursor={{ fill: '#F1F5F9' }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar 
                    dataKey="total" 
                    fill="#3B82F6" 
                    radius={[4, 4, 0, 0]} 
                    barSize={30}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* RIGHT CHART: DONUT CHART (Ambil 3 dari 7 kolom grid) */}
        <Card className="col-span-3 shadow-sm border-slate-200">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-slate-800">Distribusi Jenis Arsip</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-[300px]">
              {/* Chart Pie */}
              <div className="w-[60%] h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={dataJenisArsip}
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {dataJenisArsip.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Legend Custom */}
              <div className="w-[40%] pl-4 space-y-3">
                {dataJenisArsip.map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: item.color }} 
                    />
                    <span className="text-xs text-slate-600 font-medium">{item.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 4. RECENT ACTIVITY TABLE */}
      <Card className="shadow-sm border-slate-200">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-slate-800">Arsip Terbaru</CardTitle>
          <p className="text-xs text-slate-500">5 arsip terakhir yang ditambahkan</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {dataArsipTerbaru.map((item, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-lg hover:bg-slate-50 transition-colors">
                
                {/* Icon & Judul */}
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-800">{item.judul}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-slate-500 font-mono">{item.kode}</span>
                      <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                      <span className="text-xs text-slate-500">{item.jenis}</span>
                    </div>
                  </div>
                </div>

                {/* Tahun & Tanggal */}
                <div className="text-right hidden sm:block">
                  <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 mb-1">
                    {item.tahun}
                  </div>
                  <div className="flex items-center justify-end text-xs text-slate-400 mt-1">
                    <Clock className="w-3 h-3 mr-1" />
                    {item.tanggal}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}