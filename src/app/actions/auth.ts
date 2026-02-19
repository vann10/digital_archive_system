// app/actions/auth.ts

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
    
    // Tentukan apakah harus secure (hanya true jika pakai HTTPS beneran)
    // Untuk akses IP lokal (HTTP), ini WAJIB false.
    const isProductionSSL = process.env.NODE_ENV === "production" && process.env.USE_HTTPS === "true";

    cookieStore.set("user_session", sessionData, {
      httpOnly: true,
      
      // UBAH BARIS INI:
      // Jangan paksa true hanya karena production, karena kamu akses via HTTP IP Lokal
      secure: false, // <-- Set false agar bisa login via 192.168...
      
      maxAge: 60 * 60 * 24, // 24 jam
      path: "/",
      sameSite: "lax", // Tambahkan ini agar cookie tidak hilang saat redirect
    });
  } catch (error) {
    console.error("Login error:", error);
    return { success: false, message: "Terjadi kesalahan sistem" };
  }

  // Redirect jika sukses
  redirect("/dashboard");
}


export async function logout() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete("user_session");
    return { success: true };
  } catch (err) {
    return { success: false };
  }
}


// 2. FUNGSI BARU: GET SESSION (Untuk Sidebar)
export async function getSession() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("user_session");

  if (!sessionCookie) {
    return null;
  }

  try {
    // Ambil ID dari cookie
    const sessionData = JSON.parse(sessionCookie.value);
    
    // FETCH KE DATABASE (Sesuai permintaan: ambil data fresh)
    const userData = await db
      .select({
        id: users.id,
        username: users.username,
        role: users.role,
      })
      .from(users)
      .where(eq(users.id, sessionData.id))
      .limit(1);

    if (userData.length === 0) return null;

    return userData[0];
  } catch (error) {
    console.error("Error getSession:", error);
    return null;
  }
}