"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { Button } from "../../components/ui/button";
import { Trash2, FileText, ArrowUpDown, ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "../../lib/utils";
import { ArsipDetailDialog } from "../../components/arsip/arsip-detail-dialog";

// --- TYPES ---
interface SchemaColumn {
  nama_kolom: string;
  label_kolom: string;
  tipe_data?: string;
  width?: number; // Optional hint for default width
}

interface ArsipTableProps {
  data: any[];
  page: number;
  itemsPerPage: number;
  // dynamicSchema sekarang menjadi single source of truth untuk kolom
  dynamicSchema: SchemaColumn[]; 
  isJenisSelected: boolean;
  onDelete: (id: number) => Promise<void>;
  sortConfig?: { key: string; direction: "asc" | "desc" };
  currentParams?: {
    page: number;
    search: string;
    jenisId: string;
    tahun: string;
  };
}

// --- HELPER: Format Tanggal / Value ---
const renderCellContent = (value: any, type: string = "TEXT") => {
  if (value === null || value === undefined) return "-";

  // Cek jika tipe data DATE atau value terlihat seperti tanggal ISO string
  if (type === "DATE" || (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value))) {
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      return date.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    }
  }

  return value;
};

// --- COMPONENT: Sort Button ---
const SortButton = ({
  columnKey,
  currentSort,
  onSort,
}: {
  columnKey: string;
  currentSort?: { key: string; direction: "asc" | "desc" };
  onSort?: (key: string) => void;
}) => {
  const isActive = currentSort?.key === columnKey;
  const direction = isActive ? currentSort?.direction : null;

  return (
    <button
      onClick={() => onSort?.(columnKey)}
      className={cn(
        "ml-2 p-1 rounded hover:bg-slate-200 transition-colors inline-flex items-center",
        isActive ? "text-blue-600 bg-blue-50" : "text-slate-400 hover:text-slate-600"
      )}
      title={`Urutkan berdasarkan ${columnKey}`}
    >
      {!isActive ? (
        <ArrowUpDown className="w-3.5 h-3.5" />
      ) : direction === "asc" ? (
        <ChevronUp className="w-3.5 h-3.5 font-bold" />
      ) : (
        <ChevronDown className="w-3.5 h-3.5 font-bold" />
      )}
    </button>
  );
};

export function ArsipTable({
  data,
  page,
  itemsPerPage,
  dynamicSchema,
  isJenisSelected,
  onDelete,
  sortConfig,
  currentParams,
}: ArsipTableProps) {
  const router = useRouter();

  // --- 1. STATE RESIZING ---
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});
  const [resizing, setResizing] = useState<{
    id: string;
    startX: number;
    startWidth: number;
  } | null>(null);

  // --- 2. INITIALIZE WIDTHS (Responsive to Schema Changes) ---
  useEffect(() => {
    if (isJenisSelected && dynamicSchema.length > 0) {
      setColumnWidths((prev) => {
        const next = { ...prev };
        // Set default widths
        if (!next["no"]) next["no"] = 60;
        
        dynamicSchema.forEach((col) => {
          if (!next[col.nama_kolom]) {
            // Logika sederhana untuk menentukan lebar default
            if (col.nama_kolom === "uraian" || col.nama_kolom === "keterangan") {
              next[col.nama_kolom] = 300;
            } else if (col.nama_kolom.includes("tanggal") || col.tipe_data === "DATE") {
              next[col.nama_kolom] = 120;
            } else if (col.nama_kolom === "jumlah_berkas") {
              next[col.nama_kolom] = 100;
            } else {
              next[col.nama_kolom] = 180;
            }
          }
        });
        return next;
      });
    } else {
      setColumnWidths({}); // Reset jika tidak ada jenis dipilih (tampilan default)
    }
  }, [isJenisSelected, dynamicSchema]);

  // --- 3. RESIZING HANDLERS ---
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!resizing) return;
      const diff = e.clientX - resizing.startX;
      const newWidth = Math.max(80, resizing.startWidth + diff); // Min width 80px
      setColumnWidths((prev) => ({ ...prev, [resizing.id]: newWidth }));
    };

    const handleMouseUp = () => {
      setResizing(null);
      document.body.style.cursor = "default";
      document.body.style.userSelect = "auto";
    };

    if (resizing) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "default";
      document.body.style.userSelect = "auto";
    };
  }, [resizing]);

  const startResizing = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isJenisSelected) return; // Prevent resizing on default view if needed

    const currentWidth = columnWidths[id] || 150;
    setResizing({ id, startX: e.clientX, startWidth: currentWidth });
  };

  const getWidthStyle = (id: string) => {
    if (!isJenisSelected) return {};
    const width = columnWidths[id];
    if (!width) return {};
    return { width: `${width}px`, minWidth: `${width}px`, maxWidth: `${width}px` };
  };

  const ResizerHandle = ({ id }: { id: string }) => {
    if (!isJenisSelected) return null;
    return (
      <div
        onMouseDown={(e) => startResizing(e, id)}
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "absolute right-0 top-0 bottom-0 w-2 cursor-col-resize z-20",
          "hover:bg-blue-400 transition-colors opacity-0 hover:opacity-100",
          resizing?.id === id && "bg-blue-600 opacity-100 w-[2px]"
        )}
        title="Geser lebar kolom"
      />
    );
  };

  // --- 4. SORTING LOGIC ---
  const handleSort = (columnKey: string) => {
    const currentKey = sortConfig?.key;
    const currentDir = sortConfig?.direction;
    let newDirection: "asc" | "desc" | null = "asc";

    if (currentKey === columnKey) {
      if (currentDir === "asc") newDirection = "desc";
      else if (currentDir === "desc") newDirection = null;
    }

    const params = new URLSearchParams();
    params.set("page", "1");
    if (currentParams?.search) params.set("q", currentParams.search);
    if (currentParams?.jenisId) params.set("jenis", currentParams.jenisId);
    if (currentParams?.tahun) params.set("tahun", currentParams.tahun);

    if (newDirection !== null) {
      params.set("sortBy", columnKey);
      params.set("sortDir", newDirection);
    }
    router.push(`/arsip?${params.toString()}`);
  };

  return (
    <div className="flex-1 overflow-auto relative border rounded-md shadow-sm bg-white">
      <Table
        className={cn(
          "w-full text-sm",
          isJenisSelected
            ? "table-fixed w-max min-w-full border-separate border-spacing-0"
            : "min-w-full"
        )}
      >
        <TableHeader>
          <TableRow className="bg-slate-50 hover:bg-slate-50 border-b border-slate-200">
            
            {/* --- KOLOM NO (FIXED) --- */}
            <TableHead
              className="h-10 font-bold text-slate-700 bg-slate-50 sticky left-0 z-30 text-center border-r border-slate-200"
              style={getWidthStyle("no")}
            >
              No <ResizerHandle id="no" />
            </TableHead>

            {/* --- KOLOM DINAMIS (BERDASARKAN SCHEMA) --- */}
            {dynamicSchema.map((col) => (
              <TableHead
                key={col.nama_kolom}
                className="h-10 font-bold text-slate-700 bg-slate-50 relative border-r border-slate-200 whitespace-nowrap"
                style={getWidthStyle(col.nama_kolom)}
              >
                <div className="flex items-center justify-between px-1">
                  <span className="truncate" title={col.label_kolom}>
                    {col.label_kolom}
                  </span>
                  <SortButton
                    columnKey={col.nama_kolom}
                    currentSort={sortConfig}
                    onSort={handleSort}
                  />
                </div>
                <ResizerHandle id={col.nama_kolom} />
              </TableHead>
            ))}

            {/* --- KOLOM AKSI (FIXED) --- */}
            <TableHead className="h-10 text-right font-bold text-slate-700 bg-slate-50 sticky right-0 z-30 border-l border-slate-200 w-[100px] shadow-[inset_10px_0_10px_-10px_rgba(0,0,0,0.05)]">
              Aksi
            </TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={dynamicSchema.length + 2} // +2 untuk No dan Aksi
                className="h-64 text-center"
              >
                <div className="flex flex-col items-center justify-center gap-3">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center border border-slate-100">
                    <FileText className="h-8 w-8 text-slate-300" />
                  </div>
                  <div className="text-slate-500">
                    <p className="font-medium text-slate-900">
                      Tidak ada arsip ditemukan.
                    </p>
                    <p className="text-xs text-slate-400">
                      Sesuaikan filter atau tambahkan data baru.
                    </p>
                  </div>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            data.map((item, index) => (
              <TableRow
                key={item.id}
                className="group border-b border-slate-100 transition-colors hover:bg-blue-50/30 even:bg-slate-50/50"
              >
                {/* CELL NO */}
                <TableCell
                  className="text-center text-slate-500 font-mono text-xs sticky left-0 bg-white group-hover:bg-blue-50/30 group-even:bg-slate-50/50 z-20 border-r border-slate-100"
                  style={getWidthStyle("no")}
                >
                  {(page - 1) * itemsPerPage + index + 1}
                </TableCell>

                {/* CELLS DINAMIS */}
                {dynamicSchema.map((col) => {
                  // Ambil data langsung dari item berdasarkan nama_kolom
                  // Backend harus mengirim JSON flat: { id: 1, uraian: '...', kode_unik: '...', ... }
                  const rawValue = item[col.nama_kolom];
                  
                  return (
                    <TableCell
                      key={`${item.id}-${col.nama_kolom}`}
                      className="py-2 px-3 border-r border-slate-100 truncate text-slate-700"
                      style={getWidthStyle(col.nama_kolom)}
                    >
                      <span title={String(rawValue ?? "")}>
                        {renderCellContent(rawValue, col.tipe_data)}
                      </span>
                    </TableCell>
                  );
                })}

                {/* CELL AKSI */}
                <TableCell className="text-right py-2 sticky right-0 bg-white group-hover:bg-blue-50/30 group-even:bg-slate-50/50 z-20 border-l border-slate-100 shadow-[inset_10px_0_10px_-10px_rgba(0,0,0,0.05)]">
                  <div className="flex items-center justify-end gap-1">
                    <ArsipDetailDialog item={item} />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(item.id)}
                      className="h-8 w-8 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="sr-only">Hapus</span>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}