"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Checkbox } from "@/src/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { Save, Trash2, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import {
  saveBatchEdit,
  deleteBatchRows,
  batchUpdateColumn as batchUpdateColumnAction,
} from "@/src/app/actions/batch-edit-arsip";
import { useToast } from "@/src/hooks/use-toast";

type SchemaConfig = {
  id: number;
  jenisId: number;
  namaKolom: string;
  labelKolom: string;
  tipeData: string | null;
  isVisibleList: boolean | null;
  urutan: number | null;
};

type Jenis = {
  id: number;
  namaJenis: string;
  namaTabel: string;
  prefixKode: string;
};

type Props = {
  jenisId: number;
  jenis: Jenis;
  schema: SchemaConfig[];
  initialData: any[];
};

const DEFAULT_DYNAMIC_WIDTH = 180;

export function BatchEditTable({ jenisId, jenis, schema, initialData }: Props) {
  const router = useRouter();
  const { toast } = useToast();

  const [rows, setRows] = useState<any[]>(initialData);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [colWidths, setColWidths] = useState<Record<string, number>>({});

  // State untuk batch update column
  const [showBatchUpdate, setShowBatchUpdate] = useState(false);
  const [batchUpdateColumn, setBatchUpdateColumn] = useState<string>("");
  const [batchUpdateValue, setBatchUpdateValue] = useState<string>("");
  const [isUpdatingColumn, setIsUpdatingColumn] = useState(false);

  const userId = 5; // Adjust according to your auth system

  // Refs for resizing
  const dragRef = useRef<{
    activeColId: string | null;
    startX: number;
    startWidth: number;
  }>({ activeColId: null, startX: 0, startWidth: 0 });

  // Initialize column widths
  useEffect(() => {
    const newWidths: Record<string, number> = {};
    newWidths["select"] = 50;
    newWidths["prefix"] = 120;
    newWidths["nomor_arsip"] = 120;

    schema.forEach((col) => {
      if (col.namaKolom === "uraian" || col.namaKolom === "keterangan") {
        newWidths[col.id.toString()] = 300;
      } else {
        newWidths[col.id.toString()] = DEFAULT_DYNAMIC_WIDTH;
      }
    });

    setColWidths(newWidths);
  }, [schema]);

  // --- RESIZE LOGIC ---
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

  // --- HANDLERS ---
  const handleInputChange = (index: number, field: string, value: string) => {
    const newRows = [...rows];
    newRows[index] = { ...newRows[index], [field]: value };
    setRows(newRows);
  };

  const toggleRowSelection = (id: number) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedRows(newSelected);
  };

  const toggleAllRows = () => {
    if (selectedRows.size === rows.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(rows.map((r) => r.id)));
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const result = await saveBatchEdit(jenisId, rows, userId);

      if (result.success) {
        toast({
          variant: "success",
          title: "Berhasil!",
          description: "Data berhasil disimpan.",
        });
        router.refresh();
      } else {
        toast({
          variant: "destructive",
          title: "Gagal",
          description: result.message || "Gagal menyimpan data.",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Terjadi kesalahan saat menyimpan data.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedRows.size === 0) {
      toast({
        variant: "destructive",
        title: "Tidak ada data yang dipilih",
        description: "Pilih data yang ingin dihapus terlebih dahulu.",
      });
      return;
    }

    if (!confirm(`Hapus ${selectedRows.size} data yang dipilih?`)) {
      return;
    }

    setIsDeleting(true);
    try {
      const result = await deleteBatchRows(
        jenisId,
        Array.from(selectedRows),
        userId,
      );

      if (result.success) {
        toast({
          variant: "success",
          title: "Berhasil!",
          description: `${selectedRows.size} data berhasil dihapus.`,
        });

        // Remove deleted rows from state
        setRows(rows.filter((r) => !selectedRows.has(r.id)));
        setSelectedRows(new Set());
      } else {
        toast({
          variant: "destructive",
          title: "Gagal",
          description: result.message || "Gagal menghapus data.",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Terjadi kesalahan saat menghapus data.",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBatchUpdateColumn = async () => {
    if (selectedRows.size === 0) {
      toast({
        variant: "destructive",
        title: "Tidak ada data yang dipilih",
        description: "Pilih data yang ingin diupdate terlebih dahulu.",
      });
      return;
    }

    if (!batchUpdateColumn) {
      toast({
        variant: "destructive",
        title: "Kolom belum dipilih",
        description: "Pilih kolom yang ingin diupdate.",
      });
      return;
    }

    setIsUpdatingColumn(true);
    try {
      const result = await batchUpdateColumnAction(
        jenisId,
        Array.from(selectedRows),
        batchUpdateColumn,
        batchUpdateValue,
        userId,
      );

      if (result.success) {
        toast({
          variant: "success",
          title: "Berhasil!",
          description: `${selectedRows.size} data berhasil diupdate.`,
        });

        // Update rows state dengan nilai baru
        setRows(
          rows.map((row) => {
            if (selectedRows.has(row.id)) {
              return { ...row, [batchUpdateColumn]: batchUpdateValue };
            }
            return row;
          }),
        );

        // Reset batch update form
        setBatchUpdateColumn("");
        setBatchUpdateValue("");
        setShowBatchUpdate(false);

        router.refresh();
      } else {
        toast({
          variant: "destructive",
          title: "Gagal",
          description: result.message || "Gagal update kolom.",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Terjadi kesalahan saat update kolom.",
      });
    } finally {
      setIsUpdatingColumn(false);
    }
  };

  // --- KEYBOARD SHORTCUTS ---
  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    rowIndex: number,
    colKey: string,
  ) => {
    const allCols = [
      "prefix",
      "nomor_arsip",
      ...schema.map((s) => s.namaKolom),
    ];
    const currentColIndex = allCols.indexOf(colKey);

    // Enter: move to next row, same column
    if (e.key === "Enter") {
      e.preventDefault();
      if (rowIndex < rows.length - 1) {
        const nextInput = document.querySelector(
          `input[data-row="${rowIndex + 1}"][data-col="${colKey}"]`,
        ) as HTMLInputElement;
        nextInput?.focus();
      }
    }

    // Arrow Down: same as Enter
    else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (rowIndex < rows.length - 1) {
        const nextInput = document.querySelector(
          `input[data-row="${rowIndex + 1}"][data-col="${colKey}"]`,
        ) as HTMLInputElement;
        nextInput?.focus();
      }
    }

    // Arrow Up: move to previous row
    else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (rowIndex > 0) {
        const prevInput = document.querySelector(
          `input[data-row="${rowIndex - 1}"][data-col="${colKey}"]`,
        ) as HTMLInputElement;
        prevInput?.focus();
      }
    }

    // Arrow Right: move to next column
    else if (e.key === "ArrowRight") {
      const input = e.currentTarget;
      if (input.selectionStart === input.value.length) {
        e.preventDefault();
        if (currentColIndex < allCols.length - 1) {
          const nextCol = allCols[currentColIndex + 1];
          const nextInput = document.querySelector(
            `input[data-row="${rowIndex}"][data-col="${nextCol}"]`,
          ) as HTMLInputElement;
          nextInput?.focus();
        }
      }
    }

    // Arrow Left: move to previous column
    else if (e.key === "ArrowLeft") {
      const input = e.currentTarget;
      if (input.selectionStart === 0) {
        e.preventDefault();
        if (currentColIndex > 0) {
          const prevCol = allCols[currentColIndex - 1];
          const prevInput = document.querySelector(
            `input[data-row="${rowIndex}"][data-col="${prevCol}"]`,
          ) as HTMLInputElement;
          prevInput?.focus();
        }
      }
    }

    // Tab: move to next column
    else if (e.key === "Tab" && !e.shiftKey) {
      e.preventDefault();
      if (currentColIndex < allCols.length - 1) {
        const nextCol = allCols[currentColIndex + 1];
        const nextInput = document.querySelector(
          `input[data-row="${rowIndex}"][data-col="${nextCol}"]`,
        ) as HTMLInputElement;
        nextInput?.focus();
      } else if (rowIndex < rows.length - 1) {
        const nextInput = document.querySelector(
          `input[data-row="${rowIndex + 1}"][data-col="${allCols[0]}"]`,
        ) as HTMLInputElement;
        nextInput?.focus();
      }
    }

    // Shift+Tab: move to previous column
    else if (e.key === "Tab" && e.shiftKey) {
      e.preventDefault();
      if (currentColIndex > 0) {
        const prevCol = allCols[currentColIndex - 1];
        const prevInput = document.querySelector(
          `input[data-row="${rowIndex}"][data-col="${prevCol}"]`,
        ) as HTMLInputElement;
        prevInput?.focus();
      } else if (rowIndex > 0) {
        const prevInput = document.querySelector(
          `input[data-row="${rowIndex - 1}"][data-col="${allCols[allCols.length - 1]}"]`,
        ) as HTMLInputElement;
        prevInput?.focus();
      }
    }
  };

  if (rows.length === 0) {
    return (
      <div className="h-[400px] border-2 border-dashed border-slate-300 rounded-xl bg-slate-50/50 flex flex-col items-center justify-center text-slate-400 gap-4">
        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm">
          <AlertCircle className="w-10 h-10 text-slate-300" />
        </div>
        <p>Tidak ada data untuk di-edit.</p>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="border-b border-blue-100">
        <div className="flex flex-col gap-4">
          {/* Header Row 1: Title and Main Actions */}
          <div className="flex items-center justify-between">
            <CardTitle className="text-slate-900 flex items-center gap-2">
              <span className="text-lg">Edit {rows.length} Data</span>
              {selectedRows.size > 0 && (
                <span className="text-sm font-normal text-blue-600">
                  ({selectedRows.size} dipilih)
                </span>
              )}
            </CardTitle>

            <div className="flex gap-2">
              {selectedRows.size > 0 && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => setShowBatchUpdate(!showBatchUpdate)}
                    className="gap-2 border-green-300 text-green-700 hover:bg-green-50"
                  >
                    <RefreshCw size={16} />
                    Batch Update
                  </Button>

                  <Button
                    variant="destructive"
                    onClick={handleDeleteSelected}
                    disabled={isDeleting}
                    className="gap-2"
                  >
                    {isDeleting ? (
                      <Loader2 className="animate-spin" size={16} />
                    ) : (
                      <Trash2 size={16} />
                    )}
                    Hapus {selectedRows.size}
                  </Button>
                </>
              )}

              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="gap-2 bg-blue-600"
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

          {/* Header Row 2: Batch Update Form (conditional) */}
          {showBatchUpdate && selectedRows.size > 0 && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-end gap-3">
                <div className="flex-1">
                  <label className="text-xs font-medium text-slate-600 mb-1 block">
                    Pilih Kolom
                  </label>
                  <Select
                    value={batchUpdateColumn}
                    onValueChange={setBatchUpdateColumn}
                  >
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Pilih kolom..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="prefix">Kode Arsip</SelectItem>
                      <SelectItem value="nomor_arsip">Nomor Arsip</SelectItem>
                      {schema.map((col) => (
                        <SelectItem key={col.id} value={col.namaKolom}>
                          {col.labelKolom}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex-1">
                  <label className="text-xs font-medium text-slate-600 mb-1 block">
                    Nilai Baru
                  </label>
                  <Input
                    type={
                      schema.find((s) => s.namaKolom === batchUpdateColumn)
                        ?.tipeData === "DATE"
                        ? "date"
                        : schema.find((s) => s.namaKolom === batchUpdateColumn)
                              ?.tipeData === "INTEGER"
                          ? "number"
                          : "text"
                    }
                    value={batchUpdateValue}
                    onChange={(e) => setBatchUpdateValue(e.target.value)}
                    placeholder="Masukkan nilai..."
                    className="bg-white"
                  />
                </div>

                <Button
                  onClick={handleBatchUpdateColumn}
                  disabled={isUpdatingColumn || !batchUpdateColumn}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isUpdatingColumn ? (
                    <>
                      <Loader2 className="animate-spin mr-2" size={16} />
                      Updating...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2" size={16} />
                      Update {selectedRows.size} Data
                    </>
                  )}
                </Button>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                💡 Kolom yang dipilih akan diisi dengan nilai yang sama untuk
                semua {selectedRows.size} data yang diceklis
              </p>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="overflow-auto max-h-[600px]">
          <Table
            className="min-w-full table-fixed border-collapse"
            style={{ width: "max-content" }}
          >
            <TableHeader className="sticky top-0 z-10">
              <TableRow className="bg-slate-50 border-b border-slate-200">
                {/* Checkbox column */}
                <TableHead
                  className="w-12 text-center border-r font-medium text-slate-600 bg-slate-100 sticky left-0 z-30"
                  style={{
                    width: colWidths["select"],
                    minWidth: colWidths["select"],
                    maxWidth: colWidths["select"],
                  }}
                >
                  <div className="flex items-center justify-center">
                    <Checkbox
                      checked={
                        selectedRows.size === rows.length && rows.length > 0
                      }
                      onCheckedChange={toggleAllRows}
                    />
                  </div>
                </TableHead>

                {/* Prefix */}
                <TableHead
                  className="text-center font-semibold text-slate-700 bg-slate-50 border-r border-slate-200 py-2 relative"
                  style={{
                    width: colWidths["prefix"],
                    minWidth: colWidths["prefix"],
                    maxWidth: colWidths["prefix"],
                  }}
                >
                  <div className="flex items-center justify-center">
                    Kode Arsip
                  </div>
                  <Resizer colId="prefix" />
                </TableHead>

                {/* Nomor Arsip */}
                <TableHead
                  className="text-center font-semibold text-slate-700 bg-slate-50 border-r border-slate-200 py-2 relative"
                  style={{
                    width: colWidths["nomor_arsip"],
                    minWidth: colWidths["nomor_arsip"],
                    maxWidth: colWidths["nomor_arsip"],
                  }}
                >
                  <div className="flex flex-col items-center gap-1">
                    <span>Nomor Arsip</span>
                  </div>
                  <Resizer colId="nomor_arsip" />
                </TableHead>

                {/* Dynamic columns */}
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
                    <Resizer colId={col.id.toString()} />
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>

            <TableBody>
              {rows.map((row, index) => (
                <TableRow
                  key={row.id}
                  className="group hover:bg-slate-50 transition-colors"
                >
                  {/* Checkbox */}
                  <TableCell className="text-center border-r bg-slate-50 sticky left-0 z-20">
                    <div className="flex items-center justify-center">
                      <Checkbox
                        checked={selectedRows.has(row.id)}
                        onCheckedChange={() => toggleRowSelection(row.id)}
                      />
                    </div>
                  </TableCell>

                  {/* Prefix */}
                  <TableCell className="p-1 border-r border-green-100 bg-slate-50">
                    <Input
                      type="text"
                      data-row={index}
                      data-col="prefix"
                      className="border-transparent shadow-none focus-visible:ring-1 focus-visible:ring-green-500 h-9 rounded-sm bg-transparent text-slate-700 w-full font-mono uppercase text-center font-semibold"
                      value={row["prefix"] || ""}
                      onChange={(e) =>
                        handleInputChange(
                          index,
                          "prefix",
                          e.target.value.toUpperCase(),
                        )
                      }
                      onKeyDown={(e) => handleKeyDown(e, index, "prefix")}
                    />
                  </TableCell>

                  {/* Nomor Arsip */}
                  <TableCell className="p-1 border-r border-green-100 bg-slate-50">
                    <Input
                      type="text"
                      data-row={index}
                      data-col="nomor_arsip"
                      className="border-transparent shadow-none focus-visible:ring-1 focus-visible:ring-green-500 h-9 rounded-sm bg-transparent text-slate-700 w-full font-mono text-center font-semibold"
                      value={row["nomor_arsip"] || ""}
                      onChange={(e) =>
                        handleInputChange(index, "nomor_arsip", e.target.value)
                      }
                      onKeyDown={(e) => handleKeyDown(e, index, "nomor_arsip")}
                    />
                  </TableCell>

                  {/* Dynamic columns */}
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
                        data-row={index}
                        data-col={col.namaKolom}
                        className="border-transparent shadow-none focus-visible:ring-1 focus-visible:ring-blue-500 h-9 rounded-sm bg-transparent text-slate-700 w-full"
                        value={row[col.namaKolom] || ""}
                        onChange={(e) =>
                          handleInputChange(
                            index,
                            col.namaKolom,
                            e.target.value,
                          )
                        }
                        onKeyDown={(e) =>
                          handleKeyDown(e, index, col.namaKolom)
                        }
                      />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
