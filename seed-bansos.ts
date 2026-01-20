import { db } from './src/db';
import { jenisArsip } from './src/db/schema';

async function main() {
  console.log('🚀 Sedang membuat schema Super Besar (20 Kolom)...');

  // Konfigurasi 20 Kolom dengan Grouping
  const bansosSchema = [
    // --- GROUP 1: IDENTITAS KEPALA KELUARGA (5 Kolom) ---
    { id: "nik", label: "NIK (KTP)", type: "text", required: true, group: "Identitas Personal" },
    { id: "no_kk", label: "Nomor KK", type: "text", required: true, group: "Identitas Personal" },
    { id: "nama_lengkap", label: "Nama Lengkap", type: "text", required: true, group: "Identitas Personal" },
    { id: "tgl_lahir", label: "Tanggal Lahir", type: "date", required: true, group: "Identitas Personal" },
    { id: "ibu_kandung", label: "Nama Ibu Kandung", type: "text", required: false, group: "Identitas Personal" },

    // --- GROUP 2: ALAMAT & KONTAK (4 Kolom) ---
    { id: "alamat_jalan", label: "Alamat / Jalan", type: "text", required: true, group: "Lokasi Domisili" },
    { id: "rt_rw", label: "RT / RW", type: "text", required: true, group: "Lokasi Domisili" },
    { id: "kelurahan", label: "Kelurahan", type: "text", required: true, group: "Lokasi Domisili" },
    { id: "no_hp", label: "No. HP / WA", type: "text", required: true, group: "Lokasi Domisili" },

    // --- GROUP 3: KONDISI EKONOMI (5 Kolom) ---
    { id: "pekerjaan", label: "Jenis Pekerjaan", type: "text", required: true, group: "Ekonomi & Aset" },
    { id: "penghasilan", label: "Penghasilan Rata-rata", type: "number", required: true, group: "Ekonomi & Aset" },
    { id: "status_rumah", label: "Status Rumah", type: "text", required: true, group: "Ekonomi & Aset" }, // Milik Sendiri/Sewa
    { id: "luas_lantai", label: "Luas Lantai (m2)", type: "number", required: false, group: "Ekonomi & Aset" },
    { id: "jenis_lantai", label: "Jenis Lantai", type: "text", required: false, group: "Ekonomi & Aset" }, // Keramik/Tanah

    // --- GROUP 4: TANGGUNGAN (3 Kolom) ---
    { id: "jml_tanggungan", label: "Jumlah Tanggungan", type: "number", required: true, group: "Keluarga" },
    { id: "anak_sekolah", label: "Anak Sekolah", type: "number", required: false, group: "Keluarga" },
    { id: "lansia_serumah", label: "Lansia Serumah", type: "number", required: false, group: "Keluarga" },

    // --- GROUP 5: VERIFIKASI PETUGAS (3 Kolom) ---
    { id: "nama_surveyor", label: "Nama Petugas Survey", type: "text", required: true, group: "Verifikasi Lapangan" },
    { id: "tgl_survey", label: "Tanggal Survey", type: "date", required: true, group: "Verifikasi Lapangan" },
    { id: "skor_kemiskinan", label: "Skor Akhir", type: "number", required: true, group: "Verifikasi Lapangan" },
  ];

  await db.insert(jenisArsip).values({
    nama: 'Verifikasi Bansos 2026',
    kode: 'BANSOS-26',
    deskripsi: 'Data detail penerima bantuan sosial untuk verifikasi lapangan.',
    schemaConfig: bansosSchema, // Drizzle SQLite otomatis stringify ini
    isActive: true
  });

  console.log('✅ Berhasil! Jenis Arsip "Verifikasi Bansos 2026" telah ditambahkan.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});