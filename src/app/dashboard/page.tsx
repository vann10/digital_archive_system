// src/app/dashboard/page.tsx

import { getAllDashboardData } from "../actions/dashboard";
import { StatsCards } from "@/src/components/dashboard/stats-card";
import { BarChartCard } from "@/src/components/dashboard/bar-chart";
import { PieChartCard } from "@/src/components/dashboard/pie-chart";
import { ArsipTerbaruTable } from "@/src/components/dashboard/arsip-terbaru";

export default async function DashboardPage() {
  const { stats, arsipPerBulan, jenisDistribution, arsipTerbaru } =
    await getAllDashboardData();

  return (
    <div className="space-y-4 -mx-5 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* HEADER */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-slate-900">
          Sistem Arsip Digital Dinas Sosial Surakarta
        </h1>
        <p className="text-sm text-slate-500">
          Ringkasan aktivitas arsip digital Dinas Sosial
        </p>
      </div>

      {/* STATS */}
      <StatsCards
        totalArsip={stats.totalArsip}
        arsipBulanIni={stats.arsipBulanIni}
        penggunaAktif={stats.penggunaAktif}
        growthBulanIni={stats.growthBulanIni}
      />

      {/* CHARTS */}
      <div className="grid gap-6 md:grid-cols-7 lg:grid-cols-7">
        <BarChartCard data={arsipPerBulan} />
        <PieChartCard data={jenisDistribution} />
      </div>

      {/* RECENT */}
      <ArsipTerbaruTable data={arsipTerbaru} />
    </div>
  );
}
