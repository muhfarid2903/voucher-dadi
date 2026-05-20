# Catatan Voucher

Aplikasi web untuk mencatat pengambilan voucher titipan, dengan sinkronisasi
otomatis antar HP/laptop.

- Frontend: HTML + CSS + JavaScript (statis, di-host di GitHub Pages)
- Backend: Supabase (PostgreSQL + realtime)
- Domain: `dadi.balanglompo.com`
- Biaya: Rp 0 (selain biaya domain Anda sendiri)

## Cara Pasang

Total waktu sekitar 15 menit. Lakukan urut dari atas ke bawah.

### A. Siapkan Backend (Supabase)

1. Buka https://supabase.com → **Start your project** → login pakai GitHub.
2. Klik **New project**:
   - **Name**: `catatan-voucher` (bebas)
   - **Database Password**: bikin password kuat lalu simpan
   - **Region**: pilih **Southeast Asia (Singapore)** supaya cepat dari Indonesia
   - Klik **Create new project**, tunggu sekitar 1-2 menit sampai siap
3. Setelah project siap, di sidebar kiri klik ikon **SQL Editor** → **New query**.
4. Buka file `supabase-setup.sql` dari repo ini, salin **semua isinya**, tempel di SQL Editor, klik **Run**.
   - Akan muncul "Success. No rows returned" — itu artinya berhasil.
5. Ambil kunci API: sidebar kiri → **Project Settings** (ikon roda gigi) → **API**.
   - Salin nilai **Project URL** (contoh: `https://xxxxx.supabase.co`)
   - Salin nilai **anon public** key (string panjang yang dimulai `eyJ...`)

### B. Konfigurasi Aplikasi

1. Buka file `app.js`.
2. Ganti dua baris di paling atas:
   ```js
   const SUPABASE_URL = 'https://xxxxx.supabase.co';
   const SUPABASE_ANON_KEY = 'eyJhbGc...';
   ```
3. Simpan.

> **Catatan keamanan:** anon key memang aman untuk dipasang di kode publik —
> ini sudah didesain Supabase. Yang melindungi data adalah RLS policy di
> `supabase-setup.sql`. Walau begitu, **jangan share URL aplikasi (`dadi.balanglompo.com`)
> ke sembarang orang**, karena siapapun yang punya URL bisa baca/tulis data.

### C. Push ke GitHub

1. Bikin repo baru di https://github.com/new
   - **Repository name**: `catatan-voucher` (bebas)
   - **Public** (wajib kalau pakai akun GitHub gratis untuk Pages)
   - **JANGAN** centang "Add a README file" (sudah ada di sini)
2. Di terminal, dari folder ini:
   ```bash
   cd "/Users/muhammadfarid/Downloads/catatan voucher"
   git init
   git add .
   git commit -m "Versi awal catatan voucher"
   git branch -M main
   git remote add origin https://github.com/USERNAME/catatan-voucher.git
   git push -u origin main
   ```
   Ganti `USERNAME` dengan username GitHub Anda.

### D. Aktifkan GitHub Pages

1. Di repo GitHub Anda → **Settings** → **Pages** (sidebar kiri).
2. **Source**: pilih **Deploy from a branch**.
3. **Branch**: pilih **main**, folder `/ (root)`, klik **Save**.
4. Tunggu 1-2 menit. Refresh halaman — di atas akan muncul:
   `Your site is live at https://USERNAME.github.io/catatan-voucher/`
5. Coba buka URL itu — aplikasi seharusnya sudah jalan.

### E. Pasang Custom Domain (`dadi.balanglompo.com`)

1. **Setting DNS di pengelola domain `balanglompo.com`** (Cloudflare/Niagahoster/dll):
   - Tambah record baru:
     - **Type**: `CNAME`
     - **Name** / **Host**: `dadi`
     - **Value** / **Target**: `USERNAME.github.io` (ganti USERNAME dengan username GitHub Anda — tanpa `https://`, tanpa `/`)
     - **TTL**: Auto (atau 3600)
   - Simpan.
   - Kalau pakai Cloudflare: pastikan ikon awan **abu-abu (DNS only)**, jangan oranye.

2. **Tunggu DNS propagate** (1 menit – beberapa jam, biasanya cepat).
   Cek dengan: `dig dadi.balanglompo.com` atau buka https://dnschecker.org

3. Di GitHub: **Settings → Pages → Custom domain** → isi `dadi.balanglompo.com` → **Save**.
   - File `CNAME` di repo sudah ada, jadi GitHub akan langsung mengenali.
4. Centang **Enforce HTTPS** setelah sertifikat selesai dibuat (otomatis, bisa 5-10 menit).
5. Buka https://dadi.balanglompo.com — selesai.

### F. Pasang ke Layar HP (Optional)

Supaya berasa seperti aplikasi:
- **Android (Chrome)**: ⋮ → **Add to Home screen**
- **iPhone (Safari)**: tombol Share → **Add to Home Screen**

Bagikan URL ke pihak penitipan supaya mereka juga pasang.

## Cara Pakai

- **Banner alur**: di atas halaman ada banner `warkopsaja → dadi · setor Rp 1.500/voucher` yang menjelaskan arah voucher: suplier (`warkopsaja`) men-drop voucher ke dealer (`dadi`), lalu dealer setor balik Rp 1.500 per voucher. Tiap baris riwayat juga menampilkan label kecil `warkopsaja → dadi`.
- **Nama operator**: tombol **👤** di pojok kanan atas. Tekan → isi/ubah nama, lalu nama itu tercatat di setiap baris Histori Perubahan. Boleh dikosongkan (tidak dipaksa) — kalau kosong, histori tercatat sebagai "(tanpa nama)" dan tombol kembali menampilkan "Operator". Nama disimpan lokal di HP/laptop ini saja (localStorage), tidak ikut tersinkron.
- **Histori Perubahan**: card di bawah Riwayat (default tertutup, tekan judulnya untuk buka). Mencatat otomatis tiap aksi tambah pengambilan / catat pembayaran / hapus pembayaran / hapus pengambilan, lengkap dengan waktu (jam.menit) dan nama operator. Maks 100 baris terbaru, tersinkron realtime antar perangkat.
- **Tambah pengambilan**: pilih tanggal, isi jumlah voucher, tekan tombol catat.
- **Catat pembayaran**: tekan tombol biru **+ Bayar** pada baris pengambilan. Default = sisa yang belum dibayar — kosongkan / ganti kalau bayar sebagian (cicil). Bisa diulang sampai lunas.
- **Lihat riwayat pembayaran**: tekan tombol **Riw▾** di baris pengambilan untuk lihat tiap setoran. Tombol **×** di kanan tiap setoran untuk menghapus pembayaran tertentu (misalnya salah catat).
- **Status**: badge hijau **Lunas** kalau total pembayaran ≥ jumlah pengambilan; badge kuning **Cicil** kalau sebagian; tanpa badge kalau belum ada pembayaran.
- **Hapus pengambilan**: tombol × di kanan baris pengambilan — ikut menghapus seluruh riwayat pembayarannya.
- **Sinkron**: otomatis. Saat pihak penitipan menambah/mengubah catatan dari HP-nya, layar Anda update sendiri (asal browser tetap terbuka). Lampu hijau di pojok kanan atas = tersambung.

## Mengubah

- **Harga setoran** (default Rp 1.500): edit `HARGA_SETOR` di `app.js`.
- **Nama pihak alur** (suplier/dealer): edit `SUPLIER` dan `DEALER` di blok konfigurasi `app.js`. Banner dan label di tiap baris ikut berubah otomatis.
- **Tampilan/warna**: edit `style.css`.
- **Setelah perubahan**: `git add . && git commit -m "update" && git push`. GitHub Pages otomatis deploy dalam 1-2 menit.

> **⚠️ Penting untuk instalasi lama:** fitur Histori Perubahan butuh tabel baru `histori_dadi`. Kalau Supabase Anda sudah dibuat sebelum fitur ini ada, **jalankan ulang seluruh isi `supabase-setup.sql`** di SQL Editor (skrip ini idempotent — aman dijalankan berkali-kali, tidak menghapus data lama). Kalau langkah ini dilewati, panel Histori akan menampilkan error "Gagal memuat histori".

## Struktur File

```
.
├── index.html              halaman utama
├── app.js                  logika + integrasi Supabase
├── style.css               tampilan
├── supabase-setup.sql      skema database (jalankan sekali di Supabase)
├── CNAME                   konfigurasi custom domain GitHub Pages
├── .gitignore
└── README.md
```
