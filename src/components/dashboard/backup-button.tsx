"use client";

import { useState } from "react";
import { Button } from "@/src/components/ui/button";
import { DatabaseBackup, Loader2, CheckCircle, AlertCircle } from "lucide-react";

export function BackupButton() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

  async function handleBackup() {
    setLoading(true);
    setStatus(null);

    try {
      // Panggil route API untuk mendapatkan file database sebagai binary
      const response = await fetch("/api/backup-database", {
        method: "POST",
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || "Backup gagal");
      }

      // Ambil nama file dari header Content-Disposition
      const disposition = response.headers.get("Content-Disposition") || "";
      const match = disposition.match(/filename="?([^"]+)"?/);
      const fileName = match?.[1] ?? `arsip_dinsos_backup_${Date.now()}.db`;

      // Konversi response ke blob lalu trigger download
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      setStatus({ type: "success", message: `Berhasil diunduh: ${fileName}` });
    } catch (err: any) {
      setStatus({ type: "error", message: err.message || "Backup gagal" });
    } finally {
      setLoading(false);
      setTimeout(() => setStatus(null), 4000);
    }
  }

  return (
    <div className="flex items-center gap-2">
      {status && (
        <div
          className={`flex items-center gap-1 text-xs px-2 py-1 rounded-md ${
            status.type === "success"
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          {status.type === "success" ? (
            <CheckCircle className="h-3 w-3" />
          ) : (
            <AlertCircle className="h-3 w-3" />
          )}
          <span>{status.message}</span>
        </div>
      )}

      <Button
        variant="outline"
        size="sm"
        onClick={handleBackup}
        disabled={loading}
        className="h-8 text-xs gap-1.5 border-slate-300 hover:bg-amber-50 hover:border-amber-300 hover:text-amber-700 transition-colors"
        title="Unduh backup database ke komputer"
      >
        {loading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <DatabaseBackup className="h-3.5 w-3.5" />
        )}
        {loading ? "Membackup..." : "Backup DB"}
      </Button>
    </div>
  );
}