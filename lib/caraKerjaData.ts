export const TRACKS = [
  {
    kicker: 'Jalur pertama', title: 'Perkiraan harga besok', dot: 'var(--up)',
    steps: [
      { n: '1', title: 'Menyiapkan data', body: 'Harga 180 hari terakhir dirapikan, lalu diubah ke bentuk yang bisa dibaca model: perubahan harian, rata-rata bergerak, dan beberapa indikator umum.' },
      { n: '2', title: 'Tiga model menghitung sendiri-sendiri', body: 'LSTM, GRU, dan XGBoost masing-masing menghasilkan satu angka perkiraan. Ketiganya tidak saling melihat hasil yang lain.' },
      { n: '3', title: 'Menggabungkan dengan bobot', body: 'Ketiga angka dirata-rata, tetapi model yang belakangan lebih sering tepat diberi bobot lebih besar. Bobot dihitung ulang setiap hari dari kesalahan 30 hari terakhir.' },
    ],
    output: 'Satu angka perkiraan untuk besok, disertai rentang kemungkinan berdasarkan rata-rata kesalahan pengujian.',
  },
  {
    kicker: 'Jalur kedua', title: 'Ukuran risiko', dot: 'var(--risk)',
    steps: [
      { n: '1', title: 'Menghitung untung rugi harian', body: 'Nilai portofolio dihitung ulang untuk setiap hari pada 180 hari terakhir, lalu selisih antar hari dicatat sebagai untung atau rugi.' },
      { n: '2', title: 'Mengurutkan dari terburuk', body: 'Seluruh hasil harian diurutkan. Nilai pada peringkat 5 persen terburuk menjadi batas kerugian, dan rata-rata di bawah batas itu menjadi kerugian bila batas terlampaui.' },
      { n: '3', title: 'Menelusuri penurunan terdalam', body: 'Nilai portofolio ditelusuri dari puncak ke titik terendah sesudahnya, untuk mengetahui penurunan terburuk yang pernah terjadi.' },
    ],
    output: 'Tiga angka dalam Rupiah: batas kerugian, kerugian bila batas terlampaui, dan penurunan terdalam.',
  },
];

export const FAQS = [
  { q: 'Mengapa perkiraannya bisa meleset?', a: 'Model belajar dari pola harga masa lalu. Ketika terjadi hal yang belum pernah ada dalam data itu, misalnya perubahan aturan atau kabar besar yang mendadak, model tidak memiliki rujukan dan perkiraannya bisa jauh dari kenyataan. Pada pengujian, rata-rata kesalahannya sekitar 2 sampai 4 persen tergantung asetnya.' },
  { q: 'Mengapa bobot ketiga model berubah setiap hari?', a: 'Tidak ada satu model yang selalu unggul. Ada masa harga bergerak dalam tren jelas, dan ada masa harga naik turun tanpa arah. Model yang cocok untuk keadaan pertama belum tentu cocok untuk yang kedua. Dengan menimbang ulang setiap hari berdasarkan ketepatan 30 hari terakhir, sistem mengikuti keadaan pasar yang sedang berlangsung.' },
  { q: 'Apakah angka risiko berarti kerugian saya tidak akan melebihi itu?', a: 'Tidak. Batas kerugian adalah nilai yang jarang dilewati, bukan yang tidak mungkin dilewati. Dari 100 hari, sekitar 5 hari akan melewatinya, dan pada hari-hari itu kerugiannya bisa jauh lebih besar. Karena itu ditampilkan juga rata-rata kerugian saat batas terlampaui.' },
  { q: 'Dari mana skor sentimen berasal?', a: 'Skor 0 sampai 100 dihitung dari beberapa sumber publik: seberapa besar pergerakan harga, volume perdagangan, dan tingkat gejolaknya. Skor rendah menandakan pelaku pasar sedang takut, skor tinggi menandakan terlalu percaya diri. Skor ini menggambarkan suasana pasar, bukan arah harga.' },
  { q: 'Apakah data saya disimpan?', a: 'Platform ini tidak meminta pendaftaran akun dan tidak menyimpan angka yang Anda masukkan pada kalkulator. Perhitungan berlangsung selama halaman terbuka, dan hilang saat halaman ditutup.' },
  { q: 'Mengapa tidak ada tombol beli atau jual?', a: 'Platform ini dibangun untuk penelitian mengenai keterpahaman keluaran model, bukan sebagai layanan keuangan. Menambahkan fasilitas transaksi akan mengubah sifatnya dan menimbulkan kewajiban perizinan yang berada di luar lingkup penelitian ini.' },
];

export const LIMITS = [
  { title: 'Hanya sehari ke depan', body: 'Model dilatih untuk memperkirakan harga penutupan besok. Perkiraan untuk seminggu atau sebulan ke depan tidak tersedia, karena ketepatannya menurun tajam seiring bertambahnya jarak waktu.' },
  { title: 'Tiga aset saja', body: 'Sistem diuji pada BTC, ETH, dan BNB. Aset lain memiliki pola dan tingkat gejolak berbeda, sehingga model ini belum tentu berlaku untuknya.' },
  { title: 'Tidak membaca berita', body: 'Masukan model hanya berupa angka harga dan turunannya. Kabar, kebijakan, dan peristiwa di luar itu tidak diperhitungkan, padahal keduanya sering menjadi penyebab pergerakan terbesar.' },
];
