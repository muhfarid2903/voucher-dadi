-- Skema database untuk Catatan Voucher (Dadi)
-- Jalankan di Supabase: SQL Editor → New Query → tempel & Run
-- Tabel ini terpisah dari `pengambilan` milik aplikasi anci.

create table if not exists pengambilan_dadi (
  id uuid primary key default gen_random_uuid(),
  tanggal date not null,
  jumlah integer not null check (jumlah > 0),
  sudah_dibayar boolean not null default false,
  dicatat_pada timestamptz not null default now()
);

create index if not exists pengambilan_dadi_tanggal_idx on pengambilan_dadi (tanggal desc);

-- Aktifkan Row Level Security
alter table pengambilan_dadi enable row level security;

-- Izinkan akses publik (anyone with anon key bisa baca/tulis)
-- Keamanan: jangan share URL aplikasi ke sembarang orang
drop policy if exists "akses_publik" on pengambilan_dadi;
create policy "akses_publik" on pengambilan_dadi
  for all
  to anon
  using (true)
  with check (true);

-- Aktifkan realtime supaya perubahan langsung muncul di semua HP
alter publication supabase_realtime add table pengambilan_dadi;
