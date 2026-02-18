'use server'

import { db } from "../../db";
import { users } from "../../db/schema";
import { eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import bcrypt from "bcrypt";
import { requireAdmin } from "../../lib/auth-helpers";

export async function getUsers() {
  await requireAdmin();
  try {
    const data = await db.select({
      id: users.id,
      username: users.username,
      role: users.role,
      isActive: users.isActive,
      createdAt: users.createdAt,
    }).from(users).orderBy(desc(users.createdAt));
    return { success: true, data };
  } catch (error) {
    console.error("Error fetching users:", error);
    return { success: false, data: [] };
  }
}

export async function createUser(prevState: any, formData: FormData) {
  await requireAdmin();
  try {
    const username = formData.get("username") as string;
    const password = formData.get("password") as string;
    const role = formData.get("role") as "admin" | "staff";

    if (!username || !password || !role) {
      return { success: false, message: "Semua field harus diisi" };
    }

    if (!["admin", "staff"].includes(role)) {
      return { success: false, message: "Role tidak valid" };
    }

    const existing = await db.select().from(users).where(eq(users.username, username));
    if (existing.length > 0) {
      return { success: false, message: "Username sudah digunakan" };
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await db.insert(users).values({ username, password: hashedPassword, role });

    revalidatePath("/users");
    return { success: true, message: "User berhasil ditambahkan" };
  } catch (error) {
    console.error("Error creating user:", error);
    return { success: false, message: "Gagal menambahkan user" };
  }
}

export async function toggleUserActive(id: number, isActive: boolean) {
  const currentUser = await requireAdmin();
  if (id === currentUser.id) {
    return { success: false, message: "Tidak dapat mengubah status akun sendiri" };
  }
  try {
    await db.update(users).set({ isActive }).where(eq(users.id, id));
    revalidatePath("/users");
    return { success: true, message: isActive ? "User diaktifkan" : "User dinonaktifkan" };
  } catch (error) {
    return { success: false, message: "Gagal mengubah status user" };
  }
}

export async function deleteUser(id: number) {
  const currentUser = await requireAdmin();
  if (id === currentUser.id) {
    return { success: false, message: "Tidak dapat menghapus akun sendiri" };
  }
  try {
    await db.delete(users).where(eq(users.id, id));
    revalidatePath("/users");
    return { success: true, message: "User berhasil dihapus" };
  } catch (error) {
    console.error("Error deleting user:", error);
    return { success: false, message: "Gagal menghapus user" };
  }
}
