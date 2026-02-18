"use server";

import { db, sqlite } from "../../db";
import { jenisArsip, users, logAktivitas } from "../../db/schema";
import { count, sql, desc, eq } from "drizzle-orm";
import { requireAdmin, requireLogin } from "../../lib/auth-helpers";
import fs from "fs";
import path from "path";

// ================= TYPES =================

export interface DashboardStats {
  totalArsip: number;
  arsipBulanIni: number;
  penggunaAktif: number;
  totalJenisArsip: number;
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

export interface LogAktivitasItem {
  id: number;
  username: string | null;
  aksi: string;
  entity: string;
  entityId: number | null;
  detail: string | null;
  waktu: string | null;
}

// ================= CONSTANT =================

const CHART_COLORS = ["#3B82F6", "#22C55E", "#F59E0B", "#8B5CF6", "#EC4899", "#06B6D4"];

// ================= MAIN STATS =================

export async function getDashboardStats(): Promise<DashboardStats> {
  await requireLogin();

  try {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const startOfMonth = `${year}-${String(month).padStart(2, "0")}-01`;

    const jenisList = await db.select().from(jenisArsip);
    const totalJenisArsip = jenisList.length;

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
        sql.raw(
          `SELECT COUNT(*) as count FROM ${tableName} WHERE created_at >= '${startOfMonth}'`
        )
      );
      arsipBulanIni += bulanResult?.count || 0;
    }

    const penggunaAktif = (await db.select({ count: count() }).from(users))[0].count;

    return { totalArsip, arsipBulanIni, penggunaAktif, totalJenisArsip };
  } catch (err) {
    console.error(err);
    return { totalArsip: 0, arsipBulanIni: 0, penggunaAktif: 0, totalJenisArsip: 0 };
  }
}

// ================= BAR CHART =================

export async function getArsipPerBulan(): Promise<ArsipPerBulan[]> {
  await requireLogin();

  const year = new Date().getFullYear();
  const bulan = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];
  const jenisList = await db.select().from(jenisArsip);
  const monthlyTotals = new Array(12).fill(0);

  for (const jenis of jenisList) {
    const tableName = jenis.namaTabel;
    if (!/^[a-zA-Z0-9_]+$/.test(tableName)) continue;

    const result: any[] = await db.all(
      sql.raw(`
        SELECT CAST(strftime('%m', created_at) AS INTEGER) as month, COUNT(*) as total
        FROM ${tableName}
        WHERE strftime('%Y', created_at) = '${year}'
        GROUP BY month
      `)
    );
    result.forEach((r) => { monthlyTotals[r.month - 1] += r.total; });
  }

  return bulan.map((name, i) => ({ name, total: monthlyTotals[i] }));
}

// ================= PIE CHART =================

export async function getJenisArsipDistribution(): Promise<JenisArsipDistribution[]> {
  await requireLogin();

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
  await requireLogin();

  const jenisList = await db.select().from(jenisArsip);
  let allData: ArsipTerbaru[] = [];

  for (const jenis of jenisList) {
    const tableName = jenis.namaTabel;
    if (!/^[a-zA-Z0-9_]+$/.test(tableName)) continue;

    const rows: any[] = await db.all(
      sql.raw(`SELECT id, nomor_arsip, prefix, created_at FROM ${tableName} ORDER BY created_at DESC LIMIT 5`)
    );

    rows.forEach((r) => {
      allData.push({
        id: r.id,
        kode: r.prefix ? `${r.prefix}-${r.nomor_arsip}` : r.nomor_arsip,
        jenis: jenis.namaJenis,
        tanggal: r.created_at ? new Date(r.created_at).toLocaleDateString("id-ID") : "-",
      });
    });
  }

  allData.sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());
  return allData.slice(0, 5);
}

// ================= LOG AKTIVITAS =================

export async function getLogAktivitas(limit: number = 20): Promise<LogAktivitasItem[]> {
  await requireLogin();

  try {
    const logs = await db
      .select({
        id: logAktivitas.id,
        username: users.username,
        aksi: logAktivitas.aksi,
        entity: logAktivitas.entity,
        entityId: logAktivitas.entityId,
        detail: logAktivitas.detail,
        waktu: logAktivitas.waktu,
      })
      .from(logAktivitas)
      .leftJoin(users, eq(logAktivitas.userId, users.id))
      .orderBy(desc(logAktivitas.waktu))
      .limit(limit);

    return logs;
  } catch (error) {
    console.error("Error getLogAktivitas:", error);
    return [];
  }
}

// ================= ALL =================

export async function getAllDashboardData() {
  const [stats, arsipPerBulan, jenisDistribution, arsipTerbaru, logAktivitasList] =
    await Promise.all([
      getDashboardStats(),
      getArsipPerBulan(),
      getJenisArsipDistribution(),
      getArsipTerbaru(),
      getLogAktivitas(15),
    ]);

  return { stats, arsipPerBulan, jenisDistribution, arsipTerbaru, logAktivitasList };
}

// ================= BACKUP DATABASE =================

export async function backupDatabase() {
  // Hanya admin yang boleh melakukan backup
  const sessionUser = await requireAdmin();

  try {
    const dbPath = path.join(process.cwd(), "arsip_dinsos.db");
    const backupDir = path.join(process.cwd(), "backups");

    // Buat folder backups jika belum ada
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    // Nama file backup dengan timestamp
    const timestamp = new Date()
      .toISOString()
      .replace(/[:.]/g, "-")
      .replace("T", "_")
      .slice(0, 19);
    const backupFileName = `arsip_dinsos_backup_${timestamp}.db`;
    const backupPath = path.join(backupDir, backupFileName);

    // ✅ Gunakan SQLite backup API untuk backup yang safe (tidak corrupt saat ada writes)
    // better-sqlite3 mendukung .backup() yang merupakan online backup
    await sqlite.backup(backupPath);

    // Log aktivitas backup
    await db.run(
      sql`INSERT INTO log_aktivitas (user_id, aksi, entity, detail)
          VALUES (${sessionUser.id}, 'BACKUP_DB', 'database', ${backupFileName})`
    );

    // Hapus backup lama - simpan hanya 10 terakhir
    const files = fs.readdirSync(backupDir)
      .filter((f) => f.startsWith("arsip_dinsos_backup_") && f.endsWith(".db"))
      .map((f) => ({ name: f, mtime: fs.statSync(path.join(backupDir, f)).mtime }))
      .sort((a, b) => b.mtime.getTime() - a.mtime.getTime());

    if (files.length > 10) {
      files.slice(10).forEach((f) => {
        fs.unlinkSync(path.join(backupDir, f.name));
      });
    }

    return {
      success: true,
      message: `Backup berhasil: ${backupFileName}`,
      fileName: backupFileName,
    };
  } catch (error: any) {
    console.error("Backup error:", error);
    return { success: false, message: "Gagal melakukan backup: " + error.message };
  }
}
