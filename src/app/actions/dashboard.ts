"use server";

import { db } from "../../db";
import { arsip, jenisArsip, users, logAktivitas } from "../../db/schema";
import { count, desc, eq, sql, and, gte } from "drizzle-orm";

// Interface untuk tipe data
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

// Warna untuk pie chart
const CHART_COLORS = ['#3B82F6', '#22C55E', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4'];

/**
 * Mendapatkan statistik utama dashboard
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  try {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
    const lastMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const lastMonthYear = currentMonth === 1 ? currentYear - 1 : currentYear;

    // 1. Total Arsip
    const totalArsipResult = await db.select({ count: count() }).from(arsip);
    const totalArsip = totalArsipResult[0]?.count || 0;

    // 2. Arsip Aktif (arsip tahun ini dan tahun lalu)
    const arsipAktifResult = await db
      .select({ count: count() })
      .from(arsip)
      .where(gte(arsip.tahun, currentYear - 1));
    const arsipAktif = arsipAktifResult[0]?.count || 0;

    // 3. Arsip Bulan Ini
    const startOfMonth = `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`;
    const arsipBulanIniResult = await db
      .select({ count: count() })
      .from(arsip)
      .where(gte(arsip.createdAt, startOfMonth));
    const arsipBulanIni = arsipBulanIniResult[0]?.count || 0;

    // 4. Arsip Bulan Lalu (untuk perhitungan growth)
    const startOfLastMonth = `${lastMonthYear}-${String(lastMonth).padStart(2, '0')}-01`;
    const endOfLastMonth = new Date(lastMonthYear, lastMonth, 0).toISOString().split('T')[0];
    const arsipBulanLaluResult = await db
      .select({ count: count() })
      .from(arsip)
      .where(
        and(
          gte(arsip.createdAt, startOfLastMonth),
          sql`${arsip.createdAt} < ${startOfMonth}`
        )
      );
    const arsipBulanLalu = arsipBulanLaluResult[0]?.count || 0;

    // 5. Pengguna Aktif
    const penggunaAktifResult = await db
      .select({ count: count() })
      .from(users)
      .where(eq(users.isActive, true));
    const penggunaAktif = penggunaAktifResult[0]?.count || 0;

    // Hitung Growth Rate
    const growthArsip = 12.5; // Bisa dihitung dari data historis
    const growthArsipAktif = 5.2; // Bisa dihitung dari data historis
    const growthBulanIni = arsipBulanLalu > 0 
      ? ((arsipBulanIni - arsipBulanLalu) / arsipBulanLalu) * 100 
      : 0;

    return {
      totalArsip,
      arsipAktif,
      arsipBulanIni,
      penggunaAktif,
      growthArsip,
      growthArsipAktif,
      growthBulanIni,
    };
  } catch (error) {
    console.error("Error mengambil stats dashboard:", error);
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

/**
 * Mendapatkan data arsip per bulan untuk bar chart
 */
export async function getArsipPerBulan(): Promise<ArsipPerBulan[]> {
  try {
    const currentYear = new Date().getFullYear();
    const bulanNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    
    // Query untuk mendapatkan jumlah arsip per bulan
    const result = await db
      .select({
        month: sql<number>`CAST(strftime('%m', ${arsip.createdAt}) AS INTEGER)`,
        total: count(),
      })
      .from(arsip)
      .where(sql`strftime('%Y', ${arsip.createdAt}) = ${currentYear.toString()}`)
      .groupBy(sql`strftime('%m', ${arsip.createdAt})`);

    // Buat array dengan semua bulan (set 0 jika tidak ada data)
    const dataPerBulan = bulanNames.map((name, index) => {
      const monthData = result.find(r => r.month === index + 1);
      return {
        name,
        total: monthData?.total || 0,
      };
    });

    return dataPerBulan;
  } catch (error) {
    console.error("Error mengambil data arsip per bulan:", error);
    // Return data kosong jika error
    return ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'].map(name => ({
      name,
      total: 0,
    }));
  }
}

/**
 * Mendapatkan distribusi jenis arsip untuk pie chart
 */
export async function getJenisArsipDistribution(): Promise<JenisArsipDistribution[]> {
  try {
    const result = await db
      .select({
        name: jenisArsip.nama,
        value: count(),
      })
      .from(arsip)
      .innerJoin(jenisArsip, eq(arsip.jenisArsipId, jenisArsip.id))
      .where(eq(jenisArsip.isActive, true))
      .groupBy(jenisArsip.id, jenisArsip.nama);

    // Tambahkan warna untuk setiap jenis
    const dataWithColors = result.map((item, index) => ({
      name: item.name,
      value: item.value,
      color: CHART_COLORS[index % CHART_COLORS.length],
    }));

    return dataWithColors;
  } catch (error) {
    console.error("Error mengambil distribusi jenis arsip:", error);
    return [];
  }
}

/**
 * Mendapatkan 5 arsip terbaru
 */
export async function getArsipTerbaru(): Promise<ArsipTerbaru[]> {
  try {
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

    // Format data
    const formattedData = result.map(item => ({
      id: item.id,
      judul: item.judul,
      kode: item.nomorArsip || '-',
      jenis: item.jenisNama,
      tahun: item.tahun,
      tanggal: formatTanggal(item.createdAt || ''),
    }));

    return formattedData;
  } catch (error) {
    console.error("Error mengambil arsip terbaru:", error);
    return [];
  }
}

/**
 * Helper function untuk format tanggal
 */
function formatTanggal(dateString: string): string {
  try {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return '-';
  }
}

/**
 * Mendapatkan semua data dashboard sekaligus
 */
export async function getAllDashboardData() {
  const [stats, arsipPerBulan, jenisDistribution, arsipTerbaru] = await Promise.all([
    getDashboardStats(),
    getArsipPerBulan(),
    getJenisArsipDistribution(),
    getArsipTerbaru(),
  ]);

  return {
    stats,
    arsipPerBulan,
    jenisDistribution,
    arsipTerbaru,
  };
}