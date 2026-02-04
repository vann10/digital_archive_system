"use server";

import { db } from "../../db";
import { users } from "../../db/schema";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcrypt";

export async function login(prevState: any, formData: FormData) {
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;

  if (!username || !password) {
    return { success: false, message: "Username dan password wajib diisi" };
  }

  try {
    // Cari user berdasarkan username
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.username, username))
      .limit(1);

    if (existingUser.length === 0) {
      return { success: false, message: "Username tidak ditemukan" };
    }

    const user = existingUser[0];

    // Cek password (WARNING: Untuk production, gunakan bcrypt/argon2 untuk hashing!)
    // Di sini kita menggunakan perbandingan string langsung sesuai request seed sederhana
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return { success: false, message: "Password salah" };
    }

    // Cek status aktif
    if (!user.isActive) {
      return { success: false, message: "Akun telah dinonaktifkan oleh admin" };
    }

    // Set Session Cookie
    const sessionData = JSON.stringify({
      id: user.id,
      username: user.username,
      role: user.role,
    });

    // Simpan session (1 hari)
    const cookieStore = await cookies();
    cookieStore.set("user_session", sessionData, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24, // 24 jam
      path: "/",
    });
  } catch (error) {
    console.error("Login error:", error);
    return { success: false, message: "Terjadi kesalahan sistem" };
  }

  // Redirect jika sukses
  redirect("/dashboard");
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete("user_session");
  redirect("/");
}
