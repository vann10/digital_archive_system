"use client";

import { useState } from "react";
import { Button } from "@/src/components/ui/button";
import { backupDatabase } from "@/src/app/actions/dashboard";
import { DatabaseBackup, Loader2, CheckCircle, AlertCircle } from "lucide-react";

export function BackupButton() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

  async function handleBackup() {
    setLoading(true);
    setStatus(null);

    try {
      const result = await backupDatabase();
      if (result.success) {
        setStatus({ type: "success", message: result.message });
      } else {
        setStatus({ type: "error", message: result.message });
      }
    } catch (err: any) {
      setStatus({ type: "error", message: err.message || "Backup gagal" });
    } finally {
      setLoading(false);
      // Auto-dismiss setelah 4 detik
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
        title="Backup database ke folder /backups"
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
