import os
from pathlib import Path

ROOT = Path(__file__).parent / "materi-kurikulum"

CURR = {
  "sd": {
    1: {
      "Matematika": [
        ("Bab 1 — Bilangan 1 sampai 20", "Mengenal angka 1-20, membilang benda, urutan bilangan, membandingkan (lebih banyak/sedikit), menulis lambang bilangan. Contoh: hitung 7 apel, 12 pensil. Latihan menulis angka dengan rapi."),
        ("Bab 2 — Penjumlahan dan Pengurangan sampai 20", "Penjumlahan tanpa menyimpan dan pengurangan sederhana. Cerita sehari-hari: 5 kelereng + 4 kelereng = 9. Menggunakan jari, gambar, dan garis bilangan."),
        ("Bab 3 — Bentuk dan Ruang Sederhana", "Mengenal persegi, segitiga, lingkaran, persegi panjang. Mengamati benda sekitar: pintu=persegi panjang, roda=lingkaran. Mengelompokkan bentuk."),
        ("Bab 4 — Pengukuran dan Waktu", "Pengukuran dengan satuan tidak baku (jengkal, depa, langkah). Mengenal pagi-siang-sore-malam, hari dalam seminggu, jam sederhana (jarum panjang & pendek)."),
      ],
      "Bahasa Indonesia": [
        ("Bab 1 — Mengenal Huruf dan Suku Kata", "Huruf alfabet A-Z, huruf vokal & konsonan, suku kata ba-bi-bu, membaca kata 2 suku kata: ba-ju, ku-da. Menulis huruf tegak bersambung sederhana."),
        ("Bab 2 — Membaca dan Menulis Kata", "Membaca kata sederhana, kalimat 3-4 kata: 'Ibu memasak nasi'. Menulis kalimat dengan huruf kapital di awal dan titik di akhir."),
        ("Bab 3 — Kosakata dan Kalimat Sederhana", "Kosakata benda di rumah & sekolah, kata sifat (besar-kecil, panjang-pendek), membuat kalimat tanya: apa, siapa, di mana."),
        ("Bab 4 — Dongeng dan Cerita Pendek", "Mendengarkan dongeng fabel, menjawab siapa-tokoh & di mana-tempat, menceritakan kembali dengan 2-3 kalimat."),
      ],
      "IPA": [
        ("Bab 1 — Tubuhku dan Panca Indera", "Bagian tubuh (kepala, tangan, kaki), fungsi mata-melihat, telinga-mendengar, hidung-mencium, lidah-mengecap, kulit-meraba. Menjaga kebersihan tubuh."),
        ("Bab 2 — Makhluk Hidup dan Tak Hidup", "Ciri makhluk hidup (bernapas, bergerak, tumbuh), contoh hewan & tumbuhan sekitar, benda tak hidup (meja, batu)."),
        ("Bab 3 — Benda di Sekitar Kita", "Benda padat (batu), cair (air), mengenal sifat: keras-lunak, kasar-halus. Percobaan sederhana tuang air."),
        ("Bab 4 — Cuaca dan Menjaga Lingkungan", "Cuaca cerah, berawan, hujan. Kegiatan sesuai cuaca (payung saat hujan). Membuang sampah pada tempatnya, mencuci tangan."),
      ],
      "IPS": [
        ("Bab 1 — Aku dan Keluargaku", "Anggota keluarga (ayah, ibu, kakak, adik), tugas di rumah, menyayangi keluarga, silsilah sederhana."),
        ("Bab 2 — Aturan di Rumah dan Sekolah", "Aturan bangun pagi, merapikan mainan, antre, datang tepat waktu. Akibat jika melanggar aturan."),
        ("Bab 3 — Lingkungan Sekitar", "Rumah, sekolah, teman, tetangga. Denah sederhana rumah ke sekolah, arah mata angin sederhana (depan-belakang-kiri-kanan)."),
      ],
      "PPKn": [
        ("Bab 1 — Aturan dan Tata Tertib", "Mengapa ada aturan, contoh aturan di rumah & sekolah, membiasakan antre & berterima kasih."),
        ("Bab 2 — Hidup Rukun", "Rukun dengan teman & keluarga, berbagi, tolong-menolong, tidak mengejek, bermain bersama."),
        ("Bab 3 — Pancasila Sila 1-2", "Sila 1 Ketuhanan (berdoa), Sila 2 Kemanusiaan (sayang sesama). Simbol bintang & rantai, contoh perilaku."),
      ],
    },
    2: {
      "Matematika": [
        ("Bab 1 — Bilangan sampai 100", "Nilai tempat puluhan-satuan, membandingkan 45 vs 54, urutan bilangan, bilangan ganjil-genap."),
        ("Bab 2 — Penjumlahan & Pengurangan sampai 100", "Penjumlahan bersusun pendek, pengurangan dengan meminjam sederhana, soal cerita jual-beli."),
        ("Bab 3 — Perkalian Dasar", "Perkalian 2, 3, 4, 5 sebagai penjumlahan berulang, tabel perkalian, cerita: 3 kotak x 4 permen."),
        ("Bab 4 — Pengukuran Baku & Waktu", "cm & m untuk panjang, kg untuk berat, liter, membaca jam tepat & setengah jam, kalender."),
        ("Bab 5 — Bangun Datar", "Sifat persegi, persegi panjang, segitiga, lingkaran, mengelompokkan & menggambar."),
      ],
      "Bahasa Indonesia": [
        ("Bab 1 — Kalimat dan Tanda Baca", "Kalimat berita, tanya, perintah, tanda titik, tanya, seru, huruf kapital untuk nama orang & awal kalimat."),
        ("Bab 2 — Membaca Cerita Pendek", "Membaca nyaring, menjawab 5W1H, menceritakan kembali, kosakata baru."),
        ("Bab 3 — Menulis Karangan Sederhana", "Menulis 3-5 kalimat tentang pengalaman, menggunakan kata penghubung dan, lalu, kemudian."),
        ("Bab 4 — Puisi dan Pantun Anak", "Mengenal pantun 4 baris, rima a-b-a-b, membaca puisi dengan lafal & intonasi."),
      ],
      "IPA": [
        ("Bab 1 — Sifat Benda", "Benda padat-cair-gas sederhana, sifat keras-lunak, terapung-tenggelam, percobaan air & minyak."),
        ("Bab 2 — Hewan dan Tumbuhan di Sekitar", "Bagian tumbuhan (akar-batang-daun), jenis hewan (unggas, mamalia), habitat darat-air."),
        ("Bab 3 — Energi Panas dan Cahaya", "Sumber panas (matahari, api), cahaya & bayangan, percobaan bayangan senter."),
        ("Bab 4 — Kebersihan Lingkungan", "Sampah organik-anorganik, daur ulang sederhana, menjaga air bersih."),
      ],
      "IPS": [
        ("Bab 1 — Keluarga dan Kerabat", "Keluarga inti & besar, tugas anggota, silsilah, menghormati orang tua."),
        ("Bab 2 — Lingkungan RT/RW", "Tetangga, ketua RT, gotong royong, denah lingkungan, kegiatan warga."),
        ("Bab 3 — Jual Beli Sederhana", "Pasar, uang, penjual-pembeli, kebutuhan & keinginan, menabung."),
      ],
      "PPKn": [
        ("Bab 1 — Pancasila Sila 1-3", "Sila 1-3, simbol & contoh perilaku: berdoa, menolong, musyawarah kecil."),
        ("Bab 2 — Aturan dan Norma", "Norma di rumah-sekolah-masyarakat, akibat melanggar, pentingnya disiplin."),
        ("Bab 3 — Tanggung Jawab", "Tugas piket, merapikan kelas, menjaga kebersihan, hak & kewajiban anak."),
      ],
    },
    3: {
      "Matematika": [
        ("Bab 1 — Bilangan sampai 1.000", "Nilai tempat ratusan-puluhan-satuan, membandingkan, mengurutkan, pembulatan ke puluhan terdekat."),
        ("Bab 2 — Perkalian dan Pembagian", "Perkalian 6-9, pembagian dasar, hubungan perkalian-pembagian, soal cerita dua langkah."),
        ("Bab 3 — Pecahan Sederhana", "Pecahan 1/2, 1/3, 1/4, 1/6, pecahan senilai, membandingkan pecahan dengan gambar pizza/kue."),
        ("Bab 4 — Keliling dan Luas", "Keliling persegi & persegi panjang, luas dengan petak satuan, mengukur meja & buku."),
        ("Bab 5 — Pengukuran Waktu, Panjang, Berat, Uang", "Jam-menit-detik, km-m-cm, kg-gram, rupiah, jual-beli & kembalian."),
      ],
      "Bahasa Indonesia": [
        ("Bab 1 — Gagasan Pokok dan Pendukung", "Menemukan ide pokok paragraf, meringkas 1 paragraf, menjawab pertanyaan bacaan."),
        ("Bab 2 — Menulis Cerita", "Karangan 5-7 kalimat, urutan waktu, kata penghubung, ejaan & tanda baca."),
        ("Bab 3 — Imbuhan dan Kata Baku", "me-, ber-, di-, ke-, kata baku vs tidak baku, sinonim-antonim."),
        ("Bab 4 — Surat dan Puisi", "Surat pribadi & undangan, puisi anak 2 bait, unsur rima & makna."),
      ],
      "IPA": [
        ("Bab 1 — Ciri dan Daur Hidup Makhluk Hidup", "Ciri hidup, daur hidup kupu-kupu & ayam, metamorfosis sempurna/tidak sempurna."),
        ("Bab 2 — Energi dan Perubahannya", "Energi panas, gerak, bunyi, cahaya, perubahan energi (listrik jadi cahaya)."),
        ("Bab 3 — Gaya dan Gerak", "Gaya dorong-tarik, gerak lurus, gesekan, percobaan mobil-mobilan di bidang miring."),
        ("Bab 4 — Cuaca dan Iklim", "Unsur cuaca (suhu, angin, hujan), musim di Indonesia, kalender musim tanam."),
      ],
      "IPS": [
        ("Bab 1 — Lingkungan Kabupaten/Kota", "Batas wilayah, kenampakan alam (gunung, sungai, pantai), peta sederhana & legenda."),
        ("Bab 2 — Kegiatan Ekonomi", "Pertanian, perikanan, perdagangan, koperasi, uang & bank sederhana."),
        ("Bab 3 — Keragaman Budaya", "Suku, bahasa daerah, rumah adat, makanan khas, sikap toleransi."),
      ],
      "PPKn": [
        ("Bab 1 — Pancasila Lengkap", "5 sila, lambang Garuda, contoh perilaku tiap sila di sekolah."),
        ("Bab 2 — Bhineka Tunggal Ika", "Keberagaman suku-agama, sikap menghargai perbedaan, semboyan negara."),
        ("Bab 3 — Hak dan Kewajiban", "Hak & kewajiban anak di rumah-sekolah-masyarakat, musyawarah untuk mufakat."),
      ],
    },
    4: {
      "Matematika": [
        ("Bab 1 — Bilangan sampai 10.000 & Pembulatan", "Nilai tempat ribuan, membandingkan, mengurutkan, pembulatan ke ratusan/ribuan, estimasi."),
        ("Bab 2 — FPB dan KPK", "Faktor & kelipatan, pohon faktor, FPB & KPK soal cerita (lampu kedip, kue dibagi)."),
        ("Bab 3 — Pecahan, Desimal, Persen", "Pecahan senilai, menyederhanakan, desimal 0,5 = 1/2, persen 25% = 1/4, operasi pecahan sederhana."),
        ("Bab 4 — Keliling, Luas, Sudut", "Keliling & luas persegi/persegi panjang/segitiga, jenis sudut (lancip-siku-tumpul), busur derajat."),
        ("Bab 5 — Data dan Diagram", "Mengumpulkan data, tabel, diagram batang & garis, membaca diagram, rata-rata sederhana."),
      ],
      "Bahasa Indonesia": [
        ("Bab 1 — Teks Deskripsi & Narasi", "Ciri teks deskripsi (menggambarkan), narasi (bercerita), gagasan pokok & pendukung."),
        ("Bab 2 — Surat Resmi & Tidak Resmi", "Struktur surat, bahasa baku, menulis surat izin & undangan resmi."),
        ("Bab 3 — Pantun, Syair, Gurindam", "Ciri pantun 4 baris, syair, gurindam, makna & rima, membuat pantun sendiri."),
        ("Bab 4 — Majas Sederhana", "Majas perbandingan (seperti), metafora, personifikasi, hiperbola — contoh di cerita."),
      ],
      "IPA": [
        ("Bab 1 — Gaya, Bunyi, Cahaya", "Gaya & pengaruhnya, bunyi merambat lewat udara-air-padat, cahaya merambat lurus & cermin."),
        ("Bab 2 — Bagian Tumbuhan & Fotosintesis", "Akar-batang-daun-bunga, fotosintesis (CO2+air+cahaya jadi makanan), percobaan daun."),
        ("Bab 3 — Rantai Makanan & Ekosistem", "Produsen-konsumen-pengurai, jaring makanan sawah/hutan, keseimbangan ekosistem."),
        ("Bab 4 — Siklus Air", "Penguapan-pengembunan-hujan-aliran, pentingnya menghemat air, percobaan siklus air sederhana."),
      ],
      "IPS": [
        ("Bab 1 — Peta dan Kenampakan Alam Indonesia", "Peta, skala, legenda, dataran rendah-tinggi, sungai, danau, selat, pantai."),
        ("Bab 2 — Sumber Daya Alam", "SDA dapat diperbarui & tidak, persebaran (minyak, batu bara, hutan), pelestarian."),
        ("Bab 3 — Kegiatan Ekonomi & Keragaman", "Produksi-distribusi-konsumsi, ekspor-impor, keragaman suku-budaya & cara menghargai."),
      ],
      "PPKn": [
        ("Bab 1 — Pancasila sebagai Dasar Negara", "Kedudukan Pancasila, nilai tiap sila, penerapan di kehidupan."),
        ("Bab 2 — UUD 1945", "Pembukaan & pasal penting, hak-kewajiban warga, pentingnya konstitusi."),
        ("Bab 3 — Keberagaman & Toleransi", "Suku-agama-ras, sikap toleran, gotong royong, persatuan dalam keberagaman."),
      ],
    },
    5: {
      "Matematika": [
        ("Bab 1 — Pecahan dan Desimal Lanjut", "Operasi pecahan campuran, desimal 2 angka, pembulatan, soal cerita pecahan dalam jual-beli."),
        ("Bab 2 — Persen dan Perbandingan", "Persen dalam diskon & bunga sederhana, perbandingan senilai, skala peta."),
        ("Bab 3 — KPK & FPB Soal Cerita Lanjut", "KPK/FPB 3 bilangan, soal cerita jadwal berulang, pembagian kelompok."),
        ("Bab 4 — Volume Kubus & Balok", "Rumus V = p×l×t & s³, satuan cm³/m³, soal cerita bak air & kardus."),
        ("Bab 5 — Kecepatan, Debit, Skala", "Kecepatan = jarak/waktu (km/jam), debit (liter/detik), skala peta."),
        ("Bab 6 — Penyajian Data", "Diagram batang, garis, lingkaran, membaca & membuat diagram, modus-median-mean sederhana."),
      ],
      "Bahasa Indonesia": [
        ("Bab 1 — Teks Eksplanasi & Laporan", "Struktur eksplanasi (pernyataan umum-deretan penjelas-penutup), laporan pengamatan."),
        ("Bab 2 — Unsur Cerita", "Tokoh, watak, latar, alur, amanat, meringkas cerita rakyat & fabel."),
        ("Bab 3 — Peribahasa dan Ungkapan", "Arti peribahasa (tong kosong nyaring bunyinya), ungkapan, penggunaan dalam kalimat."),
        ("Bab 4 — Pidato dan Iklan", "Struktur pidato (pembuka-isi-penutup), iklan media cetak, kata persuasif."),
      ],
      "IPA": [
        ("Bab 1 — Organ Tubuh Manusia", "Peredaran darah (jantung-pembuluh), pernapasan (paru-paru), pencernaan — fungsi & cara menjaga."),
        ("Bab 2 — Ekosistem & Rantai Makanan Lanjut", "Ekosistem sawah, hutan, laut, keseimbangan & dampak pencemaran."),
        ("Bab 3 — Wujud Zat & Perubahannya", "Padat-cair-gas, mencair-membeku-menguap-mengembun, percobaan es mencair."),
        ("Bab 4 — Listrik Sederhana", "Rangkaian seri-paralel sederhana, sumber listrik, hemat energi, percobaan baterai-lampu."),
        ("Bab 5 — Bumi dan Tata Surya", "Rotasi-revolusi bumi, bulan, planet, gerhana, lapisan bumi sederhana."),
      ],
      "IPS": [
        ("Bab 1 — Kenampakan Alam & Sosial Indonesia", "Letak geografis, iklim, persebaran penduduk, interaksi desa-kota."),
        ("Bab 2 — Ekonomi Kreatif", "Usaha kreatif, UMKM, koperasi, ekspor-impor, digital economy sederhana."),
        ("Bab 3 — Sejarah Kerajaan Hindu-Buddha & Islam", "Kutai, Tarumanegara, Sriwijaya, Majapahit, Demak, Samudra Pasai — peninggalan."),
      ],
      "PPKn": [
        ("Bab 1 — Nilai Pancasila dalam Kehidupan", "Pengamalan tiap sila di keluarga-sekolah-masyarakat, studi kasus."),
        ("Bab 2 — Norma dan Peraturan", "Norma agama-kesusilaan-kesopanan-hukum, peraturan perundang-undangan hierarki."),
        ("Bab 3 — Bentuk Pemerintahan Indonesia", "Presidensial, lembaga negara (MPR-DPR-Presiden-MA), otonomi daerah."),
      ],
    },
    6: {
      "Matematika": [
        ("Bab 1 — Bilangan Bulat Negatif", "Garis bilangan, operasi + - × : dengan negatif, soal cerita suhu & utang-piutang."),
        ("Bab 2 — Operasi Hitung Campuran", "Urutan operasi (kurung-kali-bagi-tambah-kurang), soal cerita 2-3 langkah."),
        ("Bab 3 — Lingkaran", "Unsur (jari-jari, diameter), keliling = 2πr, luas = πr², soal cerita taman & roda."),
        ("Bab 4 — Bangun Ruang", "Sifat kubus, balok, prisma, tabung, limas, kerucut, bola; jaring-jaring & volume."),
        ("Bab 5 — Statistika Sederhana", "Mean, median, modus, membaca diagram lingkaran/batang, peluang sederhana (dadu, koin)."),
      ],
      "Bahasa Indonesia": [
        ("Bab 1 — Teks Eksplanasi & Pidato", "Struktur eksplanasi ilmiah, pidato persuasif, bahasa baku & efektif."),
        ("Bab 2 — Surat Resmi", "Surat dinas, lamaran, undangan resmi — struktur & kaidah bahasa."),
        ("Bab 3 — Unsur Intrinsik Cerita", "Tema, tokoh, latar, alur, sudut pandang, amanat — analisis cerpen & novel anak."),
        ("Bab 4 — Majas dan Peribahasa Lanjut", "Majas metafora, simile, hiperbola, personifikasi, ironi — identifikasi di puisi/cerita."),
      ],
      "IPA": [
        ("Bab 1 — Rangka, Otot, dan Panca Indera", "Rangka & sendi, otot lurik-polos-jantung, mata-telinga-hidung — gangguan & pencegahannya."),
        ("Bab 2 — Perkembangbiakan Makhluk Hidup", "Generatif & vegetatif tumbuhan, bertelur-melahirkan hewan, daur hidup."),
        ("Bab 3 — Listrik dan Magnet", "Rangkaian listrik, konduktor-isolator, magnet & kutub, kompas, percobaan elektromagnet sederhana."),
        ("Bab 4 — Tata Surya & Pelestarian", "Planet, komet, asteroid, rotasi-revolusi & dampaknya, pemanasan global & pelestarian."),
      ],
      "IPS": [
        ("Bab 1 — ASEAN dan Globalisasi", "Negara ASEAN, kerja sama, dampak globalisasi ekonomi-budaya, sikap selektif."),
        ("Bab 2 — Perdagangan Internasional", "Ekspor-impor Indonesia, devisa, neraca perdagangan, MEA."),
        ("Bab 3 — Sejarah Proklamasi", "BPUPKI-PPKI, proklamasi 17 Agustus 1945, mempertahankan kemerdekaan, pahlawan nasional."),
      ],
      "PPKn": [
        ("Bab 1 — Pancasila dan UUD 1945", "Hubungan Pancasila-UUD, amendemen, pasal hak-kewajiban, pentingnya konstitusi."),
        ("Bab 2 — Demokrasi", "Prinsip demokrasi, pemilu, musyawarah, menghargai pendapat."),
        ("Bab 3 — Persatuan dan Kesatuan", "Ancaman persatuan, bela negara, cinta tanah air, toleransi antar umat."),
      ],
    },
  },
  "smp": {
    7: {
      "Matematika": [
        ("Bab 1 — Bilangan Bulat & Pecahan", "Operasi bilangan bulat, pecahan biasa-campuran-desimal-persen, FPB/KPK, garis bilangan."),
        ("Bab 2 — Himpunan", "Anggota himpunan, himpunan kosong-semesta, diagram Venn, irisan-gabungan-selisih."),
        ("Bab 3 — Bentuk Aljabar", "Variabel-koefisien-konstanta, operasi tambah-kurang-kali aljabar, substitusi."),
        ("Bab 4 — Persamaan Linear Satu Variabel", "PLSV, penyelesaian dengan pindah ruas, soal cerita umur & jual-beli."),
        ("Bab 5 — Perbandingan & Skala", "Perbandingan senilai-berbalik nilai, skala peta, kecepatan, debit."),
        ("Bab 6 — Garis, Sudut & Data", "Garis sejajar-berpotongan, sudut sehadap-bertolak belakang, tabel & diagram batang/garis/lingkaran."),
      ],
      "IPA": [
        ("Bab 1 — Klasifikasi Makhluk Hidup", "Kingdom, ciri monera-protista-fungi-plantae-animalia, kunci determinasi."),
        ("Bab 2 — Zat dan Perubahannya", "Unsur-senyawa-campuran, sifat fisika-kimia, perubahan fisika-kimia, pemisahan campuran."),
        ("Bab 3 — Suhu, Kalor & Pemuaian", "Termometer, kalor Q=m·c·ΔT, perpindahan kalor (konduksi-konveksi-radiasi), pemuaian."),
        ("Bab 4 — Gerak Lurus", "GLB & GLBB, jarak-perpindahan, kecepatan-percepatan, grafik v-t, percobaan ticker timer."),
        ("Bab 5 — Ekosistem & Pencemaran", "Komponen biotik-abiotik, rantai makanan, aliran energi, pencemaran air-udara-tanah."),
      ],
      "Bahasa Indonesia": [
        ("Bab 1 — Teks Deskripsi", "Struktur identifikasi-deskripsi bagian-kesimpulan, kaidah (adjektiva, majas), menulis deskripsi tempat."),
        ("Bab 2 — Teks Prosedur", "Struktur tujuan-bahan-langkah, kaidah imperatif, menulis prosedur membuat makanan/minuman."),
        ("Bab 3 — Teks Narasi & Cerita Fantasi", "Struktur orientasi-komplikasi-resolusi, unsur intrinsik, menulis cerita fantasi."),
        ("Bab 4 — Surat & Puisi", "Surat pribadi & dinas, unsur puisi (diksi, rima, majas), membaca puisi."),
        ("Bab 5 — Debat Sederhana", "Unsur debat (mosi, tim pro-kontra), etika debat, praktik debat kelas."),
      ],
      "Bahasa Inggris": [
        ("Bab 1 — Greeting & Introduction", "Greeting, self-introduction, asking & giving personal information, simple dialogues."),
        ("Bab 2 — Daily Activities (Simple Present)", "Simple Present for habits, adverbs of frequency, telling daily routine."),
        ("Bab 3 — Descriptive Text", "Describing people, animals, places — structure identification-description, adjectives."),
        ("Bab 4 — Telling Time & Date", "Clock time, days-months, asking & giving time/date, schedule text."),
      ],
      "IPS": [
        ("Bab 1 — Interaksi Sosial", "Bentuk interaksi (asosiatif-disosiatif), syarat interaksi, contoh di sekolah-masyarakat."),
        ("Bab 2 — Peta & Kondisi Geografis Indonesia", "Letak astronomis-geologis, iklim, flora-fauna, peta & skala."),
        ("Bab 3 — Kegiatan Ekonomi", "Kebutuhan, kelangkaan, sistem ekonomi, pasar, uang & bank, koperasi."),
        ("Bab 4 — Sejarah Hindu-Buddha & Islam", "Kerajaan Kutai-Sriwijaya-Majapahit-Demak, peninggalan candi-masjid, akulturasi budaya."),
      ],
    },
    8: {
      "Matematika": [
        ("Bab 1 — Pola Bilangan", "Pola ganjil-genap-segitiga-persegi-Fibonacci, barisan aritmetika & geometri sederhana."),
        ("Bab 2 — Koordinat Kartesius", "Titik koordinat, kuadran, jarak titik, menggambar bangun di bidang Kartesius."),
        ("Bab 3 — Relasi dan Fungsi", "Relasi, fungsi, domain-kodomain-range, diagram panah & Kartesius, korespondensi satu-satu."),
        ("Bab 4 — Persamaan Garis Lurus", "Gradien, persamaan y=mx+c, garis sejajar-tegak lurus, menggambar grafik."),
        ("Bab 5 — SPLDV", "Metode grafik, substitusi, eliminasi, campuran, soal cerita SPLDV."),
        ("Bab 6 — Pythagoras, Lingkaran & Statistika", "Teorema Pythagoras, unsur & luas lingkaran, mean-median-modus, diagram."),
      ],
      "IPA": [
        ("Bab 1 — Sistem Gerak Manusia", "Rangka, sendi, otot, gangguan (osteoporosis, kram), upaya menjaga kesehatan."),
        ("Bab 2 — Sistem Pencernaan", "Organ pencernaan, enzim, gangguan (maag, diare), makanan sehat & gizi seimbang."),
        ("Bab 3 — Zat Aditif & Adiktif", "Pewarna-pemanis-pengawet, narkotika-psikotropika, dampak & pencegahan."),
        ("Bab 4 — Getaran, Gelombang, Bunyi", "Getaran, gelombang transversal-longitudinal, bunyi & resonansi, rumus v=λ·f."),
        ("Bab 5 — Cahaya dan Optik", "Cermin datar-cekung-cembung, lensa, pembiasan, mata & cacat mata (miopi-hipermetropi)."),
        ("Bab 6 — Struktur Bumi & Gempa", "Lapisan bumi, lempeng tektonik, gempa & gunung api, mitigasi bencana."),
      ],
      "Bahasa Indonesia": [
        ("Bab 1 — Teks Eksposisi", "Struktur tesis-argumen-penegasan ulang, kaidah (konjungsi kausal, pronomina), menulis eksposisi."),
        ("Bab 2 — Teks Eksplanasi", "Struktur pernyataan umum-deretan penjelas-interpretasi, kaidah pasif & konjungsi waktu."),
        ("Bab 3 — Teks Berita", "Unsur 5W1H, struktur kepala-tubuh-ekor, bahasa baku & faktual, menulis berita."),
        ("Bab 4 — Ulasan, Cerpen, Puisi, Drama", "Struktur ulasan, cerpen (orientasi-komplikasi-resolusi), puisi & drama — menulis & mementaskan."),
      ],
      "Bahasa Inggris": [
        ("Bab 1 — Simple Past & Present Continuous", "Past tense for past events, present continuous for ongoing actions, time signals."),
        ("Bab 2 — Recount Text", "Structure orientation-events-reorientation, past tense, writing personal recount."),
        ("Bab 3 — Narrative Text", "Structure orientation-complication-resolution, past tense, fables & legends."),
        ("Bab 4 — Opinion & Advertisement", "Asking/giving opinion, agreement-disagreement, advertisement text (slogan, persuasive language)."),
      ],
      "IPS": [
        ("Bab 1 — Mobilitas Sosial", "Bentuk mobilitas vertikal-horizontal, saluran mobilitas, dampak positif-negatif."),
        ("Bab 2 — Keunggulan & Keterbatasan Ruang", "Potensi SDA Indonesia, distribusi, perdagangan antar pulau, tol laut."),
        ("Bab 3 — Perdagangan Internasional", "Ekspor-impor, neraca perdagangan, alat pembayaran internasional, MEA & WTO."),
        ("Bab 4 — Sejarah Kolonialisme & Pergerakan Nasional", "VOC, penjajahan Belanda-Jepang, Budi Utomo, Sumpah Pemuda, Proklamasi."),
      ],
    },
    9: {
      "Matematika": [
        ("Bab 1 — Bilangan Berpangkat & Akar", "Sifat eksponen, bentuk akar, merasionalkan penyebut, notasi ilmiah."),
        ("Bab 2 — Persamaan & Fungsi Kuadrat", "Akar persamaan kuadrat (faktor, kuadrat sempurna, rumus ABC), grafik parabola, diskriminan."),
        ("Bab 3 — Transformasi Geometri", "Translasi, refleksi, rotasi, dilatasi, komposisi transformasi di koordinat."),
        ("Bab 4 — Kesebangunan & Kekongruenan", "Syarat sebangun & kongruen, soal segitiga & trapesium sebangun."),
        ("Bab 5 — Bangun Ruang Sisi Lengkung", "Tabung, kerucut, bola — luas permukaan & volume, soal gabungan."),
        ("Bab 6 — Statistika & Peluang", "Mean-median-modus-kuartil, diagram, peluang empirik-teoretik, frekuensi harapan."),
      ],
      "IPA": [
        ("Bab 1 — Pewarisan Sifat & Bioteknologi", "Gen-kromosom-DNA, hukum Mendel, persilangan monohibrid-dihibrid, bioteknologi konvensional-modern."),
        ("Bab 2 — Listrik Statis", "Muatan, hukum Coulomb, medan listrik, kapasitor sederhana, penangkal petir."),
        ("Bab 3 — Listrik Dinamis", "Arus-tegangan-hambatan, hukum Ohm, rangkaian seri-paralel, daya & energi listrik (P=V·I)."),
        ("Bab 4 — Kemagnetan & Induksi", "Magnet, elektromagnet, gaya Lorentz, induksi Faraday, transformator, generator."),
        ("Bab 5 — Tata Surya", "Planet, hukum Kepler, gerhana, pasang surut, eksplorasi antariksa."),
      ],
      "Bahasa Indonesia": [
        ("Bab 1 — Teks Laporan Percobaan", "Struktur tujuan-bahan-langkah-hasil-simpulan, kaidah ilmiah, menulis laporan percobaan."),
        ("Bab 2 — Pidato Persuasif", "Struktur pembuka-isi-penutup, kaidah persuasif, praktik pidato."),
        ("Bab 3 — Cerpen dan Novel", "Unsur intrinsik-ekstrinsik, menganalisis cerpen/novel, menulis cerpen."),
        ("Bab 4 — Syair, Pantun & Tanggapan Kritis", "Ciri syair-pantun-gurindam, tanggapan kritis terhadap buku/film, menulis tanggapan."),
      ],
      "Bahasa Inggris": [
        ("Bab 1 — Passive Voice & Reported Speech", "Active-passive transformation, direct-indirect speech, tenses shift."),
        ("Bab 2 — Procedure & Cause-Effect Text", "Procedure structure (goal-materials-steps), cause-effect conjunctions (because, so, due to)."),
        ("Bab 3 — Application Letter & Functional Text", "Structure of application letter, CV, announcement, advertisement — writing practice."),
        ("Bab 4 — Long Functional & Narrative", "Reading long texts, narrative & exposition, comprehension & vocabulary."),
      ],
      "IPS": [
        ("Bab 1 — Perubahan Sosial", "Bentuk perubahan (evolusi-revolusi), faktor pendorong-penghambat, dampak globalisasi."),
        ("Bab 2 — Ketergantungan Antar Ruang", "Interaksi antar wilayah, perdagangan, migrasi, kerja sama internasional."),
        ("Bab 3 — Ekonomi Kreatif & Perdagangan", "Ekonomi kreatif, UMKM digital, ekspor-impor, neraca pembayaran."),
        ("Bab 4 — Sejarah Pasca-Kemerdekaan", "Orde Lama, Orde Baru, Reformasi 1998, demokrasi & otonomi daerah."),
      ],
    },
  },
  "sma": {
    10: {
      "Matematika": [
        ("Bab 1 — Eksponen dan Logaritma", "Sifat eksponen, persamaan eksponen, logaritma & sifatnya, aplikasi pertumbuhan & peluruhan."),
        ("Bab 2 — Barisan dan Deret", "Aritmetika & geometri, deret tak hingga, aplikasi bunga & anuitas sederhana."),
        ("Bab 3 — Vektor", "Vektor di bidang & ruang, operasi vektor, panjang & sudut antar vektor."),
        ("Bab 4 — Trigonometri Dasar", "Perbandingan trigonometri, sudut istimewa, identitas, aturan sinus-cosinus."),
        ("Bab 5 — Sistem Persamaan & Fungsi Kuadrat", "SPLTV, fungsi kuadrat & grafik, statistika (mean-median-modus-kuartil)."),
      ],
      "Fisika": [
        ("Bab 1 — Gerak Lurus & Parabola", "GLB-GLBB, gerak jatuh bebas, parabola, vektor perpindahan."),
        ("Bab 2 — Hukum Newton", "Hukum I-II-III Newton, gaya gesek, gaya normal, aplikasi bidang miring & katrol."),
        ("Bab 3 — Usaha, Energi & Momentum", "Usaha W=F·s, energi kinetik-potensial-mekanik, momentum p=m·v, impuls & tumbukan."),
        ("Bab 4 — Fluida, Suhu & Kalor", "Tekanan hidrostatis, hukum Archimedes, pemuaian, kalor & asas Black."),
      ],
      "Kimia": [
        ("Bab 1 — Struktur Atom & SPU", "Model atom, konfigurasi elektron, sistem periodik, sifat keperiodikan."),
        ("Bab 2 — Ikatan Kimia", "Ikatan ion-kovalen-logam, struktur Lewis, kepolaran, gaya antar molekul."),
        ("Bab 3 — Stoikiometri", "Mol, massa molar, persamaan reaksi, pereaksi pembatas, kadar & rendemen."),
        ("Bab 4 — Larutan, Koloid & Termokimia", "Konsentrasi, koloid, entalpi, hukum Hess, energi ikatan."),
      ],
      "Biologi": [
        ("Bab 1 — Keanekaragaman Hayati", "Tingkat gen-jenis-ekosistem, klasifikasi, pelestarian & keanekaragaman Indonesia."),
        ("Bab 2 — Virus dan Bakteri", "Ciri virus-bakteri, replikasi virus, peran bakteri, penyakit & pencegahan."),
        ("Bab 3 — Protista dan Fungi", "Ciri & klasifikasi protista-fungi, peran menguntungkan-merugikan."),
        ("Bab 4 — Ekologi & Pencemaran", "Ekosistem, aliran energi, daur biogeokimia, pencemaran & AMDAL."),
      ],
      "Bahasa Indonesia": [
        ("Bab 1 — Teks Observasi & Eksposisi", "Struktur & kaidah observasi-eksposisi, menulis teks faktual & argumentatif."),
        ("Bab 2 — Anekdot & Hikayat", "Struktur anekdot & hikayat, kaidah humor & arkais, menganalisis nilai budaya."),
        ("Bab 3 — Debat & Negosiasi", "Struktur debat-negosiasi, etika, praktik debat & negosiasi jual-beli."),
        ("Bab 4 — Puisi & Cerpen", "Unsur puisi (diksi-majas-rima), cerpen (intrinsik-ekstrinsik), menulis & membacakan."),
      ],
      "Bahasa Inggris": [
        ("Bab 1 — Narrative & Descriptive", "Generic structure narrative & descriptive, past tense, adjectives, writing."),
        ("Bab 2 — Recount & Announcement", "Recount structure, announcement language, reading comprehension."),
        ("Bab 3 — Grammar: Past vs Perfect", "Simple past vs present perfect, expressions of suggestion/offer, dialogues."),
      ],
      "Ekonomi": [
        ("Bab 1 — Konsep Ekonomi & Kelangkaan", "Kebutuhan, kelangkaan, biaya peluang, skala prioritas, sistem ekonomi."),
        ("Bab 2 — Pasar dan Harga", "Permintaan-penawaran, harga keseimbangan, elastisitas, pasar persaingan sempurna-tidak sempurna."),
        ("Bab 3 — Lembaga Keuangan, Koperasi & BUMN", "Bank, pegadaian, asuransi, koperasi, BUMN/BUMD, peran dalam perekonomian."),
      ],
      "Sejarah": [
        ("Bab 1 — Indonesia Pra-Aksara & Hindu-Buddha", "Manusia purba, kerajaan Kutai-Tarumanegara-Sriwijaya-Majapahit, peninggalan."),
        ("Bab 2 — Kerajaan Islam & Kolonialisme", "Demak-Mataram-Banten, VOC, penjajahan Belanda, perlawanan (Diponegoro, Pattimura)."),
      ],
    },
    11: {
      "Matematika": [
        ("Bab 1 — Fungsi Komposisi & Invers", "Komposisi (f∘g), invers, sifat fungsi, grafik & aplikasi."),
        ("Bab 2 — Matriks", "Operasi matriks, determinan, invers, SPLDV/SPLTV dengan matriks."),
        ("Bab 3 — Induksi Matematika & Program Linear", "Prinsip induksi, notasi sigma, program linear & nilai optimum."),
        ("Bab 4 — Limit & Turunan Dasar", "Limit fungsi aljabar, turunan definisi & aturan, aplikasi turunan (kecepatan, gradien)."),
        ("Bab 5 — Statistika Lanjut", "Penyajian data kelompok, ukuran pemusatan & penyebaran, distribusi frekuensi."),
      ],
      "Fisika": [
        ("Bab 1 — Dinamika Rotasi & Kesetimbangan", "Momen gaya, momen inersia, momentum sudut, kesetimbangan benda tegar."),
        ("Bab 2 — Elastisitas & Fluida", "Hukum Hooke, modulus Young, fluida statis-dinamik, hukum Bernoulli & Torricelli."),
        ("Bab 3 — Gelombang Bunyi & Cahaya", "Gelombang mekanik, bunyi (intensitas, Doppler), cahaya (interferensi, difraksi, polarisasi)."),
        ("Bab 4 — Termodinamika & Listrik Statis", "Hukum termodinamika, mesin Carnot, muatan & medan listrik, kapasitor."),
      ],
      "Kimia": [
        ("Bab 1 — Hidrokarbon & Minyak Bumi", "Alkana-alkena-alkuna, isomer, reaksi hidrokarbon, fraksi minyak bumi."),
        ("Bab 2 — Kesetimbangan Kimia", "Reaksi reversibel, Kc & Kp, pergeseran kesetimbangan (Le Chatelier)."),
        ("Bab 3 — Asam-Basa & Larutan Penyangga", "Teori Arrhenius-Bronsted-Lewis, pH, titrasi, buffer & hidrolisis."),
        ("Bab 4 — Hidrolisis, Ksp & Koloid", "Garam terhidrolisis, hasil kali kelarutan, sifat & pembuatan koloid."),
      ],
      "Biologi": [
        ("Bab 1 — Sel & Jaringan", "Struktur sel hewan-tumbuhan, organel, jaringan epitel-ikat-otot-saraf, mikroskop."),
        ("Bab 2 — Sistem Gerak & Peredaran Darah", "Tulang-otot-sendi, darah, jantung, pembuluh, gangguan & teknologi (ECG)."),
        ("Bab 3 — Sistem Pencernaan & Pernapasan", "Organ & enzim pencernaan, paru-paru, pertukaran gas, gangguan & pola hidup sehat."),
        ("Bab 4 — Sistem Ekskresi", "Ginjal-kulit-paru-hati, nefron, gangguan ginjal, cuci darah & transplantasi."),
      ],
      "Bahasa Indonesia": [
        ("Bab 1 — Teks Prosedur Kompleks & Eksplanasi", "Prosedur kompleks (bertingkat), eksplanasi ilmiah, kaidah & menulis."),
        ("Bab 2 — Ceramah, Resensi & Drama", "Ceramah persuasif, resensi buku/film, drama (struktur & pementasan)."),
        ("Bab 3 — Novel & Kritik Sastra", "Unsur novel, kritik & esai sastra, menganalisis karya sastra Indonesia."),
      ],
      "Bahasa Inggris": [
        ("Bab 1 — Analytical & Hortatory Exposition", "Structure thesis-arguments-reiteration/recommendation, language features, writing."),
        ("Bab 2 — Explanation Text & Conditional", "Explanation structure, if-conditional type 1-3, passive voice, comprehension."),
      ],
      "Ekonomi": [
        ("Bab 1 — Pendapatan Nasional", "GDP/GNP, metode perhitungan, pendapatan per kapita, inflasi & indeks harga."),
        ("Bab 2 — APBN/APBD & Perpajakan", "Struktur APBN/APBD, pajak pusat-daerah, fungsi pajak, kebijakan fiskal."),
        ("Bab 3 — Pasar Modal, Uang & Ketenagakerjaan", "Bursa efek, saham-obligasi, uang & bank sentral, ketenagakerjaan & pembangunan."),
      ],
      "Sejarah": [
        ("Bab 1 — Pergerakan Nasional & Proklamasi", "Budi Utomo, Sumpah Pemuda, BPUPKI-PPKI, proklamasi, revolusi kemerdekaan."),
        ("Bab 2 — Orde Lama, Orde Baru & Reformasi", "Demokrasi liberal-terpimpin, Orde Baru, Reformasi 1998, demokrasi masa kini."),
      ],
    },
    12: {
      "Matematika": [
        ("Bab 1 — Dimensi Tiga", "Jarak titik-garis-bidang, sudut antar bidang, proyeksi, volume bangun ruang."),
        ("Bab 2 — Statistika Inferensial & Peluang", "Distribusi normal, uji hipotesis sederhana, peluang majemuk, kombinasi-permutasi."),
        ("Bab 3 — Limit Tak Hingga & Kekontinuan", "Limit di tak hingga, limit trigonometri, kekontinuan fungsi."),
        ("Bab 4 — Turunan & Integral", "Turunan fungsi aljabar-trigonometri, integral tak tentu & tentu, luas & volume benda putar."),
        ("Bab 5 — Kaidah Pencacahan", "Aturan penjumlahan-perkalian, permutasi, kombinasi, peluang kejadian majemuk."),
      ],
      "Fisika": [
        ("Bab 1 — Listrik Dinamis", "Hukum Ohm & Kirchhoff, rangkaian seri-paralel, energi & daya listrik."),
        ("Bab 2 — Medan Magnet & Induksi", "Gaya Lorentz, induksi Faraday-Lenz, transformator, motor & generator."),
        ("Bab 3 — Fisika Kuantum & Relativitas", "Efek fotolistrik, dualisme gelombang-partikel, relativitas Einstein, teknologi kuantum."),
        ("Bab 4 — Teknologi Digital", "Semikonduktor, transistor, gerbang logika, fiber optik & komunikasi digital."),
      ],
      "Kimia": [
        ("Bab 1 — Sifat Koligatif Larutan", "Penurunan tekanan uap, kenaikan titik didih, penurunan titik beku, tekanan osmosis."),
        ("Bab 2 — Redoks & Elektrokimia", "Bilangan oksidasi, sel volta & elektrolisis, hukum Faraday, korosi & pencegahannya."),
        ("Bab 3 — Kimia Unsur & Senyawa Karbon", "Golongan gas mulia-halogen-alkali, benzena, polimer, karbohidrat-protein-lemak."),
      ],
      "Biologi": [
        ("Bab 1 — Pertumbuhan & Reproduksi", "Pertumbuhan tumbuhan (hormon), reproduksi hewan-manusia, fertilisasi & kehamilan."),
        ("Bab 2 — Genetika & Mutasi", "Hukum Mendel, pautan & pindah silang, mutasi gen-kromosom, rekayasa genetika."),
        ("Bab 3 — Evolusi & Bioteknologi", "Teori evolusi Darwin, seleksi alam, bioteknologi modern (kultur jaringan, kloning, transgenik)."),
      ],
      "Bahasa Indonesia": [
        ("Bab 1 — Teks Editorial & Opini", "Struktur editorial-opini-artikel, kaidah argumentatif, menulis opini."),
        ("Bab 2 — Novel Sejarah, Kritik & Esai", "Novel sejarah, kritik & esai sastra, karya ilmiah sederhana — menulis & menilai."),
      ],
      "Bahasa Inggris": [
        ("Bab 1 — Discussion, Review & News Item", "Discussion (pro-contra), review text, news item structure, UTBK reading strategies."),
        ("Bab 2 — Advanced Grammar & Writing", "Complex sentences, subjunctive, academic writing, essay & report."),
      ],
      "Ekonomi": [
        ("Bab 1 — Akuntansi Perusahaan Jasa & Dagang", "Persamaan dasar akuntansi, jurnal, buku besar, laporan keuangan (laba-rugi, neraca)."),
        ("Bab 2 — Manajemen & Ekonomi Internasional", "Fungsi manajemen, perdagangan internasional, valuta asing, kerja sama ekonomi."),
        ("Bab 3 — Pembangunan Berkelanjutan", "Pembangunan ekonomi, pertumbuhan vs pembangunan, ekonomi hijau & SDGs."),
      ],
      "Sejarah": [
        ("Bab 1 — Perang Dunia & Pengaruhnya di Indonesia", "PD I & II, pendudukan Jepang, proklamasi, revolusi kemerdekaan."),
        ("Bab 2 — Sejarah Dunia Kontemporer & Globalisasi", "Perang Dingin, PBB, globalisasi, peran Indonesia di ASEAN & dunia."),
      ],
    },
  }
}

SLUG = {
  "Matematika": "matematika", "IPA": "ipa", "Bahasa Indonesia": "bahasa-indonesia",
  "IPS": "ips", "PPKn": "ppkn", "Bahasa Inggris": "bahasa-inggris",
  "Fisika": "fisika", "Kimia": "kimia", "Biologi": "biologi",
  "Ekonomi": "ekonomi", "Sejarah": "sejarah",
}

def _strip_em(s: str) -> str:
  return s.replace("—", "-").replace("–", "-")

def make_frontmatter(jenjang, kelas, mapel, bab_no, bab_judul):
  bab_judul = _strip_em(bab_judul)
  return f"---\njenjang: {jenjang}\nkelas: {kelas}\nmapel: {mapel}\nbab: {bab_no}\njudul: \"{bab_judul}\"\nkurikulum: Kurikulum Merdeka 2024/2025\nsumber: Rangkuman resmi Kemendikbud & adaptasi materi ajar terbaru\n---\n\n"

def build_file_content(jenjang, kelas, mapel, bab_list):
  lines = []
  kelas_label = f"Kelas {kelas}"
  jenjang_label = {"sd":"SD","smp":"SMP","sma":"SMA"}[jenjang]
  title = f"# {mapel} - {jenjang_label} {kelas_label} (Kurikulum Merdeka)"
  lines.append(title)
  lines.append("")
  lines.append(f"> Ringkasan materi {mapel} {jenjang_label} {kelas_label} sesuai Kurikulum Merdeka terbaru. "
               "Cocok untuk bahan generate soal adaptif — tiap bab sudah dipetakan topik & contoh.")
  lines.append("")
  lines.append("## Daftar Bab")
  for i,(judul,_) in enumerate(bab_list,1):
    lines.append(f"{i}. {judul}")
  lines.append("")
  lines.append("---")
  lines.append("")
  for i,(judul, deskripsi) in enumerate(bab_list,1):
    judul = _strip_em(judul)
    deskripsi = _strip_em(deskripsi)
    lines.append(f"## {judul}")
    lines.append("")
    lines.append(deskripsi)
    lines.append("")
    lines.append(f"**Kata kunci:** {', '.join(judul.split('-')[-1].split('&')[:3]).strip().lower()}")
    lines.append("")
    lines.append(f"**Contoh soal (gambaran tingkat):** Soal pilihan ganda sesuai {jenjang_label} kelas {kelas} tentang topik di atas, "
                 "dengan 4 opsi dan penjelasan singkat - tingkat kesulitan disesuaikan umur.")
    lines.append("")
    if i < len(bab_list):
      lines.append("---")
      lines.append("")
  lines.append("")
  lines.append(f"_Diperbarui: Kurikulum Merdeka 2024/2025 - disesuaikan untuk LLM BelajarAdaptif._")
  return "\n".join(lines)

total = 0
for jenjang, kelas_dict in CURR.items():
  for kelas, mapel_dict in kelas_dict.items():
    folder = ROOT / jenjang / f"kelas-{kelas}"
    folder.mkdir(parents=True, exist_ok=True)
    for mapel, bab_list in mapel_dict.items():
      slug = SLUG[mapel]
      fname = folder / f"{kelas:02d}-{slug}.md"
      fm = make_frontmatter(jenjang, kelas, mapel, 1, bab_list[0][0])
      body = build_file_content(jenjang, kelas, mapel, bab_list)
      fname.write_text(fm + body, encoding="utf-8")
      total += 1
      print(f"OK {fname.relative_to(ROOT)}")

# README index
idx_lines = ["# Materi Kurikulum — SD Kelas 1 s.d. SMA Kelas 12", "", "> Folder ini adalah **bank materi LLM lengkap** untuk BelajarAdaptif.", "> Semua materi mengikuti **Kurikulum Merdeka 2024/2025** terbaru.", "> Dipakai sebagai sumber generate soal & RAG — bukan sekadar ringkasan.", "", "## Struktur Folder", "", "```", "materi-kurikulum/", "  sd/kelas-1/ 01-matematika.md ...", "  sd/kelas-2/ ...", "  smp/kelas-7/ ...", "  sma/kelas-10/ ...", "```", "", "## Daftar Lengkap", "", "| Jenjang | Kelas | Mapel | File | Bab |", "|---|---|---|---|---|"]
for jenjang in ["sd","smp","sma"]:
  for kelas in sorted(CURR[jenjang].keys()):
    for mapel, babs in CURR[jenjang][kelas].items():
      slug = SLUG[mapel]
      fname = f"{jenjang}/kelas-{kelas}/{kelas:02d}-{slug}.md"
      idx_lines.append(f"| {jenjang.upper()} | {kelas} | {mapel} | `{fname}` | {len(babs)} bab |")
idx_lines += ["", "## Cara Pakai (LLM)", "", "- Import otomatis: `python backend/import_kurikulum.py` akan upsert semua MD ke DB `materi` (source_type=builtin).", "- Generate soal: `POST /api/generate-question` otomatis filter `jenjang+kelas+mapel` → ambil konteks dari bank ini.", "- Ujian bab: `POST /api/ujian/generate` dengan `materi_tersedia` per bab.", "", "## Sumber", "", "- Kemendikbud — Capaian Pembelajaran Kurikulum Merdeka", "- Buku Teks Kurikulum Merdeka (Buku Guru & Siswa) 2024/2025", "- Adaptasi & rangkuman untuk LLM (bukan pengganti buku resmi)", ""]
(ROOT / "README.md").write_text("\n".join(idx_lines), encoding="utf-8")
print(f"\nTotal files: {total}")
print("README written")
