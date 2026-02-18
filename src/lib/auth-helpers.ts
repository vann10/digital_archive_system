// lib/auth-helpers.ts
// Helper untuk verifikasi session di dalam server actions

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "../db";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";

export interface SessionUser {
  id: number;
  username: string;
  role: "admin" | "staff";
}

/**
 * Ambil session dari cookie dan validasi ke database.
 * Return null jika tidak ada session valid.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("user_session");

    if (!sessionCookie?.value) return null;

    const sessionData = JSON.parse(sessionCookie.value);
    if (!sessionData?.id) return null;

    // Verifikasi ke database (bukan hanya percaya cookie)
    const userData = await db
      .select({
        id: users.id,
        username: users.username,
        role: users.role,
        isActive: users.isActive,
      })
      .from(users)
      .where(eq(users.id, sessionData.id))
      .limit(1);

    if (userData.length === 0) return null;
    if (!userData[0].isActive) return null;

    return {
      id: userData[0].id,
      username: userData[0].username,
      role: userData[0].role as "admin" | "staff",
    };
  } catch {
    return null;
  }
}

/**
 * Wajib login. Redirect ke "/" jika tidak ada session.
 * Gunakan di setiap server action yang membutuhkan autentikasi.
 */
export async function requireLogin(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) {
    redirect("/");
  }
  return user;
}

/**
 * Wajib role admin. Throw error jika bukan admin.
 * Gunakan di server action yang hanya boleh diakses admin.
 */
export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireLogin();
  if (user.role !== "admin") {
    // Ganti throw dengan redirect
    redirect("/dashboard?error=unauthorized"); 
  }
  return user;
}
