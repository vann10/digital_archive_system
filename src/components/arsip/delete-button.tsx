"use client";

import { useState, useTransition } from "react";
import { Trash2, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { deleteJenisArsip } from "../../app/actions/jenis-arsip";

export function DeleteJenisButton({ id }: { id: number }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      await deleteJenisArsip(id);
      setOpen(false); // Tutup dialog setelah selesai
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50"
          title="Hapus Jenis"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center gap-2 text-red-600 mb-2">
            <AlertTriangle className="h-6 w-6" />
            <DialogTitle className="text-lg font-bold">Hapus Jenis Arsip?</DialogTitle>
          </div>
          <DialogDescription className="text-slate-600 pt-2 font-medium">
            Menghapus jenis arsip akan menghapus semua data di dalamnya. Lanjutkan?
          </DialogDescription>
          <p className="text-xs text-slate-500 mt-2">
            Tindakan ini tidak dapat dibatalkan. Semua arsip yang menggunakan jenis ini akan hilang permanen dari database.
          </p>
        </DialogHeader>
        
        <DialogFooter className="mt-4 gap-2 sm:gap-2">
          <Button 
            variant="outline" 
            onClick={() => setOpen(false)} 
            disabled={isPending}
          >
            Batal
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleDelete} 
            disabled={isPending}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Menghapus...
              </>
            ) : (
              "Ya, Hapus Semua"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}