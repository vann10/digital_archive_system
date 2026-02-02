import React from "react";
import { getAllDashboardData } from "../actions/dashboard";
import { StatsCards } from "@/src/components/dashboard/stats-card";
import { BarChartCard } from "@/src/components/dashboard/bar-chart";
import { PieChartCard } from "@/src/components/dashboard/pie-chart";
import { ArsipTerbaruTable } from "@/src/components/dashboard/arsip-terbaru";

export default async function DashboardPage() {
  // Ambil semua data dari database (Server Component)
  const { stats, arsipPerBulan, jenisDistribution, arsipTerbaru } =
    await getAllDashboardData();

  return (
    <div className="space-y-4 -mx-5 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* 1. HEADER SECTION */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-slate-900">
          Selamat Datang, Admin
        </h1>
        <p className="text-sm text-slate-500">
          Ringkasan aktivitas arsip digital Dinas Sosial
        </p>
      </div>

      {/* 2. STATS CARDS ROW */}
      <StatsCards
        totalArsip={stats.totalArsip}
        arsipAktif={stats.arsipAktif}
        arsipBulanIni={stats.arsipBulanIni}
        penggunaAktif={stats.penggunaAktif}
        growthArsip={stats.growthArsip}
        growthArsipAktif={stats.growthArsipAktif}
        growthBulanIni={stats.growthBulanIni}
      />

      {/* 3. CHARTS ROW */}
      <div className="grid gap-6 md:grid-cols-7 lg:grid-cols-7">
        {/* LEFT CHART: BAR CHART */}
        <BarChartCard data={arsipPerBulan} />

        {/* RIGHT CHART: PIE CHART */}
        <PieChartCard data={jenisDistribution} />
      </div>

      {/* 4. RECENT ACTIVITY TABLE */}
      <ArsipTerbaruTable data={arsipTerbaru} />
    </div>
  );
}
