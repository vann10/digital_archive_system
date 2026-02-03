'use client'

import { useActionState } from "react"; 
import { login } from "../app/actions/auth";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../components/ui/card";
import { Alert, AlertDescription } from "../components/ui/alert";
import { Archive, AlertCircle, Loader2, User, Lock } from "lucide-react";
import { useFormStatus } from "react-dom";

// Komponen tombol submit terpisah untuk handle loading state
function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button className="w-full bg-blue-600 hover:bg-blue-700" type="submit" disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Memproses...
        </>
      ) : (
        "Masuk ke Sistem"
      )}
    </Button>
  );
}

export default function LoginPage() {
  // useActionState menangani return value dari server action (success/message)
  // [state, formAction] = useActionState(fn, initialState)
  const [state, formAction] = useActionState(login, { success: false, message: "" });

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-950 p-4">
      <div className="w-full max-w-md space-y-8">
        
        {/* Logo & Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="bg-blue-600 p-3 rounded-xl shadow-lg">
              <Archive className="h-10 w-10 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            E-Arsip Dinsos
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Sistem Informasi Arsip Digital Dinas Sosial
          </p>
        </div>

        {/* Login Card */}
        <Card className="border-slate-200 shadow-xl space-y-5 m-1">
          <CardHeader className="pt-5">
            <CardTitle>Login Pengguna</CardTitle>
            <CardDescription>
              Masukkan username dan password akun Anda.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={formAction} className="space-y-4">
              
              {/* Alert Error */}
              {state?.message && (
                <Alert variant="destructive" className="bg-red-50 text-red-600 border-red-200">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{state.message}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input 
                    id="username" 
                    name="username" 
                    placeholder="Masukkan username" 
                    className="pl-9"
                    required 
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input 
                    id="password" 
                    name="password" 
                    type="password" 
                    placeholder="••••••••" 
                    className="pl-9"
                    required 
                  />
                </div>
              </div>

              <div className="pt-2">
                <SubmitButton />
              </div>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center border-t p-4 bg-slate-50 rounded-b-xl">
            <p className="text-xs text-slate-400">
              Lupa password? Hubungi Administrator.
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}