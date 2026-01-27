"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Trash2, FileText } from "lucide-react";
import { cn } from "../../lib/utils";
import { ArsipDetailDialog } from "../../components/arsip/arsip-detail-dialog";

// ... (Helper formatDate tetap sama) ...
const formatDate = (dateValue: any) => {
  if (!dateValue) return "-";
  let dateToParse = dateValue;
  if (typeof dateValue === "string") {
    dateToParse = dateValue.trim().replace(" ", "T");
  }
  const date = new Date(dateToParse);
  if (isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

interface ArsipTableProps {
  data: any[];
  page: number;
  itemsPerPage: number;
  dynamicSchema: any[];
  isJenisSelected: boolean;
  onDelete: (id: number) => Promise<void>;
}

export function ArsipTable({
  data,
  page,
  itemsPerPage,
  dynamicSchema,
  isJenisSelected,
  onDelete,
}: ArsipTableProps) {
  
  // --- 1. FILTER SCHEMA ---
  // Kita buang kolom yang sudah ada hardcoded-nya (Judul, Nomor, Tahun)
  // Agar tidak muncul ganda di bagian dynamic
  const filteredSchema = dynamicSchema.filter(col => 
    !['judul', 'nomorArsip', 'tahun'].includes(col.id)
  );

  // --- STATE RESIZING ---
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});
  const [resizing, setResizing] = useState<{
    id: string;
    startX: number;
    startWidth: number;
  } | null>(null);

  // Inisialisasi lebar default saat filter aktif
  useEffect(() => {
    if (isJenisSelected) {
      setColumnWidths((prev) => {
        const next = { ...prev };
        // Definisi lebar awal yang pas
        if (!next["no"]) next["no"] = 60;
        if (!next["judul"]) next["judul"] = 300;
        if (!next["nomor"]) next["nomor"] = 180;
        if (!next["tgl"]) next["tgl"] = 120;
        if (!next["tahun"]) next["tahun"] = 80;
        if (!next["jenis"]) next["jenis"] = 150;

        // Gunakan filteredSchema di sini
        filteredSchema.forEach((col) => {
          if (!next[col.id]) next[col.id] = 220;
        });
        return next;
      });
    } else {
      setColumnWidths({});
    }
  }, [isJenisSelected, dynamicSchema]); // Dependensi tetap dynamicSchema agar reaktif

  // ... (Bagian EVENT LISTENER MOUSE & startResizing tetap sama) ...
  // ... (Pastikan gunakan filteredSchema jika ada logic looping schema di resize) ...
  
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!resizing) return;
      const diff = e.clientX - resizing.startX;
      const newWidth = Math.max(50, resizing.startWidth + diff); 
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
    if (!isJenisSelected) return;

    setColumnWidths((prev) => {
      let currentWidth = prev[id];
      if (!currentWidth) {
        if (id === "no") currentWidth = 60;
        else if (id === "judul") currentWidth = 300;
        else if (id === "nomor") currentWidth = 180;
        else if (id === "tgl") currentWidth = 120;
        else if (id === "tahun") currentWidth = 80;
        else if (id === "jenis") currentWidth = 150;
        else currentWidth = 220;
      }
      
      setResizing({ id, startX: e.clientX, startWidth: currentWidth });
      return prev;
    });
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
          "absolute right-0 top-0 bottom-0 w-2 cursor-col-resize z-50",
          "hover:bg-blue-400 transition-colors opacity-0 hover:opacity-100",
          resizing?.id === id && "bg-blue-600 opacity-100 w-[2px]"
        )}
        title="Geser lebar kolom"
      />
    );
  };

  // --- LOGIKA GROUPING DINAMIS (Gunakan filteredSchema) ---
  const dynamicGroups = filteredSchema.reduce((acc: { name: string; count: number }[], col) => {
    const groupName = col.group || col.kelompok || "Data Spesifik";
    const lastGroup = acc[acc.length - 1];

    if (lastGroup && lastGroup.name === groupName) {
      lastGroup.count += 1;
    } else {
      acc.push({ name: groupName, count: 1 });
    }
    return acc;
  }, []);

  return (
    <div className="bg-white flex-1 min-h-0 -mb-6.5 relative overflow-auto">
      <Table
        className={cn(
          "w-full",
          isJenisSelected ? "table-fixed w-max min-w-full border-separate border-spacing-0" : "min-w-full"
        )}
      >
        <TableHeader className={cn("sticky z-20 shadow-sm bg-slate-50", isJenisSelected ? "top-0" : "top-0")}>
          
          {/* --- HEADER GRUP DINAMIS --- */}
          {isJenisSelected && (
            <TableRow className="border-b border-slate-200 bg-slate-100/80 hover:bg-slate-100/80 h-8">
              {/* Grup Data Utama */}
              <TableHead 
                colSpan={6} 
                className="text-center font-bold text-slate-600 border-r border-slate-300/50 h-8 text-[10px] uppercase tracking-wider bg-slate-100/80 left-0 z-40 shadow-[1px_0_0_0_rgba(0,0,0,0.05)]"
              >
                Data Utama Arsip
              </TableHead>

              {/* Grup Data Spesifik (Looping filteredSchema / dynamicGroups yang sudah difilter) */}
              {dynamicGroups.map((group, idx) => (
                <TableHead 
                  key={idx}
                  colSpan={group.count} 
                  className="text-center font-bold text-blue-700 border-r border-blue-200/50 h-8 text-[10px] uppercase tracking-wider bg-blue-50/80 whitespace-nowrap overflow-hidden text-ellipsis px-2"
                  title={group.name}
                >
                  {group.name}
                </TableHead>
              ))}

              <TableHead className="bg-white sticky right-0 z-40 border-l border-slate-200 h-8" />
            </TableRow>
          )}

          {/* --- HEADER KOLOM --- */}
          <TableRow className={cn("border-b border-slate-200 hover:bg-slate-50", isJenisSelected && "sticky top-8")}>
            {/* ... (Kolom Hardcoded: No, Judul, Nomor, Tgl, Tahun, Jenis TETAP SAMA) ... */}
            <TableHead
              className="font-bold text-slate-700 h-11 bg-slate-50 sticky left-0 z-30 text-center border-r border-slate-100"
              style={getWidthStyle("no")}
            >
              No <ResizerHandle id="no" />
            </TableHead>
            <TableHead className="font-bold text-slate-700 h-11 bg-slate-50 relative border-r border-slate-100" style={getWidthStyle("judul")}>
              Judul Arsip <ResizerHandle id="judul" />
            </TableHead>
            <TableHead className="font-bold text-slate-700 h-11 bg-slate-50 relative border-r border-slate-100" style={getWidthStyle("nomor")}>
              Nomor Arsip <ResizerHandle id="nomor" />
            </TableHead>
            <TableHead className="font-bold text-slate-700 h-11 bg-slate-50 relative border-r border-slate-100" style={getWidthStyle("tgl")}>
              Tgl Input <ResizerHandle id="tgl" />
            </TableHead>
            <TableHead className="font-bold text-slate-700 h-11 bg-slate-50 text-center relative border-r border-slate-100" style={getWidthStyle("tahun")}>
              Tahun <ResizerHandle id="tahun" />
            </TableHead>
            <TableHead className="font-bold text-slate-700 h-11 bg-slate-50 relative border-r border-slate-100" style={getWidthStyle("jenis")}>
              Jenis <ResizerHandle id="jenis" />
            </TableHead>

            {/* KOLOM DINAMIS (Gunakan filteredSchema) */}
            {filteredSchema.map((col: any) => (
              <TableHead
                key={col.id}
                className="font-bold text-blue-700 bg-blue-50/80 h-11 whitespace-nowrap border-r border-blue-100 relative"
                style={getWidthStyle(col.id)}
              >
                {col.label}
                <ResizerHandle id={col.id} />
              </TableHead>
            ))}

            {/* AKSI */}
            <TableHead className="text-right font-bold text-slate-700 h-11 pr-6 bg-slate-50 sticky right-0 z-30 shadow-[inset_10px_0_10px_-10px_rgba(0,0,0,0.05)] w-[100px] border-l border-slate-100">
              Aksi
            </TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8 + filteredSchema.length} className="h-64 text-center">
                 {/* ... (Empty state content) ... */}
                 <div className="flex flex-col items-center justify-center gap-3">
                   <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center border border-slate-100">
                     <FileText className="h-8 w-8 text-slate-300" />
                   </div>
                   <div className="text-slate-500">
                     <p className="font-medium text-slate-900">Tidak ada arsip ditemukan.</p>
                     <p className="text-sm text-slate-400">Coba sesuaikan filter pencarian Anda.</p>
                   </div>
                 </div>
              </TableCell>
            </TableRow>
          ) : (
            data.map((item, index) => {
              let customData = {};
              try {
                customData = typeof item.dataCustom === "string" ? JSON.parse(item.dataCustom) : item.dataCustom || {};
              } catch (e) { console.error(e); }

              return (
                <TableRow key={item.id} className="group border-b border-slate-100 transition-colors hover:bg-blue-50/50 even:bg-slate-100">
                  {/* ... (Kolom Hardcoded TETAP SAMA) ... */}
                  <TableCell className="text-center text-slate-500 font-mono text-xs sticky left-0 bg-white group-hover:bg-blue-50 group-even:bg-slate-100 z-10 border-r border-slate-100/50" style={getWidthStyle("no")}>
                    {(page - 1) * itemsPerPage + index + 1}
                  </TableCell>
                  <TableCell className="py-3 truncate border-r border-slate-100/50" style={getWidthStyle("judul")}>
                    <div className="font-semibold text-slate-800 text-sm group-hover:text-blue-700 transition-colors truncate" title={item.judul}>
                      {item.judul}
                    </div>
                  </TableCell>
                  <TableCell className="border-r border-slate-100/50 truncate" style={getWidthStyle("nomor")}>
                    <div className="font-mono text-xs text-slate-600 bg-white px-2 py-1 rounded w-fit border border-slate-200 shadow-sm truncate" title={item.nomor}>
                      {item.nomor || "-"}
                    </div>
                  </TableCell>
                  <TableCell className="border-r border-slate-100/50 truncate" style={getWidthStyle("tgl")}>
                    <div className="text-xs text-slate-500 font-medium truncate">{formatDate(item.createdAt)}</div>
                  </TableCell>
                  <TableCell className="text-center border-r border-slate-100/50" style={getWidthStyle("tahun")}>
                    <div className="text-sm font-bold text-slate-600">{item.tahun}</div>
                  </TableCell>
                  <TableCell className="border-r border-slate-100/50" style={getWidthStyle("jenis")}>
                    <Badge variant="outline" className={cn("font-medium border-0 px-2.5 py-0.5 rounded-md text-xs truncate max-w-full", item.jenisNama === "Surat Masuk" ? "bg-emerald-100 text-emerald-700" : item.jenisNama === "Surat Keluar" ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700")}>
                      {item.jenisNama}
                    </Badge>
                  </TableCell>

                  {/* Cell Dinamis (Gunakan filteredSchema) */}
                  {filteredSchema.map((col: any) => (
                    <TableCell
                      key={col.id}
                      className="text-slate-600 text-sm border-r border-slate-100/50 truncate overflow-hidden"
                      style={getWidthStyle(col.id)}
                    >
                      <span className="truncate block" title={(customData as any)?.[col.id]}>
                        {(customData as any)?.[col.id] || "-"}
                      </span>
                    </TableCell>
                  ))}

                  {/* Aksi */}
                  <TableCell className="text-right pr-4 sticky right-0 bg-white group-even:bg-slate-100 group-hover:bg-blue-50 shadow-[inset_10px_0_10px_-10px_rgba(0,0,0,0.05)] transition-colors z-10 border-l border-slate-100/50">
                    <div className="flex items-center justify-end gap-1">
                      <ArsipDetailDialog item={item} />
                      <Button variant="ghost" size="sm" onClick={() => onDelete(item.id)} className="h-8 w-8 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full">
                        <Trash2 className="w-4 h-4" />
                        <span className="sr-only">Hapus</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}