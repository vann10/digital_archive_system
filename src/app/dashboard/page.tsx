// src/app/dashboard/page.tsx

import Link from "next/link";
import { getAllDashboardData } from "../actions/dashboard";
import { StatsCards } from "@/src/components/dashboard/stats-card";
import { BarChartCard } from "@/src/components/dashboard/bar-chart";
import { PieChartCard } from "@/src/components/dashboard/pie-chart";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { BackupButton } from "@/src/components/dashboard/backup-button";
import { ActivityLog } from "@/src/components/dashboard/activity-log";
import { getSessionUser } from "@/src/lib/auth-helpers"; // ← tambahkan import ini
import {
  Plus,
  FileSpreadsheet,
  Upload,
  Download,
  FolderPlus,
} from "lucide-react";

export default async function DashboardPage() {
  const [{ stats, arsipPerBulan, jenisDistribution, logAktivitasList }, sessionUser] =
    await Promise.all([getAllDashboardData(), getSessionUser()]); // ← fetch session sekalian

  const isAdmin = sessionUser?.role === "admin"; // ← cek role

  return (
    <div className="space-y-3 -mx-5 animate-in fade-in slide-in-from-bottom-4 duration-700 zoom-dashboard">
      {/* HEADER */}
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-bold text-slate-900">
          Sistem Arsip Digital Dinas Sosial Surakarta
        </h1>
        <p className="text-xs text-slate-500">
          Ringkasan aktivitas arsip digital Dinas Sosial
        </p>
      </div>

      {/* QUICK ACTIONS */}
      <Card className="border border-slate-200 shadow-sm bg-gradient-to-br from-blue-50 to-white">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-700">Quick Actions</h2>
            {/* Backup Button - hanya tampil untuk admin */}
            {isAdmin && <BackupButton />} {/* ← render kondisional berdasarkan role */}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Button
              asChild
              variant="outline"
              className="h-auto flex-col items-start p-3 hover:bg-blue-50 hover:border-blue-300 transition-all group"
            >
              <Link href="/arsip/input">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                    <Plus className="h-4 w-4 text-blue-600" />
                  </div>
                  <span className="font-semibold text-xs">Input Arsip</span>
                </div>
                <p className="text-[10px] text-slate-500 text-left">Tambah arsip baru</p>
              </Link>
            </Button>

            <Button
              asChild
              variant="outline"
              className="h-auto flex-col items-start p-3 hover:bg-green-50 hover:border-green-300 transition-all group"
            >
              <Link href="/arsip/jenis">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center group-hover:bg-green-200 transition-colors">
                    <FolderPlus className="h-4 w-4 text-green-600" />
                  </div>
                  <span className="font-semibold text-xs">Jenis Arsip</span>
                </div>
                <p className="text-[10px] text-slate-500 text-left">Kelola kategori</p>
              </Link>
            </Button>

            <Button
              asChild
              variant="outline"
              className="h-auto flex-col items-start p-3 hover:bg-orange-50 hover:border-orange-300 transition-all group"
            >
              <Link href="/arsip/import">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center group-hover:bg-orange-200 transition-colors">
                    <Upload className="h-4 w-4 text-orange-600" />
                  </div>
                  <span className="font-semibold text-xs">Import</span>
                </div>
                <p className="text-[10px] text-slate-500 text-left">Import dari CSV</p>
              </Link>
            </Button>

            <Button
              asChild
              variant="outline"
              className="h-auto flex-col items-start p-3 hover:bg-purple-50 hover:border-purple-300 transition-all group"
            >
              <Link href="/arsip/export">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                    <Download className="h-4 w-4 text-purple-600" />
                  </div>
                  <span className="font-semibold text-xs">Export</span>
                </div>
                <p className="text-[10px] text-slate-500 text-left">Export ke Excel</p>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* STATS */}
      <StatsCards
        totalArsip={stats.totalArsip}
        arsipBulanIni={stats.arsipBulanIni}
        penggunaAktif={stats.penggunaAktif}
        totalJenisArsip={stats.totalJenisArsip}
      />

      {/* CHARTS + ACTIVITY LOG */}
      <div className="grid gap-4 md:grid-cols-7 lg:grid-cols-7">
        <BarChartCard data={arsipPerBulan} />
        <PieChartCard data={jenisDistribution} />
      </div>

      {/* LOG AKTIVITAS */}
      <ActivityLog logs={logAktivitasList} />
    </div>
  );
}