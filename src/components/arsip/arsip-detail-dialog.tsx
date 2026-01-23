'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { Eye, Edit2, Save, X, Loader2, Calendar, FileText, Hash } from 'lucide-react';
import { updateArsip } from '../../app/actions/update-arsip';
import { useRouter } from 'next/navigation';


type Props = {
  item: any;
};

export function ArsipDetailDialog({ item }: Props) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // State untuk menyimpan perubahan sementara
  // Kita gabungkan data inti dan data custom menjadi satu object flat
  const initialData = {
    judul: item.judul,
    nomorArsip: item.nomor || '',
    tahun: item.tahun,
    ...(typeof item.dataCustom === 'string' ? JSON.parse(item.dataCustom) : item.dataCustom)
  };

  const [formData, setFormData] = useState(initialData);

  // Parsing Schema Config untuk field dinamis
  let schema = [];
  try {
    schema = typeof item.schemaConfig === 'string' 
      ? JSON.parse(item.schemaConfig) 
      : (item.schemaConfig || []);
  } catch (e) {
    console.error("Error parsing schema", e);
  }

  const handleInputChange = (key: string, value: string) => {
    setFormData((prev: any) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setIsLoading(true);
    const res = await updateArsip(item.id, formData);
    setIsLoading(false);

    if (res.success) {
      setIsEditing(false); // Keluar mode edit
      router.refresh(); // Refresh data halaman belakang
    } else {
      alert(res.message);
    }
  };

  // Reset form saat modal ditutup/dibuka
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) setIsEditing(false); // Reset ke view mode kalau ditutup
    if (open) setFormData(initialData); // Reset data ke awal
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full">
          <Eye className="w-4 h-4" />
          <span className="sr-only">Detail</span>
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <DialogTitle className="text-xl flex items-center gap-2">
              {isEditing ? 'Edit Arsip' : 'Detail Arsip'}
              <Badge variant="secondary" className="text-xs font-normal">
                {item.jenisNama}
              </Badge>
            </DialogTitle>
            <DialogDescription>
              {item.jenisKode} • Dibuat pada {item.createdAt ? new Date(item.createdAt.replace(' ', 'T')).toLocaleDateString('id-ID') : '-'}
            </DialogDescription>
          </div>
          
          {/* TOMBOL TOGGLE EDIT (Hanya muncul jika tidak sedang loading) */}
          {!isEditing && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setIsEditing(true)}
              className="gap-2 mr-8 border-slate-200 text-slate-600 hover:text-blue-600"
            >
              <Edit2 className="w-3.5 h-3.5" /> Edit Data
            </Button>
          )}
        </DialogHeader>

        {/* FORM / DETAIL VIEW */}
        <div className="grid gap-6 py-4">
          
          {/* SECTION: DATA UTAMA */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
              <FileText className="w-4 h-4 text-blue-600" /> Data Utama
            </h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-2">
                <Label className="text-slate-500 text-xs uppercase tracking-wider">Judul Arsip</Label>
                {isEditing ? (
                  <Input 
                    value={formData.judul} 
                    onChange={(e) => handleInputChange('judul', e.target.value)} 
                    className="font-medium"
                  />
                ) : (
                  <div className="text-base font-medium text-slate-900 p-2 bg-slate-50 rounded-md border border-slate-100">
                    {formData.judul}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-slate-500 text-xs uppercase tracking-wider">Nomor Arsip</Label>
                {isEditing ? (
                  <Input 
                    value={formData.nomorArsip} 
                    onChange={(e) => handleInputChange('nomorArsip', e.target.value)} 
                  />
                ) : (
                  <div className="flex items-center gap-2 p-2 rounded-md">
                    <Hash className="w-4 h-4 text-slate-400" />
                    <span className="font-mono text-slate-700">{formData.nomorArsip || '-'}</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-slate-500 text-xs uppercase tracking-wider">Tahun</Label>
                {isEditing ? (
                  <Input 
                    type="number"
                    value={formData.tahun} 
                    onChange={(e) => handleInputChange('tahun', e.target.value)} 
                  />
                ) : (
                  <div className="flex items-center gap-2 p-2 rounded-md">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-700">{formData.tahun}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* SECTION: DATA DETAIL (DINAMIS) */}
          {schema.length > 0 && (
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2 mt-2">
                <FileText className="w-4 h-4 text-green-600" /> Detail {item.jenisNama}
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {schema.map((field: any) => (
                  <div key={field.id} className="space-y-2">
                    <Label className="text-slate-500 text-xs uppercase tracking-wider">
                      {field.label} {field.required && <span className="text-red-500">*</span>}
                    </Label>
                    
                    {isEditing ? (
                      <Input 
                        type={field.type === 'date' ? 'date' : (field.type === 'number' ? 'number' : 'text')}
                        value={formData[field.id] || ''}
                        onChange={(e) => handleInputChange(field.id, e.target.value)}
                        className="bg-white"
                      />
                    ) : (
                      <div className="text-sm text-slate-800 p-2 border-b border-slate-100 min-h-[36px] flex items-center">
                        {formData[field.id] || '-'}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* FOOTER ACTIONS */}
        <DialogFooter className="gap-2 border-t border-slate-100 pt-4">
          {isEditing ? (
            <>
              <Button variant="ghost" onClick={() => setIsEditing(false)} disabled={isLoading}>
                Batal
              </Button>
              <Button onClick={handleSave} disabled={isLoading} className="bg-blue-600 hover:bg-blue-700">
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                Simpan Perubahan
              </Button>
            </>
          ) : (
            <Button variant="secondary" onClick={() => setIsOpen(false)}>
              Tutup
            </Button>
          )}
        </DialogFooter>

      </DialogContent>
    </Dialog>
  );
}