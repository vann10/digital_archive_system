import { db } from './src/db';
import { users } from './src/db/schema';
import { eq } from 'drizzle-orm';

async function seed() {
  console.log('🌱 Memulai seeding users...');

  // Data user awal
  const initialUsers = [
    {
      username: 'admin',
      password: 'admin', // Password plain text (sesuai request sederhana)
      role: 'admin' as const,
      isActive: true,
    },
    {
      username: 'staff',
      password: 'staff',
      role: 'staff' as const,
      isActive: true,
    },
  ];

  for (const userData of initialUsers) {
    // Cek apakah user sudah ada
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.username, userData.username));

    if (existingUser.length === 0) {
      await db.insert(users).values(userData);
      console.log(`✅ User dibuat: ${userData.username} (Password: ${userData.password})`);
    } else {
      console.log(`⚠️ User sudah ada: ${userData.username}, melewati...`);
    }
  }

  console.log('🏁 Seeding selesai!');
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seeding gagal:', err);
  process.exit(1);
});