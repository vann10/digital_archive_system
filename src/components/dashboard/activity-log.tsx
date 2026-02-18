// components/dashboard/activity-log.tsx

import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Activity } from "lucide-react";
import type { LogAktivitasItem } from "@/src/app/actions/dashboard";

interface ActivityLogProps {
  logs: LogAktivitasItem[];
}

// Konfigurasi tampilan per jenis aksi
const AKSI_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  INSERT_ARSIP: { label: "Input Arsip", color: "text-green-700", bg: "bg-green-100" },
  IMPORT_ARSIP: { label: "Import", color: "text-blue-700", bg: "bg-blue-100" },
  UPDATE_ARSIP: { label: "Edit Arsip", color: "text-amber-700", bg: "bg-amber-100" },
  DELETE_ARSIP: { label: "Hapus Arsip", color: "text-red-700", bg: "bg-red-100" },
  BATCH_UPDATE_COLUMN: { label: "Batch Update", color: "text-purple-700", bg: "bg-purple-100" },
  BACKUP_DB: { label: "Backup DB", color: "text-slate-700", bg: "bg-slate-100" },
};

function formatWaktu(waktu: string | null): string {
  if (!waktu) return "-";
  try {
    return new Date(waktu).toLocaleString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return waktu;
  }
}

export function ActivityLog({ logs }: ActivityLogProps) {
  if (!logs || logs.length === 0) {
    return (
      <Card className="border border-slate-200 shadow-sm">
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <Activity className="h-4 w-4 text-slate-500" />
            Log Aktivitas Terbaru
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <p className="text-xs text-slate-400 text-center py-4">Belum ada aktivitas tercatat.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-slate-200 shadow-sm">
      <CardHeader className="pb-2 pt-4 px-4">
        <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
          <Activity className="h-4 w-4 text-slate-500" />
          Log Aktivitas Terbaru
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <div className="space-y-1.5">
          {logs.map((log) => {
            const config = AKSI_CONFIG[log.aksi] || {
              label: log.aksi,
              color: "text-slate-600",
              bg: "bg-slate-100",
            };

            return (
              <div
                key={log.id}
                className="flex items-center gap-3 py-1.5 px-2 rounded-md hover:bg-slate-50 transition-colors"
              >
                {/* Indikator warna aksi */}
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium whitespace-nowrap ${config.bg} ${config.color}`}
                >
                  {config.label}
                </span>

                {/* User */}
                <span className="text-xs font-medium text-slate-700 min-w-[80px]">
                  {log.username || "Sistem"}
                </span>

                {/* Entity */}
                <span className="text-xs text-slate-500 flex-1 truncate">
                  {log.entity}
                  {log.detail && (
                    <span className="text-slate-400"> · {log.detail}</span>
                  )}
                </span>

                {/* Waktu */}
                <span className="text-[10px] text-slate-400 whitespace-nowrap">
                  {formatWaktu(log.waktu)}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
