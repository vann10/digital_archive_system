'use client';

import React from 'react';
import { FileText, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';

interface ArsipTerbaru {
  id: number;
  kode: string;
  jenis: string;
  tahun: number;
  tanggal: string;
}

interface ArsipTerbaruTableProps {
  data: ArsipTerbaru[];
}

export function ArsipTerbaruTable({ data }: ArsipTerbaruTableProps) {
  return (
    <Card className="shadow-sm border-slate-200">
      <CardHeader>
        <CardTitle className="text-base font-semibold text-slate-800">Arsip Terbaru</CardTitle>
        <p className="text-xs text-slate-500">5 arsip terakhir yang ditambahkan</p>
      </CardHeader>
      <CardContent>
        {data.length > 0 ? (
          <div className="space-y-4">
            {data.map((item) => (
              <div 
                key={item.id} 
                className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-lg hover:bg-slate-50 transition-colors"
              >
                {/* Icon & Judul */}
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-slate-500 font-mono">{item.kode}</span>
                      <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                      <span className="text-xs text-slate-500">{item.jenis}</span>
                    </div>
                  </div>
                </div>

                {/* Tahun & Tanggal */}
                <div className="text-right hidden sm:block">
                  <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 mb-1">
                    {item.tahun}
                  </div>
                  <div className="flex items-center justify-end text-xs text-slate-400 mt-1">
                    <Clock className="w-3 h-3 mr-1" />
                    {item.tanggal}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-slate-400">
            <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Belum ada arsip yang ditambahkan</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}