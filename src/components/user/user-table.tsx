"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "../../components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { Label } from "../../components/ui/label";
import { Badge } from "../../components/ui/badge";
import { Plus, Trash2, UserPlus, Shield, Eye, EyeOff } from "lucide-react";
import { createUser, deleteUser } from "../../app/actions/users";
import { useFormStatus } from "react-dom";

type User = {
  id: number;
  username: string;
  password: string;
  role: "admin" | "staff" | "viewer" | string;
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Menyimpan..." : "Simpan User"}
    </Button>
  );
}

export default function UserTableClient({ initialUsers }: { initialUsers: User[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [showPassword, setShowPassword] = useState<Record<number, boolean>>({});

  const togglePassword = (id: number) => {
    setShowPassword((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCreate = async (formData: FormData) => {
    const res = await createUser(null, formData);
    if (res.success) {
      setIsOpen(false);
      // Optional: Add toast notification here
    } else {
      alert(res.message);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm("Apakah Anda yakin ingin menghapus user ini?")) {
      await deleteUser(id);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return <Badge className="bg-red-500 hover:bg-red-600">Admin</Badge>;
      case "staff":
        return <Badge className="bg-blue-500 hover:bg-blue-600">Staff</Badge>;
      default:
        return <Badge variant="secondary">Viewer</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Daftar Pengguna</h2>
          <p className="text-sm text-slate-500 mt-1">
            Kelola akses dan izin pengguna sistem
          </p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button size="default" className="gap-2">
              <UserPlus className="h-4 w-4" /> Tambah User
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[480px]">
            <DialogHeader>
              <DialogTitle>Tambah Pengguna Baru</DialogTitle>
            </DialogHeader>
            <form action={handleCreate} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input 
                  id="username" 
                  name="username" 
                  placeholder="Masukkan username" 
                  required 
                  className="h-10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="text"
                  placeholder="Masukkan password"
                  required
                  className="h-10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select name="role" defaultValue="staff" required>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Pilih role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter className="pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsOpen(false)}
                >
                  Batal
                </Button>
                <SubmitButton />
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/50">
                <TableHead className="w-16 font-semibold text-slate-700">No</TableHead>
                <TableHead className="font-semibold text-slate-700">Username</TableHead>
                <TableHead className="font-semibold text-slate-700">Role</TableHead>
                <TableHead className="font-semibold text-slate-700">Password</TableHead>
                <TableHead className="text-right font-semibold text-slate-700 w-24">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {initialUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center h-32 text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Shield className="h-10 w-10 text-slate-300" />
                      <p className="text-sm">Belum ada pengguna yang ditambahkan.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                initialUsers.map((user, index) => (
                  <TableRow key={user.id} className="hover:bg-slate-50/50 transition-colors">
                    <TableCell className="font-medium text-slate-500">{index + 1}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                          <Shield className="h-4 w-4 text-white" />
                        </div>
                        <span className="font-medium text-slate-900">{user.username}</span>
                      </div>
                    </TableCell>
                    <TableCell>{getRoleBadge(user.role)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono text-sm text-slate-700 bg-slate-50 px-2.5 py-1 rounded border border-slate-200">
                          {showPassword[user.id] ? user.password : "••••••••"}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hover:bg-slate-100"
                          onClick={() => togglePassword(user.id)}
                        >
                          {showPassword[user.id] ? (
                            <EyeOff className="h-4 w-4 text-slate-500" />
                          ) : (
                            <Eye className="h-4 w-4 text-slate-500" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-red-500 hover:text-red-600 hover:bg-red-50"
                        onClick={() => handleDelete(user.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}