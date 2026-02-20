"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Eye, Pencil, Loader2, FileText } from "lucide-react";
import { updateArsip } from "../../app/actions/update-arsip";
import { useRouter } from "next/navigation";
import { Badge } from "../ui/badge";
import { formatDate } from "../../lib/utils";

// Helper untuk komponen penampil teks auto-grow
function ReadOnlyField({
  value,
  isLongText = false,
}: {
  value: any;
  isLongText?: boolean;
}) {
  return (
    <div
      className={`
        w-full rounded-md border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm text-slate-700 shadow-sm 
        whitespace-pre-wrap break-words
        ${isLongText ? "min-h-[80px]" : "min-h-[40px] flex items-center"}
      `}
    >
      {value || <span className="text-slate-400 italic">-</span>}
    </div>
  );
}

export function ArsipDetailDialog({ item }: { item: any }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Parse Schema (dikirim dari server sebagai JSON string)
  const schema: any[] =
    typeof item.schemaConfig === "string"
      ? JSON.parse(item.schemaConfig)
      : item.schemaConfig || [];

  // Data dari tabel dinamis berbentuk flat object.
  // Ambil semua field non-sistem sebagai dataCustom.
  const SYSTEM_KEYS = new Set([
    "id",
    "jenisNama",
    "schemaConfig",
    "createdAt",
    "created_at",
  ]);
  const dataCustom: Record<string, any> = {};
  Object.entries(item).forEach(([k, v]) => {
    if (!SYSTEM_KEYS.has(k)) {
      dataCustom[k] = v ?? "";
    }
  });

  // State Form — semua field dari tabel dinamis (prefix, nomor_arsip, dll.) ada di dataCustom
  const [formData, setFormData] = useState<Record<string, any>>({
    ...dataCustom,
  });

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const payload = {
        id: item.id,
        dataCustom: formData,
      };

      await updateArsip(payload);

      setIsEditing(false);
      setOpen(false);
      router.refresh();
    } catch (error) {
      console.error("Gagal update:", error);
      alert("Gagal menyimpan perubahan");
    } finally {
      setIsLoading(false);
    }
  };

  // Filter field yang sudah ditampilkan secara manual (prefix, nomor_arsip)
  const customSchema = schema.filter(
    (f: any) => !["prefix", "nomor_arsip"].includes(f.id),
  );

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        setOpen(val);
        if (!val) setIsEditing(false); // Reset mode saat tutup
      }}
    >
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-slate-400 hover:text-blue-600"
          title="Lihat Detail"
        >
          <Eye className="w-4 h-4" />
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col gap-0 p-0">
        {/* HEADER */}
        <DialogHeader className="p-6 pb-4 border-b border-slate-100 bg-slate-50/50 sticky top-0 z-10 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-slate-900">
                  {isEditing ? "Edit Arsip" : "Detail Arsip"}
                </DialogTitle>
                <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                  <Badge variant="outline" className="bg-white font-normal">
                    {item.jenisNama}
                  </Badge>
                  <span>•</span>
                  <span>Diinput: {formatDate(item.createdAt)}</span>
                </div>
              </div>
            </div>

            {/* Toggle Edit Mode */}
            {!isEditing && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="gap-2 text-blue-600 border-blue-200 hover:bg-blue-50"
              >
                <Pencil className="w-3.5 h-3.5" /> Edit
              </Button>
            )}
          </div>
        </DialogHeader>

        {/* CONTENT */}
        <div className="p-6 space-y-6">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-6">

              {/* Kode Arsip (prefix) */}
              <div className="space-y-2">
                <Label className="text-slate-600 text-xs uppercase font-semibold">
                  Kode Arsip
                </Label>
                {isEditing ? (
                  <Input
                    value={formData.prefix ?? ""}
                    onChange={(e) =>
                      setFormData({ ...formData, prefix: e.target.value })
                    }
                  />
                ) : (
                  <ReadOnlyField value={formData.prefix} />
                )}
              </div>

              {/* Nomor Arsip */}
              <div className="space-y-2">
                <Label className="text-slate-600 text-xs uppercase font-semibold">
                  Nomor Arsip
                </Label>
                {isEditing ? (
                  <Input
                    value={formData.nomor_arsip ?? ""}
                    onChange={(e) =>
                      setFormData({ ...formData, nomor_arsip: e.target.value })
                    }
                  />
                ) : (
                  <ReadOnlyField value={formData.nomor_arsip} />
                )}
              </div>

              {/* Field Dinamis dari Schema */}
              {customSchema.map((field: any) => (
                <div
                  key={field.id}
                  className={
                    field.type === "longtext"
                      ? "md:col-span-2 space-y-2"
                      : "space-y-2"
                  }
                >
                  <Label className="text-slate-600 text-xs uppercase font-semibold">
                    {field.label}
                  </Label>

                  {isEditing ? (
                    field.type === "longtext" ? (
                      <Textarea
                        value={formData[field.id] ?? ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            [field.id]: e.target.value,
                          })
                        }
                        className="min-h-[100px]"
                      />
                    ) : (
                      <Input
                        type={field.type === "number" ? "number" : "text"}
                        value={formData[field.id] ?? ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            [field.id]: e.target.value,
                          })
                        }
                      />
                    )
                  ) : (
                    <ReadOnlyField
                      value={formData[field.id]}
                      isLongText={field.type === "longtext"}
                    />
                  )}
                </div>
              ))}

              {customSchema.length === 0 && (
                <div className="md:col-span-2 text-center py-4 text-slate-400 italic text-sm bg-slate-50 rounded-lg border border-dashed border-slate-200">
                  Tidak ada data spesifik tambahan.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* FOOTER ACTIONS */}
        {isEditing && (
          <DialogFooter className="p-4 border-t border-slate-100 bg-slate-50/50">
            <Button
              variant="outline"
              onClick={() => setIsEditing(false)}
              disabled={isLoading}
            >
              Batal
            </Button>
            <Button
              onClick={handleSave}
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Simpan Perubahan
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}