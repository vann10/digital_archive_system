"use client";

import { useState, useRef } from "react";
import { 
  GripVertical, 
  Type, 
  Hash, 
  Calendar, 
  List, 
  AlignLeft, 
  Plus, 
  Trash2, 
  Pencil,
  Lock,
  AlertTriangle // Import icon Alert
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../../components/ui/dialog";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { Switch } from "../../components/ui/switch";
import { cn } from "../../lib/utils";

// Definisi Tipe Data Kolom
export type ColumnType = "text" | "number" | "date" | "select" | "longtext";

export interface SchemaField {
  id: string;
  label: string;
  type: ColumnType;
  required: boolean;
  options?: string[];
  isSystem?: boolean; 
}

interface SchemaBuilderProps {
  fields: SchemaField[];
  onChange: (fields: SchemaField[]) => void;
}

// Helper Icon berdasarkan tipe
const getTypeIcon = (type: ColumnType) => {
  switch (type) {
    case "text": return <Type className="w-4 h-4 text-slate-500" />;
    case "number": return <Hash className="w-4 h-4 text-slate-500" />;
    case "date": return <Calendar className="w-4 h-4 text-slate-500" />;
    case "select": return <List className="w-4 h-4 text-slate-500" />;
    case "longtext": return <AlignLeft className="w-4 h-4 text-slate-500" />;
    default: return <Type className="w-4 h-4 text-slate-500" />;
  }
};

const getTypeLabel = (type: ColumnType) => {
  switch (type) {
    case "text": return "Teks Singkat";
    case "number": return "Angka";
    case "date": return "Tanggal";
    case "select": return "Pilihan (Dropdown)";
    case "longtext": return "Teks Panjang";
    default: return "Teks";
  }
};

export function SchemaBuilder({ fields, onChange }: SchemaBuilderProps) {
  // State untuk Dialog Edit/Tambah
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingField, setEditingField] = useState<SchemaField | null>(null);

  // State untuk Form Edit/Tambah
  const [formLabel, setFormLabel] = useState("");
  const [formType, setFormType] = useState<ColumnType>("text");
  const [formRequired, setFormRequired] = useState(false);

  // State untuk Dialog Hapus
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  // --- DRAG AND DROP STATE ---
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  // --- DRAG HANDLERS ---
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, position: number) => {
    dragItem.current = position;
    e.currentTarget.classList.add("opacity-50");
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>, position: number) => {
    dragOverItem.current = position;
  };

  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    e.currentTarget.classList.remove("opacity-50");
    
    if (dragItem.current !== null && dragOverItem.current !== null) {
      const copyListItems = [...fields];
      const dragItemContent = copyListItems[dragItem.current];
      
      copyListItems.splice(dragItem.current, 1);
      copyListItems.splice(dragOverItem.current, 0, dragItemContent);
      
      dragItem.current = null;
      dragOverItem.current = null;
      
      onChange(copyListItems);
    }
  };

  // --- CRUD HANDLERS ---
  const handleAddNew = () => {
    setEditingField(null);
    setFormLabel("");
    setFormType("text");
    setFormRequired(false);
    setIsDialogOpen(true);
  };

  const handleEdit = (field: SchemaField) => {
    setEditingField(field);
    setFormLabel(field.label);
    setFormType(field.type);
    setFormRequired(field.required);
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!formLabel.trim()) return;

    const newField: SchemaField = {
      id: editingField ? editingField.id : `col_${Date.now()}`,
      label: formLabel,
      type: formType,
      required: formRequired,
      isSystem: editingField?.isSystem || false 
    };

    if (editingField) {
      onChange(fields.map(f => f.id === editingField.id ? newField : f));
    } else {
      onChange([...fields, newField]);
    }
    setIsDialogOpen(false);
  };

  // Logic Hapus Final (Dipanggil setelah konfirmasi)
  const confirmDelete = () => {
    if (deleteTarget) {
      onChange(fields.filter(f => f.id !== deleteTarget));
      setDeleteTarget(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* HEADER */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Struktur Kolom</h3>
          <p className="text-xs text-slate-500">
            Atur urutan dan konfigurasi kolom (termasuk kolom sistem).
          </p>
        </div>
        <Button 
          type="button" 
          onClick={handleAddNew}
          className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
          size="sm"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Tambah Custom
        </Button>
      </div>

      {/* LIST FIELDS */}
      <div className="space-y-3 min-h-[200px]">
        {fields.length === 0 && (
          <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
            <p className="text-sm text-slate-500">Memuat struktur kolom...</p>
          </div>
        )}

        {fields.map((field, index) => (
          <div 
            key={field.id}
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragEnter={(e) => handleDragEnter(e, index)}
            onDragEnd={handleDragEnd}
            className={cn(
              "group flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 cursor-move",
              field.isSystem ? "bg-slate-50/80 border-slate-200/80" : ""
            )}
          >
            {/* DRAG HANDLE */}
            <div className="cursor-grab active:cursor-grabbing p-1 rounded hover:bg-slate-100 text-slate-400">
              <GripVertical className="w-4 h-4" />
            </div>

            {/* TYPE ICON */}
            <div className="flex items-center justify-center w-8 h-8 rounded-md bg-white border border-slate-100 shadow-sm">
              {getTypeIcon(field.type)}
            </div>

            {/* CONTENT */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-800 text-sm truncate">
                  {field.label}
                </span>
                
                {field.required && (
                  <Badge variant="secondary" className="bg-pink-50 text-pink-700 border-pink-100 text-[10px] px-1.5 py-0 h-5">
                    Wajib
                  </Badge>
                )}

                {field.isSystem && (
                  <Badge variant="secondary" className="bg-amber-50 text-amber-700 border-amber-100 text-[10px] px-1.5 py-0 h-5 flex gap-1 items-center">
                    <Lock className="w-3 h-3" /> Utama
                  </Badge>
                )}
              </div>
              <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                {getTypeLabel(field.type)}
                {field.isSystem && " (Kolom Sistem)"}
              </div>
            </div>

            {/* ACTIONS */}
            <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => handleEdit(field)}
                className="h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50"
              >
                <Pencil className="w-3.5 h-3.5" />
              </Button>
              
              {/* Tombol Hapus: Trigger Dialog Hapus */}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setDeleteTarget(field.id)}
                disabled={field.isSystem}
                className={cn(
                  "h-8 w-8",
                  field.isSystem 
                    ? "text-slate-200 cursor-not-allowed" 
                    : "text-slate-400 hover:text-red-600 hover:bg-red-50"
                )}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* --- DIALOG EDIT/TAMBAH --- */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {editingField ? "Edit Kolom" : "Buat Kolom Baru"}
            </DialogTitle>
            <DialogDescription>
              {editingField?.isSystem 
                ? "Anda hanya dapat mengubah Label untuk kolom sistem." 
                : "Konfigurasikan detail kolom untuk jenis arsip ini."}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="col-name">Label Kolom</Label>
              <Input
                id="col-name"
                value={formLabel}
                onChange={(e) => setFormLabel(e.target.value)}
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label>Tipe Data</Label>
              <Select 
                value={formType} 
                onValueChange={(val) => setFormType(val as ColumnType)}
                disabled={editingField?.isSystem}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Teks Singkat</SelectItem>
                  <SelectItem value="longtext">Teks Panjang</SelectItem>
                  <SelectItem value="number">Angka</SelectItem>
                  <SelectItem value="date">Tanggal</SelectItem>
                  <SelectItem value="select">Pilihan</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between mt-2">
              <Label>Wajib Diisi</Label>
              <Switch 
                checked={formRequired}
                onCheckedChange={setFormRequired}
                disabled={editingField?.isSystem}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleSave}>Simpan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- DIALOG KONFIRMASI HAPUS --- */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <div className="flex items-center gap-2 text-red-600 mb-2">
              <AlertTriangle className="h-5 w-5" />
              <DialogTitle className="text-lg font-bold">Hapus Kolom?</DialogTitle>
            </div>
            <DialogDescription className="text-slate-600 font-medium">
              Apakah Anda yakin ingin menghapus kolom ini?
            </DialogDescription>
            <p className="text-sm text-slate-500 mt-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
              <span className="font-semibold text-slate-700">Perhatian:</span> Semua data arsip yang tersimpan pada kolom ini akan <span className="text-red-600 font-semibold">hilang permanen</span> dan tidak dapat dikembalikan.
            </p>
          </DialogHeader>
          
          <DialogFooter className="mt-2 gap-2 sm:gap-2">
            <Button 
              variant="outline" 
              onClick={() => setDeleteTarget(null)}
            >
              Batal
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Ya, Hapus Kolom
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}