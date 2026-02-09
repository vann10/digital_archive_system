"use server";

import { db } from "../../db";
import { jenisArsip, users } from "../../db/schema";
import { count, sql } from "drizzle-orm";

// ================= TYPES =================

export interface DashboardStats {
  totalArsip: number;
  arsipBulanIni: number;
  penggunaAktif: number;
  growthBulanIni: number;
}

export interface ArsipPerBulan {
  name: string;
  total: number;
}

export interface JenisArsipDistribution {
  name: string;
  value: number;
  color: string;
}

export interface ArsipTerbaru {
  id: number;
  kode: string;
  jenis: string;
  tanggal: string;
}

// ================= CONSTANT =================

const CHART_COLORS = [
  "#3B82F6",
  "#22C55E",
  "#F59E0B",
  "#8B5CF6",
  "#EC4899",
  "#06B6D4",
];

// ================= MAIN STATS =================

export async function getDashboardStats(): Promise<DashboardStats> {
  try {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const startOfMonth = `${year}-${String(month).padStart(2, "0")}-01`;

    // ambil semua jenis
    const jenisList = await db.select().from(jenisArsip);

    let totalArsip = 0;
    let arsipBulanIni = 0;

    for (const jenis of jenisList) {
      const tableName = jenis.namaTabel;

      if (!/^[a-zA-Z0-9_]+$/.test(tableName)) continue;

      const totalResult: any = await db.get(
        sql.raw(`SELECT COUNT(*) as count FROM ${tableName}`)
      );

      totalArsip += totalResult?.count || 0;

      const bulanResult: any = await db.get(
        sql.raw(`
          SELECT COUNT(*) as count 
          FROM ${tableName}
          WHERE created_at >= '${startOfMonth}'
        `)
      );

      arsipBulanIni += bulanResult?.count || 0;
    }

    // pengguna
    const penggunaAktif = (await db.select({ count: count() }).from(users))[0].count;

    return {
      totalArsip,
      arsipBulanIni,
      penggunaAktif,
      growthBulanIni: 0, // bisa ditambah nanti
    };
  } catch (err) {
    console.error(err);
    return {
      totalArsip: 0,
      arsipBulanIni: 0,
      penggunaAktif: 0,
      growthBulanIni: 0,
    };
  }
}

// ================= BAR CHART =================

export async function getArsipPerBulan(): Promise<ArsipPerBulan[]> {
  const year = new Date().getFullYear();
  const bulan = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];

  const jenisList = await db.select().from(jenisArsip);

  const monthlyTotals = new Array(12).fill(0);

  for (const jenis of jenisList) {
    const tableName = jenis.namaTabel;
    if (!/^[a-zA-Z0-9_]+$/.test(tableName)) continue;

    const result: any[] = await db.all(
      sql.raw(`
        SELECT 
          CAST(strftime('%m', created_at) AS INTEGER) as month,
          COUNT(*) as total
        FROM ${tableName}
        WHERE strftime('%Y', created_at) = '${year}'
        GROUP BY month
      `)
    );

    result.forEach(r => {
      monthlyTotals[r.month - 1] += r.total;
    });
  }

  return bulan.map((name, i) => ({
    name,
    total: monthlyTotals[i],
  }));
}

// ================= PIE CHART =================

export async function getJenisArsipDistribution(): Promise<JenisArsipDistribution[]> {
  const jenisList = await db.select().from(jenisArsip);

  const result: JenisArsipDistribution[] = [];

  for (let i = 0; i < jenisList.length; i++) {
    const jenis = jenisList[i];
    const tableName = jenis.namaTabel;

    if (!/^[a-zA-Z0-9_]+$/.test(tableName)) continue;

    const totalResult: any = await db.get(
      sql.raw(`SELECT COUNT(*) as count FROM ${tableName}`)
    );

    result.push({
      name: jenis.namaJenis,
      value: totalResult?.count || 0,
      color: CHART_COLORS[i % CHART_COLORS.length],
    });
  }

  return result;
}

// ================= LATEST =================

export async function getArsipTerbaru(): Promise<ArsipTerbaru[]> {
  const jenisList = await db.select().from(jenisArsip);

  let allData: ArsipTerbaru[] = [];

  for (const jenis of jenisList) {
    const tableName = jenis.namaTabel;

    if (!/^[a-zA-Z0-9_]+$/.test(tableName)) continue;

    const rows: any[] = await db.all(
      sql.raw(`
        SELECT id, kode_unik, created_at
        FROM ${tableName}
        ORDER BY created_at DESC
        LIMIT 5
      `)
    );

    rows.forEach(r => {
      allData.push({
        id: r.id,
        kode: r.kode_unik,
        jenis: jenis.namaJenis,
        tanggal: new Date(r.created_at).toLocaleDateString("id-ID"),
      });
    });
  }

  // sort global
  allData.sort((a, b) =>
    new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime()
  );

  return allData.slice(0, 5);
}

// ================= ALL =================

export async function getAllDashboardData() {
  const [stats, arsipPerBulan, jenisDistribution, arsipTerbaru] =
    await Promise.all([
      getDashboardStats(),
      getArsipPerBulan(),
      getJenisArsipDistribution(),
      getArsipTerbaru(),
    ]);

  return { stats, arsipPerBulan, jenisDistribution, arsipTerbaru };
}
