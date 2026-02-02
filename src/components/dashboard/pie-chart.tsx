'use client';

import React from 'react';
import { 
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';

interface JenisArsipDistribution {
  name: string;
  value: number;
  color: string;
}

interface PieChartCardProps {
  data: JenisArsipDistribution[];
}

export function PieChartCard({ data }: PieChartCardProps) {
  return (
    <Card className="col-span-3 shadow-sm border-slate-200">
      <CardHeader>
        <CardTitle className="text-base font-semibold text-slate-800">Distribusi Jenis Arsip</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length > 0 ? (
          <div className="flex items-center justify-center h-[300px]">
            {/* Chart Pie */}
            <div className="w-[60%] h-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data as any}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Legend Custom */}
            <div className="w-[40%] pl-4 space-y-3">
              {data.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: item.color }} 
                  />
                  <span className="text-xs text-slate-600 font-medium">{item.name}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-[300px] text-slate-400">
            <p className="text-sm">Belum ada data jenis arsip</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}