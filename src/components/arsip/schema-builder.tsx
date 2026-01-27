"use client";

import { useState } from "react";
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
  X 
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
  options?: string[]; // Untuk tipe 'select'
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

// Helper Label Tipe
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
  // State Dialog
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingField, setEditingField] = useState<SchemaField | null>(null);

  // Form State dalam Dialog
  const [formLabel, setFormLabel] = useState("");
  const [formType, setFormType] = useState<ColumnType>("text");
  const [formRequired, setFormRequired] = useState(false);

  // Buka dialog untuk tambah baru
  const handleAddNew = () => {
    setEditingField(null);
    setFormLabel("");
    setFormType("text");
    setFormRequired(false);
    setIsDialogOpen(true);
  };

  // Buka dialog untuk edit
  const handleEdit = (field: SchemaField) => {
    setEditingField(field);
    setFormLabel(field.label);
    setFormType(field.type);
    setFormRequired(field.required);
    setIsDialogOpen(true);
  };

  // Simpan data dari dialog
  const handleSave = () => {
    if (!formLabel.trim()) return;

    const newField: SchemaField = {
      id: editingField ? editingField.id : `col_${Date.now()}`,
      label: formLabel,
      type: formType,
      required: formRequired,
      // options: [] // Implementasi opsi dropdown bisa ditambahkan nanti
    };

    if (editingField) {
      // Update existing
      onChange(fields.map(f => f.id === editingField.id ? newField : f));
    } else {
      // Add new
      onChange([...fields, newField]);
    }
    setIsDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    onChange(fields.filter(f => f.id !== id));
  };

  return (
    <div className="space-y-4">
      {/* HEADER BUILDER */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Struktur Kolom</h3>
          <p className="text-xs text-slate-500">Atur kolom data yang akan disimpan.</p>
        </div>
        <Button 
          type="button" 
          onClick={handleAddNew}
          className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
          size="sm"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Tambah Kolom
        </Button>
      </div>

      {/* LIST KOLOM */}
      <div className="space-y-3 min-h-[200px]">
        {fields.length === 0 && (
          <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
            <p className="text-sm text-slate-500">Belum ada kolom dikonfigurasi.</p>
            <Button variant="link" onClick={handleAddNew} className="text-blue-600">Buat kolom pertama</Button>
          </div>
        )}

        {fields.map((field, index) => (
          <div 
            key={field.id}
            className="group flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-lg shadow-sm hover:shadow-md hover:border-blue-200 transition-all duration-200"
          >
            {/* DRAG HANDLE */}
            <div className="cursor-grab active:cursor-grabbing p-1 rounded hover:bg-slate-100 text-slate-400">
              <GripVertical className="w-4 h-4" />
            </div>

            {/* TYPE ICON */}
            <div className="flex items-center justify-center w-8 h-8 rounded-md bg-slate-50 border border-slate-100">
              {getTypeIcon(field.type)}
            </div>

            {/* CONTENT */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-800 text-sm truncate">
                  {field.label}
                </span>
                {field.required && (
                  <Badge variant="secondary" className="bg-pink-100 text-pink-700 hover:bg-pink-100 border-0 text-[10px] px-1.5 py-0 h-5">
                    Wajib
                  </Badge>
                )}
              </div>
              <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                {getTypeLabel(field.type)}
              </div>
            </div>

            {/* ACTIONS */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => handleEdit(field)}
                className="h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50"
              >
                <Pencil className="w-3.5 h-3.5" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => handleDelete(field.id)}
                className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL EDIT/ADD */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px] gap-0 p-0 overflow-hidden rounded-xl">
          <DialogHeader className="p-6 pb-4 border-b border-slate-100 bg-slate-50/50">
            <DialogTitle className="text-lg font-bold text-slate-900">
              {editingField ? "Edit Kolom" : "Buat Kolom Baru"}
            </DialogTitle>
            <DialogDescription className="text-slate-500">
              Konfigurasikan detail kolom untuk jenis arsip ini.
            </DialogDescription>
          </DialogHeader>
          
          <div className="p-6 space-y-5">
            {/* Nama Kolom */}
            <div className="space-y-2">
              <Label htmlFor="col-name" className="text-xs font-semibold uppercase text-slate-500 tracking-wider">
                Nama Kolom
              </Label>
              <Input
                id="col-name"
                value={formLabel}
                onChange={(e) => setFormLabel(e.target.value)}
                placeholder="Contoh: Nomor Surat"
                className="focus-visible:ring-blue-500 border-slate-300"
                autoFocus
              />
            </div>

            {/* Tipe Data */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase text-slate-500 tracking-wider">
                Tipe Data
              </Label>
              <Select value={formType} onValueChange={(val) => setFormType(val as ColumnType)}>
                <SelectTrigger className="w-full border-slate-300 focus:ring-blue-500">
                  <SelectValue placeholder="Pilih tipe data" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Teks Singkat</SelectItem>
                  <SelectItem value="longtext">Teks Panjang (Deskripsi)</SelectItem>
                  <SelectItem value="number">Angka / Nominal</SelectItem>
                  <SelectItem value="date">Tanggal</SelectItem>
                  <SelectItem value="select">Pilihan (Dropdown)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Wajib Diisi Switch */}
            <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-slate-50/30">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium text-slate-900">Wajib Diisi</Label>
                <p className="text-xs text-slate-500">User harus mengisi kolom ini.</p>
              </div>
              <Switch 
                checked={formRequired}
                onCheckedChange={setFormRequired}
                className="data-[state=checked]:bg-blue-600"
              />
            </div>
          </div>

          <DialogFooter className="p-4 border-t border-slate-100 bg-slate-50/50 flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="h-9">
              Batal
            </Button>
            <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 h-9 px-6">
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}