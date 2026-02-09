"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import {
  Plus,
  Save,
  Trash2,
  Loader2,
  AlertCircle,
  FileSpreadsheet,
} from "lucide-react";
import { saveBulkArsip } from "../../app/actions/input-arsip";

// --- TYPE DEFINITIONS ---
// Disesuaikan dengan tabel 'schema_config' di DB
type SchemaConfig = {
  id: number;
  jenisId: number;
  namaKolom: string;   // Key untuk database
  labelKolom: string;  // Label untuk UI
  tipeData: string;    // TEXT, INTEGER, dll
  isRequired: boolean;
  isVisibleList: boolean;
  defaultValue: string | null;
  urutan: number | null;
};

type JenisArsipWithSchema = {
  id: number;
  namaJenis: string;
  namaTabel: string;
  prefixKode: string;
  schemaConfig: SchemaConfig[]; // Array langsung, bukan JSON string
};

type Props = {
  jenisArsipList: JenisArsipWithSchema[];
};

// Default widths
const DEFAULT_WIDTHS: Record<string, number> = {};
const DEFAULT_DYNAMIC_WIDTH = 200;

export function SpreadsheetInput({ jenisArsipList }: Props) {
  const router = useRouter();

  // --- STATE ---
  const [selectedJenisId, setSelectedJenisId] = useState<string>("");
  const [schema, setSchema] = useState<SchemaConfig[]>([]);
  const [rows, setRows] = useState<any[]>([{}]);
  const [isSaving, setIsSaving] = useState(false);
  const [addCount, setAddCount] = useState<number>(1);
  const userId = 5;

  // --- STATE RESIZE ---
  const [colWidths, setColWidths] = useState<Record<string, number>>(DEFAULT_WIDTHS);

  // Ref untuk drag logic
  const dragRef = useRef<{
    activeColId: string | null;
    startX: number;
    startWidth: number;
  }>({ activeColId: null, startX: 0, startWidth: 0 });

  // --- EFFECT: Load Schema ---
  useEffect(() => {
    if (!selectedJenisId) {
      setSchema([]);
      setRows([{}]);
      return;
    }

    const jenis = jenisArsipList.find(
      (j) => j.id.toString() === selectedJenisId,
    );

    if (jenis && jenis.schemaConfig) {
      // Data sudah berupa array object dari DB, tidak perlu JSON.parse
      setSchema(jenis.schemaConfig);

      // Reset Widths menggunakan ID unik kolom
      const newWidths: Record<string, number> = {};
      jenis.schemaConfig.forEach((col) => {
        newWidths[col.id.toString()] = DEFAULT_DYNAMIC_WIDTH;
      });
      setColWidths(newWidths);
    } else {
      setSchema([]);
    }

    setRows([{}]);
  }, [selectedJenisId, jenisArsipList]);

  // --- LOGIC RESIZING (MOUSE EVENTS) ---
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragRef.current.activeColId) return;
    e.preventDefault();
    const deltaX = e.clientX - dragRef.current.startX;
    const newWidth = Math.max(80, dragRef.current.startWidth + deltaX);
    setColWidths((prev) => ({
      ...prev,
      [dragRef.current.activeColId!]: newWidth,
    }));
  }, []);

  const handleMouseUp = useCallback(() => {
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
    dragRef.current.activeColId = null;
    document.body.style.cursor = "default";
  }, [handleMouseMove]);

  const startResize = (e: React.MouseEvent, colId: string) => {
    e.preventDefault();
    e.stopPropagation();
    dragRef.current = {
      activeColId: colId,
      startX: e.clientX,
      startWidth: colWidths[colId] || 150,
    };
    document.body.style.cursor = "col-resize";
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const Resizer = ({ colId }: { colId: string }) => (
    <div
      className="absolute top-0 right-0 bottom-0 w-4 cursor-col-resize z-20 flex justify-center -mr-2 group/resizer"
      onMouseDown={(e) => startResize(e, colId)}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="w-[2px] h-full bg-blue-300 opacity-0 group-hover/resizer:opacity-100 transition-opacity" />
    </div>
  );

  // --- HANDLERS DATA ---
  const addMultipleRows = () => {
    const count = addCount > 0 ? addCount : 1;
    const newRows = Array(count).fill({});
    setRows((prev) => [...prev, ...newRows]);
  };

  const removeRow = (index: number) => {
    if (rows.length <= 1) return;
    const newRows = [...rows];
    newRows.splice(index, 1);
    setRows(newRows);
  };

  const handleInputChange = (index: number, field: string, value: string) => {
    const newRows = [...rows];
    newRows[index] = { ...newRows[index], [field]: value };
    setRows(newRows);
  };

  const handleSave = async () => {
    // Validasi minimal 1 kolom terisi untuk baris pertama
    if (!selectedJenisId || Object.keys(rows[0]).length === 0) {
      alert("Mohon lengkapi data.");
      return;
    }
    

    setIsSaving(true);
    try {
      const result = await saveBulkArsip(
        rows,
        parseInt(selectedJenisId),
        userId
      );
      if (result.success) {
        alert(`Sukses! ${rows.length} data tersimpan.`);
        setRows([{}]);
        router.refresh();
      }
    } catch (e: any) {
      console.error(e);
      alert("Gagal menyimpan: " + e.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* HEADER CONTROLLER */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-end gap-5">
        <div className="w-full md:w-72 space-y-2">
          <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-blue-600" />
            Pilih Jenis Arsip
          </label>
          <Select onValueChange={setSelectedJenisId}>
            <SelectTrigger className="h-10 border-slate-300 focus:ring-blue-500">
              <SelectValue placeholder="-- Pilih Kategori --" />
            </SelectTrigger>
            <SelectContent>
              {jenisArsipList.map((item) => (
                <SelectItem key={item.id} value={item.id.toString()}>
                  {item.namaJenis} ({item.prefixKode})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {selectedJenisId ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-md overflow-hidden flex flex-col">
          <div className="overflow-x-auto relative">
            <Table
              className="min-w-full table-fixed border-collapse"
              style={{ width: "max-content" }}
            >
              <TableHeader>
                {/* BARIS 1: GROUP HEADER (OPSIONAL - DISEDERHANAKAN) */}
                <TableRow className="bg-slate-50 border-b border-slate-200">
                  <TableHead
                    rowSpan={2}
                    className="w-[50px] text-center border-r font-medium text-slate-600 bg-slate-100"
                  >
                    No
                  </TableHead>
                  <TableHead 
                    colSpan={schema.length} 
                    className="text-center font-semibold text-slate-700 bg-slate-100 border-b border-slate-200 py-2"
                  >
                    Input Data Arsip
                  </TableHead>
                </TableRow>

                {/* BARIS 2: LABEL KOLOM DINAMIS */}
                <TableRow className="bg-white border-b border-slate-200 shadow-sm">
                  {schema.map((col) => (
                    <TableHead
                      key={col.id}
                      className="relative text-slate-600 font-medium border-r border-slate-100 bg-slate-50/30 align-middle px-2 select-none"
                      style={{
                        width: colWidths[col.id.toString()],
                        minWidth: colWidths[col.id.toString()],
                        maxWidth: colWidths[col.id.toString()],
                      }}
                    >
                      <div className="truncate w-full" title={col.labelKolom}>
                        {col.labelKolom}
                      </div>
                      {col.isRequired && (
                        <span className="text-red-400 ml-0.5 absolute top-1 right-2 text-[10px]">
                          *
                        </span>
                      )}
                      <Resizer colId={col.id.toString()} />
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>

              <TableBody>
                {rows.map((row, index) => (
                  <TableRow
                    key={index}
                    className="group hover:bg-slate-50 transition-colors"
                  >
                    <TableCell className="text-center text-slate-400 font-mono text-xs border-r border-slate-100 bg-slate-50/30">
                      {index + 1}
                    </TableCell>

                    {schema.map((col) => (
                      <TableCell
                        key={col.id}
                        className="p-1 border-r border-slate-100 overflow-hidden"
                      >
                        <Input
                          type={
                            col.tipeData === "DATE"
                              ? "date"
                              : col.tipeData === "INTEGER"
                                ? "number"
                                : "text"
                          }
                          className="border-transparent shadow-none focus-visible:ring-1 focus-visible:ring-blue-500 h-9 rounded-sm bg-transparent text-slate-700 w-full"
                          // Gunakan 'namaKolom' sebagai key data
                          value={row[col.namaKolom] || ""}
                          onChange={(e) =>
                            handleInputChange(index, col.namaKolom, e.target.value)
                          }
                          required={col.isRequired}
                        />
                      </TableCell>
                    ))}

                    <TableCell className="text-center p-0 w-[50px]">
                      <div className="flex justify-center opacity-100 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => removeRow(index)}
                          className="p-2 text-red-500 bg-slate-100 hover:text-white hover:bg-red-500 rounded-md"
                          disabled={rows.length <= 1}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* FOOTER */}
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-xs text-slate-500">
              Total: {rows.length} baris data akan disimpan.
            </div>

            <div className="flex gap-3 w-full md:w-auto items-center">
              <div className="flex items-center gap-2 bg-white p-1 rounded-md border border-slate-200">
                <Input
                  type="number"
                  min={1}
                  max={100}
                  className="w-16 h-8 text-center border-none focus-visible:ring-0 px-1"
                  value={addCount}
                  onChange={(e) => setAddCount(parseInt(e.target.value) || 1)}
                />
                <Button
                  variant="secondary"
                  onClick={addMultipleRows}
                  className="h-8 px-3 text-xs gap-1 border-l rounded-l-none"
                >
                  <Plus size={14} /> Tambah
                </Button>
              </div>

              <div className="w-px h-8 bg-slate-300 mx-1 hidden md:block"></div>

              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1 md:flex-none gap-2 min-w-[140px] bg-blue-600"
              >
                {isSaving ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : (
                  <Save size={16} />
                )}
                Simpan Semua
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {!selectedJenisId && (
        <div className="h-[400px] border-2 border-dashed border-slate-300 rounded-xl bg-slate-50/50 flex flex-col items-center justify-center text-slate-400 gap-4">
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm">
            <AlertCircle className="w-10 h-10 text-slate-300" />
          </div>
          <p>
            Pilih <strong>Jenis Arsip</strong> di atas untuk memulai input data.
          </p>
        </div>
      )}
    </div>
  );
}