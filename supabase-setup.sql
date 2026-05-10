-- Skema database untuk Catatan Voucher (Dadi)
-- Jalankan di Supabase: SQL Editor → New Query → tempel & Run.
-- Aman dijalankan ulang (idempotent) — akan migrasi data lama otomatis.

-- =========================================================
-- 1. Tabel pengambilan
-- =========================================================
create table if not exists pengambilan_dadi (
  id uuid primary key default gen_random_uuid(),
  tanggal date not null,
  jumlah integer not null check (jumlah > 0),
  dicatat_pada timestamptz not null default now()
);

create index if not exists pengambilan_dadi_tanggal_idx on pengambilan_dadi (tanggal desc);

alter table pengambilan_dadi enable row level security;

drop policy if exists "akses_publik" on pengambilan_dadi;
create policy "akses_publik" on pengambilan_dadi
  for all
  to anon
  using (true)
  with check (true);

-- =========================================================
-- 2. Tabel pembayaran (cicilan)
-- =========================================================
create table if not exists pembayaran_dadi (
  id uuid primary key default gen_random_uuid(),
  pengambilan_id uuid not null references pengambilan_dadi(id) on delete cascade,
  tanggal date not null,
  jumlah integer not null check (jumlah > 0),
  dicatat_pada timestamptz not null default now()
);

create index if not exists pembayaran_dadi_pengambilan_id_idx on pembayaran_dadi (pengambilan_id);

alter table pembayaran_dadi enable row level security;

drop policy if exists "akses_publik" on pembayaran_dadi;
create policy "akses_publik" on pembayaran_dadi
  for all
  to anon
  using (true)
  with check (true);

-- =========================================================
-- 3. Realtime publication (cek dulu supaya re-run aman)
-- =========================================================
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'pengambilan_dadi'
  ) then
    execute 'alter publication supabase_realtime add table pengambilan_dadi';
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'pembayaran_dadi'
  ) then
    execute 'alter publication supabase_realtime add table pembayaran_dadi';
  end if;
end $$;

-- =========================================================
-- 4. Migrasi data lama: sudah_dibayar (boolean) → row di pembayaran_dadi
-- =========================================================
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'pengambilan_dadi'
      and column_name = 'sudah_dibayar'
  ) then
    -- Insert satu pembayaran penuh untuk tiap pengambilan yang sebelumnya
    -- ditandai lunas, pakai tanggal pengambilan sebagai tanggal pembayaran.
    insert into pembayaran_dadi (pengambilan_id, tanggal, jumlah)
    select id, tanggal, jumlah
    from pengambilan_dadi
    where sudah_dibayar = true;

    alter table pengambilan_dadi drop column sudah_dibayar;
  end if;
end $$;
