// src/app/api/backup-database/route.ts
// Route API untuk mengirim file backup database langsung ke browser user (download)

import { NextResponse } from "next/server";
import { requireAdmin } from "@/src/lib/auth-helpers";
import { db, sqlite } from "@/src/db";
import { sql } from "drizzle-orm";
import fs from "fs";
import path from "path";
import os from "os";

export async function POST() {
  // 1. Pastikan hanya admin yang bisa akses
  let sessionUser;
  try {
    sessionUser = await requireAdmin();
  } catch {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    // 2. Buat file backup sementara di folder temp OS
    const timestamp = new Date()
      .toISOString()
      .replace(/[:.]/g, "-")
      .replace("T", "_")
      .slice(0, 19);
    const backupFileName = `arsip_dinsos_backup_${timestamp}.db`;
    const tempPath = path.join(os.tmpdir(), backupFileName);

    // 3. Backup database ke file temp (menggunakan SQLite online backup API)
    await sqlite.backup(tempPath);

    // 4. Baca file temp sebagai buffer
    const fileBuffer = fs.readFileSync(tempPath);

    // 5. Hapus file temp setelah dibaca
    fs.unlinkSync(tempPath);

    // 6. Log aktivitas backup
    await db.run(
      sql`INSERT INTO log_aktivitas (user_id, aksi, entity, detail)
          VALUES (${sessionUser.id}, 'BACKUP_DB', 'database', ${backupFileName})`
    );

    // 7. Kirim file sebagai response download ke browser
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="${backupFileName}"`,
        "Content-Length": fileBuffer.length.toString(),
      },
    });
  } catch (error: any) {
    console.error("Backup error:", error);
    return NextResponse.json(
      { message: "Gagal melakukan backup: " + error.message },
      { status: 500 }
    );
  }
}