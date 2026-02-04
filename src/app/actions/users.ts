'use server'

import { db } from "../../db";
import { users } from "../../db/schema";
import { eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import bcrypt from "bcrypt";

export async function getUsers() {
  try {
    const data = await db.select().from(users).orderBy(desc(users.createdAt));
    return { success: true, data };
  } catch (error) {
    console.error("Error fetching users:", error);
    return { success: false, data: [] };
  }
}

export async function createUser(prevState: any, formData: FormData) {
  try {
    const username = formData.get("username") as string;
    const password = formData.get("password") as string;
    const role = formData.get("role") as "admin" | "staff";

    if (!username || !password || !role) {
      return { success: false, message: "Semua field harus diisi" };
    }

    // Cek username duplikat
    const existing = await db.select().from(users).where(eq(users.username, username));
    if (existing.length > 0) {
      return { success: false, message: "Username sudah digunakan" };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await db.insert(users).values({
      username,
      password: hashedPassword, // Di aplikasi nyata, gunakan bcrypt/argon2 untuk hashing
      role,
    });

    revalidatePath("/manajemen-user");
    return { success: true, message: "User berhasil ditambahkan" };
  } catch (error) {
    console.error("Error creating user:", error);
    return { success: false, message: "Gagal menambahkan user" };
  }
}

export async function deleteUser(id: number) {
  try {
    await db.delete(users).where(eq(users.id, id));
    revalidatePath("/manajemen-user");
    return { success: true, message: "User berhasil dihapus" };
  } catch (error) {
    console.error("Error deleting user:", error);
    return { success: false, message: "Gagal menghapus user" };
  }
}