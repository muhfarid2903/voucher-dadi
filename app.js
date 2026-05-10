// === KONFIGURASI ===
// Isi dua nilai ini setelah membuat project di Supabase.
// Cara dapat: Supabase Dashboard → Project Settings → API
const SUPABASE_URL = 'https://bsdaplbfrctmmutaojik.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJzZGFwbGJmcmN0bW11dGFvamlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxMDg2NTAsImV4cCI6MjA5MjY4NDY1MH0.q_JfVHRg2JxqqAseBvAVWWYYzCwfpUhPCocW64y31G8';

const HARGA_SETOR = 1500;
// === AKHIR KONFIGURASI ===


const expanded = new Set();

const elApp = document.getElementById('app');
const elBelumSiap = document.getElementById('app-belum-siap');

if (SUPABASE_URL.startsWith('GANTI') || SUPABASE_ANON_KEY.startsWith('GANTI')) {
  elBelumSiap.classList.remove('hidden');
} else {
  elApp.classList.remove('hidden');
  jalankan();
}

function jalankan() {
  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const elStatus = document.getElementById('status-koneksi');
  const elDaftar = document.getElementById('daftar');
  const elTanggal = document.getElementById('input-tanggal');
  const elJumlah = document.getElementById('input-jumlah');
  const elBtn = document.getElementById('btn-tambah');

  setTanggalHariIni();
  muat();
  langgankanRealtime();

  elBtn.addEventListener('click', tambah);
  elJumlah.addEventListener('keydown', e => {
    if (e.key === 'Enter') tambah();
  });

  function setTanggalHariIni() {
    const t = new Date();
    const yyyy = t.getFullYear();
    const mm = String(t.getMonth() + 1).padStart(2, '0');
    const dd = String(t.getDate()).padStart(2, '0');
    elTanggal.value = `${yyyy}-${mm}-${dd}`;
  }

  function tanggalHariIni() {
    const t = new Date();
    const yyyy = t.getFullYear();
    const mm = String(t.getMonth() + 1).padStart(2, '0');
    const dd = String(t.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  async function muat() {
    const [pengambilanRes, pembayaranRes] = await Promise.all([
      supabase
        .from('pengambilan_dadi')
        .select('*')
        .order('tanggal', { ascending: false })
        .order('dicatat_pada', { ascending: false }),
      supabase
        .from('pembayaran_dadi')
        .select('*')
        .order('tanggal', { ascending: false })
        .order('dicatat_pada', { ascending: false })
    ]);

    if (pengambilanRes.error || pembayaranRes.error) {
      const err = pengambilanRes.error || pembayaranRes.error;
      elDaftar.innerHTML = `<div class="kosong">Gagal memuat: ${escapeHtml(err.message)}</div>`;
      elStatus.classList.add('gagal');
      return;
    }

    const byPengambilan = new Map();
    for (const p of pembayaranRes.data || []) {
      if (!byPengambilan.has(p.pengambilan_id)) byPengambilan.set(p.pengambilan_id, []);
      byPengambilan.get(p.pengambilan_id).push(p);
    }

    const items = (pengambilanRes.data || []).map(pg => {
      const riwayat = byPengambilan.get(pg.id) || [];
      const dibayar = riwayat.reduce((s, r) => s + r.jumlah, 0);
      return { ...pg, dibayar, riwayat };
    });

    render(items);
  }

  function langgankanRealtime() {
    const setStatus = (status) => {
      if (status === 'SUBSCRIBED') {
        elStatus.classList.add('tersambung');
        elStatus.classList.remove('gagal');
        elStatus.title = 'Tersambung — sinkron otomatis';
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        elStatus.classList.add('gagal');
        elStatus.classList.remove('tersambung');
        elStatus.title = 'Sinkronisasi terputus';
      }
    };

    supabase
      .channel('pengambilan-dadi-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'pengambilan_dadi' },
        () => muat()
      )
      .subscribe(setStatus);

    supabase
      .channel('pembayaran-dadi-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'pembayaran_dadi' },
        () => muat()
      )
      .subscribe(setStatus);
  }

  async function tambah() {
    const tanggal = elTanggal.value;
    const jumlah = parseInt(elJumlah.value, 10);
    if (!tanggal || !jumlah || jumlah < 1) {
      alert('Isi tanggal dan jumlah voucher dengan benar.');
      return;
    }
    elBtn.disabled = true;
    elBtn.textContent = 'Menyimpan...';

    const { error } = await supabase
      .from('pengambilan_dadi')
      .insert({ tanggal, jumlah });

    elBtn.disabled = false;
    elBtn.textContent = '+ Catat Pengambilan';

    if (error) {
      alert('Gagal menyimpan: ' + error.message);
      return;
    }
    elJumlah.value = '';
    elJumlah.focus();
  }

  async function tambahBayar(pengambilanId, sisa) {
    const defaultVal = sisa > 0 ? String(sisa) : '';
    const input = prompt('Jumlah voucher yang dibayar:', defaultVal);
    if (input === null) return;
    const jumlah = parseInt(input, 10);
    if (!jumlah || jumlah < 1) {
      alert('Jumlah harus angka lebih dari 0.');
      return;
    }
    if (sisa > 0 && jumlah > sisa) {
      if (!confirm(`Jumlah (${jumlah}) melebihi sisa (${sisa}). Tetap simpan?`)) return;
    }
    const { error } = await supabase
      .from('pembayaran_dadi')
      .insert({ pengambilan_id: pengambilanId, tanggal: tanggalHariIni(), jumlah });
    if (error) alert('Gagal menyimpan pembayaran: ' + error.message);
  }

  async function hapusBayar(id) {
    if (!confirm('Hapus pembayaran ini?')) return;
    const { error } = await supabase.from('pembayaran_dadi').delete().eq('id', id);
    if (error) alert('Gagal menghapus pembayaran: ' + error.message);
  }

  async function hapus(id) {
    if (!confirm('Hapus pengambilan ini beserta riwayat pembayarannya? Tidak bisa dibatalkan.')) return;
    const { error } = await supabase.from('pengambilan_dadi').delete().eq('id', id);
    if (error) alert('Gagal menghapus: ' + error.message);
  }

  function toggleRiwayat(id) {
    if (expanded.has(id)) expanded.delete(id);
    else expanded.add(id);
    muat();
  }

  function render(items) {
    const ringkasan = hitungRingkasan(items);
    document.getElementById('total-voucher').textContent = ringkasan.totalVoucher;
    document.getElementById('total-setoran').textContent = rupiah(ringkasan.totalSetoran);
    document.getElementById('voucher-belum').textContent = ringkasan.voucherBelumDibayar;
    document.getElementById('piutang').textContent = rupiah(ringkasan.belumDibayar);

    if (!items.length) {
      elDaftar.innerHTML = '<div class="kosong">Belum ada catatan</div>';
      return;
    }

    elDaftar.innerHTML = '';
    for (const item of items) {
      elDaftar.appendChild(buatBaris(item));
    }
  }

  function buatBaris(item) {
    const sisa = Math.max(0, item.jumlah - item.dibayar);
    const lunas = item.dibayar >= item.jumlah;
    const cicil = item.dibayar > 0 && !lunas;

    const wrap = document.createElement('div');
    wrap.className = 'item-wrap';

    const div = document.createElement('div');
    div.className = 'item' + (lunas ? ' lunas' : '');

    const info = document.createElement('div');
    info.className = 'item-info';

    const tgl = document.createElement('div');
    tgl.className = 'item-tanggal';
    tgl.textContent = tanggalIndonesia(item.tanggal);
    if (lunas) {
      const badge = document.createElement('span');
      badge.className = 'badge badge-lunas';
      badge.textContent = 'Lunas';
      tgl.appendChild(badge);
    } else if (cicil) {
      const badge = document.createElement('span');
      badge.className = 'badge badge-cicil';
      badge.textContent = 'Cicil';
      tgl.appendChild(badge);
    }

    const total = item.jumlah * HARGA_SETOR;
    const detail = document.createElement('div');
    detail.className = 'item-detail';
    detail.textContent = `${item.jumlah} voucher · ${rupiah(total)}`;

    const status = document.createElement('div');
    status.className = 'item-status';
    if (lunas) {
      status.textContent = `${item.dibayar} dari ${item.jumlah} dibayar`;
    } else {
      status.textContent = `${item.dibayar} dari ${item.jumlah} dibayar · sisa ${sisa} (${rupiah(sisa * HARGA_SETOR)})`;
    }

    const actions = document.createElement('div');
    actions.className = 'item-actions';

    const btnBayar = document.createElement('button');
    btnBayar.className = 'btn-bayar';
    btnBayar.textContent = lunas ? 'Bayar lagi' : `+ Bayar ${sisa}`;
    btnBayar.addEventListener('click', () => tambahBayar(item.id, sisa));
    actions.appendChild(btnBayar);

    if (item.riwayat.length > 0) {
      const btnRiw = document.createElement('button');
      btnRiw.className = 'btn-riwayat';
      const sym = expanded.has(item.id) ? '▴' : '▾';
      btnRiw.textContent = `Riw${sym} (${item.riwayat.length})`;
      btnRiw.addEventListener('click', () => toggleRiwayat(item.id));
      actions.appendChild(btnRiw);
    }

    info.appendChild(tgl);
    info.appendChild(detail);
    info.appendChild(status);
    info.appendChild(actions);

    const btnHapus = document.createElement('button');
    btnHapus.className = 'item-hapus';
    btnHapus.innerHTML = '&times;';
    btnHapus.title = 'Hapus pengambilan';
    btnHapus.addEventListener('click', () => hapus(item.id));

    div.appendChild(info);
    div.appendChild(btnHapus);
    wrap.appendChild(div);

    if (expanded.has(item.id) && item.riwayat.length > 0) {
      const list = document.createElement('div');
      list.className = 'riwayat';
      for (const r of item.riwayat) {
        const row = document.createElement('div');
        row.className = 'riwayat-item';
        const teks = document.createElement('span');
        teks.textContent = `${tanggalIndonesia(r.tanggal)} — ${r.jumlah} voucher`;
        const x = document.createElement('button');
        x.className = 'riwayat-hapus';
        x.innerHTML = '&times;';
        x.title = 'Hapus pembayaran';
        x.addEventListener('click', () => hapusBayar(r.id));
        row.appendChild(teks);
        row.appendChild(x);
        list.appendChild(row);
      }
      wrap.appendChild(list);
    }

    return wrap;
  }

  function hitungRingkasan(items) {
    let totalVoucher = 0, totalSetoran = 0, belumDibayar = 0, voucherBelumDibayar = 0;
    for (const item of items) {
      const total = item.jumlah * HARGA_SETOR;
      totalVoucher += item.jumlah;
      totalSetoran += total;
      const sisa = Math.max(0, item.jumlah - item.dibayar);
      voucherBelumDibayar += sisa;
      belumDibayar += sisa * HARGA_SETOR;
    }
    return { totalVoucher, totalSetoran, belumDibayar, voucherBelumDibayar };
  }
}

function rupiah(angka) {
  return 'Rp ' + (angka || 0).toLocaleString('id-ID');
}

function tanggalIndonesia(yyyymmdd) {
  if (!yyyymmdd) return '';
  const [y, m, d] = String(yyyymmdd).split('-');
  const bulan = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
  return `${parseInt(d)} ${bulan[parseInt(m) - 1]} ${y}`;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  })[c]);
}
