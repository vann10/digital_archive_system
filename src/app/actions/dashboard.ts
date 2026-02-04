"use server";

import { db } from "../../db";
import { arsip, jenisArsip, users } from "../../db/schema";
import { count, desc, eq, sql, and, gte } from "drizzle-orm";

// ================= TYPES =================
export interface DashboardStats {
  totalArsip: number;
  arsipAktif: number;
  arsipBulanIni: number;
  penggunaAktif: number;
  growthArsip: number;
  growthArsipAktif: number;
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
  judul: string;
  kode: string;
  jenis: string;
  tahun: number;
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
    const lastMonth = month === 1 ? 12 : month - 1;
    const lastMonthYear = month === 1 ? year - 1 : year;

    const startOfMonth = `${year}-${String(month).padStart(2, "0")}-01`;
    const startOfLastMonth = `${lastMonthYear}-${String(lastMonth).padStart(2, "0")}-01`;

    // TOTAL ARSIP
    const totalArsip = (await db.select({ count: count() }).from(arsip))[0].count;

    // ARSIP AKTIF TOTAL
    const arsipAktif = (
      await db
        .select({ count: count() })
        .from(arsip)
        .where(eq(arsip.status, "aktif"))
    )[0].count;

    // ARSIP BULAN INI
    const arsipBulanIni = (
      await db
        .select({ count: count() })
        .from(arsip)
        .where(gte(arsip.createdAt, startOfMonth))
    )[0].count;

    // ARSIP BULAN LALU
    const arsipBulanLalu = (
      await db
        .select({ count: count() })
        .from(arsip)
        .where(
          and(
            gte(arsip.createdAt, startOfLastMonth),
            sql`${arsip.createdAt} < ${startOfMonth}`
          )
        )
    )[0].count;

    // ARSIP AKTIF BULAN INI
    const arsipAktifNow = (
      await db
        .select({ count: count() })
        .from(arsip)
        .where(
          and(
            eq(arsip.status, "aktif"),
            gte(arsip.createdAt, startOfMonth)
          )
        )
    )[0].count;

    // ARSIP AKTIF BULAN LALU
    const arsipAktifLast = (
      await db
        .select({ count: count() })
        .from(arsip)
        .where(
          and(
            eq(arsip.status, "aktif"),
            gte(arsip.createdAt, startOfLastMonth),
            sql`${arsip.createdAt} < ${startOfMonth}`
          )
        )
    )[0].count;

    // PENGGUNA
    const penggunaAktif = (await db.select({ count: count() }).from(users))[0].count;

    // GROWTH REAL
    const growthBulanIni = arsipBulanLalu > 0
      ? ((arsipBulanIni - arsipBulanLalu) / arsipBulanLalu) * 100
      : 0;

    const growthArsip = totalArsip > 0
      ? ((arsipBulanIni) / totalArsip) * 100
      : 0;

    const growthArsipAktif = arsipAktifLast > 0
      ? ((arsipAktifNow - arsipAktifLast) / arsipAktifLast) * 100
      : 0;

    return {
      totalArsip,
      arsipAktif,
      arsipBulanIni,
      penggunaAktif,
      growthArsip: Number(growthArsip.toFixed(2)),
      growthArsipAktif: Number(growthArsipAktif.toFixed(2)),
      growthBulanIni: Number(growthBulanIni.toFixed(2)),
    };
  } catch (err) {
    console.error(err);
    return {
      totalArsip: 0,
      arsipAktif: 0,
      arsipBulanIni: 0,
      penggunaAktif: 0,
      growthArsip: 0,
      growthArsipAktif: 0,
      growthBulanIni: 0,
    };
  }
}

// ================= BAR CHART =================
export async function getArsipPerBulan(): Promise<ArsipPerBulan[]> {
  const year = new Date().getFullYear();
  const bulan = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];

  const result = await db
    .select({
      month: sql<number>`CAST(strftime('%m', ${arsip.createdAt}) AS INTEGER)`,
      total: count(),
    })
    .from(arsip)
    .where(sql`strftime('%Y', ${arsip.createdAt}) = ${year.toString()}`)
    .groupBy(sql`strftime('%m', ${arsip.createdAt})`);

  return bulan.map((name, i) => {
    const found = result.find(r => r.month === i + 1);
    return { name, total: found?.total || 0 };
  });
}

// ================= PIE CHART =================
export async function getJenisArsipDistribution(): Promise<JenisArsipDistribution[]> {
  const result = await db
    .select({ name: jenisArsip.nama, value: count() })
    .from(arsip)
    .innerJoin(jenisArsip, eq(arsip.jenisArsipId, jenisArsip.id))
    .where(eq(jenisArsip.isActive, true))
    .groupBy(jenisArsip.id, jenisArsip.nama);

  return result.map((r, i) => ({
    ...r,
    color: CHART_COLORS[i % CHART_COLORS.length],
  }));
}

// ================= LATEST =================
export async function getArsipTerbaru(): Promise<ArsipTerbaru[]> {
  const result = await db
    .select({
      id: arsip.id,
      judul: arsip.judul,
      nomorArsip: arsip.nomorArsip,
      jenisNama: jenisArsip.nama,
      tahun: arsip.tahun,
      createdAt: arsip.createdAt,
    })
    .from(arsip)
    .innerJoin(jenisArsip, eq(arsip.jenisArsipId, jenisArsip.id))
    .orderBy(desc(arsip.createdAt))
    .limit(5);

  return result.map(r => ({
    id: r.id,
    judul: r.judul,
    kode: r.nomorArsip || "-",
    jenis: r.jenisNama,
    tahun: r.tahun,
    tanggal: new Date(r.createdAt!).toLocaleDateString("id-ID"),
  }));
}

// ================= ALL =================
export async function getAllDashboardData() {
  const [stats, arsipPerBulan, jenisDistribution, arsipTerbaru] = await Promise.all([
    getDashboardStats(),
    getArsipPerBulan(),
    getJenisArsipDistribution(),
    getArsipTerbaru(),
  ]);

  return { stats, arsipPerBulan, jenisDistribution, arsipTerbaru };
}
