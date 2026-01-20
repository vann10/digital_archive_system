import Link from 'next/link';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Archive } from 'lucide-react';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      {/* Container Utama Login */}
      <Card className="w-full max-w-md shadow-lg border-slate-200">
        
        {/* Header Login */}
        <CardHeader className="text-center space-y-2 pb-6">
          <div className="flex justify-center mb-2">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
              <Archive className="w-7 h-7 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-slate-900">Arsip Digital</CardTitle>
          <CardDescription>
            Silakan masuk untuk mengakses Sistem Arsip Dinas Sosial
          </CardDescription>
        </CardHeader>

        {/* Form Input */}
        <CardContent>
          <form className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username / NIP</Label>
              <Input 
                id="username" 
                type="text" 
                placeholder="Masukkan NIP Anda"
                className="border-slate-300 focus:ring-blue-600"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
              </div>
              <Input 
                id="password" 
                type="password" 
                placeholder="••••••••"
                className="border-slate-300 focus:ring-blue-600"
              />
            </div>
            
            {/* Tombol Login - Sementara kita arahkan langsung ke dashboard pakai Link */}
            <Button asChild className="w-full bg-blue-600 hover:bg-blue-700 mt-4">
              <Link href="/dashboard">
                Masuk ke Sistem
              </Link>
            </Button>
          </form>
        </CardContent>

        {/* Footer */}
        <CardFooter className="flex justify-center border-t pt-4 text-xs text-slate-500">
          &copy; 2026 Dinas Sosial. Internal Use Only.
        </CardFooter>
      </Card>
    </div>
  );
}