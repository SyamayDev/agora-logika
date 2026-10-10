/* =====================================================================
   AGORA LOGIKA — content.js
   SEMUA TEKS ADA DI SINI. Ubah kalimat tanpa menyentuh logika website.
   - Formula ditulis dengan simbol Unicode biasa: ∀ ∃ → ∧ ∨ ¬ ↔ ⊢ ∴
     Website otomatis memberi warna (kuantor emas, predikat biru, dst.).
   - Di dalam dialog, apit formula dengan {{ }} agar ikut diwarnai,
     contoh: 'Kita tulis {{∀x T(x)}}.'
   - Tanda [KONFIRMASI DOSEN] menandai isi yang tidak ada di materi.
   ===================================================================== */
window.CONTENT = {

  meta: {
    title: 'Agora Logika',
    subtitle: 'Kalkulus Predikat bersama Socrates'
  },

  // Definisi "valid" TIDAK ada di materi → tampil dengan label konfirmasi.
  // Ganti teksnya dengan definisi dosen, lalu set confirm:false.
  validNote: {
    text: 'Valid: jika semua premis benar, kesimpulan pasti benar.',
    confirm: true
  },

  // ---------- Kasus utama (benang merah) ----------
  argument: {
    domain: 'penduduk Athena',
    key: [['M(x)', 'x manusia'], ['F(x)', 'x akan mati'], ['s', 'Socrates']],
    natural: [
      { tag: 'P1', text: 'Semua manusia akan mati.', formula: '∀x (M(x) → F(x))' },
      { tag: 'P2', text: 'Socrates adalah manusia.', formula: 'M(s)' },
      { tag: 'K', text: 'Ada penduduk Athena yang akan mati.', formula: '∃x F(x)' }
    ],
    proof: [
      ['∀x (M(x) → F(x))', 'Premis'],
      ['M(s)', 'Premis'],
      ['M(s) → F(s)', 'UI dari 1'],
      ['F(s)', 'MP dari 2, 3'],
      ['∃x F(x)', 'EG dari 4']
    ]
  },

  // ---------- Jalur Pipeline (HUD) ----------
  pipeline: [
    { name: 'Kalimat', tip: 'Kalimat sehari-hari yang akan diterjemahkan' },
    { name: 'Predikat', tip: 'Sifat yang dilekatkan pada objek, misalnya M(x): x manusia' },
    { name: 'Domain', tip: 'Himpunan semua objek yang boleh mengisi x' },
    { name: 'Kuantor', tip: 'Jumlah: semua (∀) atau ada (∃)' },
    { name: 'Ekspresi', tip: 'Ekspresi logika: kalimat utuh dalam simbol' }
  ],

  // ---------- Cara baca simbol (muncul saat hover) ----------
  symbols: {
    '∀': 'untuk setiap', '∃': 'terdapat', '→': 'jika … maka', '∧': 'dan', '∨': 'atau',
    '¬': 'bukan', '↔': 'jika dan hanya jika', '∴': 'jadi',
    '⊢': 'kita boleh menulis [konfirmasi dosen]'
  },

  // ---------- Aturan inferensi (Inventory Jurus) ----------
  jurus: [
    { id: 'UI', name: 'Instansiasi Universal', rule: '∀x P(x) ⊢ P(c)', meaning: 'Berlaku untuk semua, berarti berlaku untuk c mana pun di domain.' },
    { id: 'MP', name: 'Modus Ponens', rule: 'A → B, A ⊢ B', meaning: 'Punya "jika A maka B" dan punya A, maka kita dapat B.' },
    { id: 'EG', name: 'Generalisasi Eksistensial', rule: 'P(c) ⊢ ∃x P(x)', meaning: 'Dari satu contoh nyata, naik ke "ada".' },
    { id: 'EI', name: 'Instansiasi Eksistensial', rule: '∃x P(x) ⊢ P(c)', meaning: 'Untuk premis "ada": beri ia nama c. Syaratnya, c harus nama baru.', note: 'Pelengkap, tidak dipakai di kasus ini.' }
  ],

  // ---------- Nama di Peta Athena ----------
  map: [
    { scene: 'opening', name: 'Gerbang Senja', concept: 'Pembuka' },
    { scene: 'intro', name: 'Agora', concept: 'Pengenalan' },
    { scene: 'predicate', name: 'Taman Alas', concept: 'Predikat' },
    { scene: 'domain', name: 'Gerbang Kota', concept: 'Domain' },
    { scene: 'class', name: 'Kelas & Pasar', concept: 'Kuantor' },
    { scene: 'example', name: 'Teras Stoa', concept: 'Contoh interaktif' },
    { scene: 'main', name: 'Dinding Kuil', concept: 'Kasus utama' },
    { scene: 'solution', name: 'Ruang Quest', concept: 'Bukti bertahap' },
    { scene: 'quiz', name: 'Amfiteater', concept: 'Kuis' },
    { scene: 'summary', name: 'Bukit Fajar', concept: 'Rangkuman' },
    { scene: 'closing', name: 'Perpisahan', concept: 'Penutup' }
  ],

  // ---------- Ask Socrates (jawaban hanya dari materi) ----------
  ask: {
    general: [
      { q: 'Apa itu kalkulus predikat?', a: 'Perluasan dari logika proposisi. Kalimat dibuka menjadi objek, predikat, dan kuantor, dan semua yang berlaku di logika proposisi tetap berlaku.' },
      { q: 'Kenapa p, q, r tidak cukup?', a: 'Bagi logika proposisi, p, q, dan r hanya huruf. Isinya tertutup, jadi hubungan antara Socrates, "manusia", dan kata "semua" tidak terlihat.' }
    ],
    predicate: [
      { q: 'Kenapa M(x) belum benar atau salah?', a: 'Karena x masih kosong. Nilai kebenaran baru muncul setelah x diisi atau dikuantifikasi.' },
      { q: 'Apa beda variabel dan konstanta?', a: 'Variabel x adalah tempat kosong. Konstanta s adalah nama untuk satu objek tertentu, yaitu Socrates.' }
    ],
    domain: [
      { q: 'Kenapa patung ditolak?', a: 'Domain kita penduduk Athena. Patung bukan penduduk, jadi ia di luar domain.' },
      { q: 'Kenapa domain disebut lebih dulu?', a: 'Tanpa domain, nilai kebenaran sebuah kalimat bisa berubah.' }
    ],
    quantifier: [
      { q: 'Apakah ∃ berarti cuma satu?', a: 'Bukan. ∃ berarti paling sedikit satu: bisa satu, bisa banyak, bahkan bisa semua.' },
      { q: 'Kapan ∀ salah?', a: 'Cukup satu anggota domain yang tidak memenuhi. Yang satu itu disebut contoh tandingan.' }
    ],
    translate: [
      { q: 'Kenapa "semua" pakai →, bukan ∧?', a: 'Dibaca dengan ∧, kalimatnya menjadi "semua anggota domain adalah M dan F". Maknanya berbeda dari "semua M adalah F".' },
      { q: 'Apa bedanya UI dan EG?', a: 'UI turun dari "semua" ke satu nama c. EG naik dari satu nama c ke "ada".' }
    ],
    solution: [
      { q: 'Kenapa Socrates boleh dipakai untuk EG?', a: 'Socrates anggota domain (penduduk Athena), dan F(s) sudah terbukti di baris 4.' },
      { q: 'Apa bedanya UI dan EG?', a: 'UI turun dari "semua" ke satu nama c. EG naik dari satu nama c ke "ada".' }
    ]
  },

  // ---------- Dialog per scene ----------
  lines: {
    intro: {
      a: 'Selamat datang di Agora. Aku tidak akan memberimu jawaban. Aku hanya akan bertanya, dan kau yang menjawab.',
      b: 'Inilah kasus kita. Domainnya penduduk Athena. Pertanyaannya: apakah argumen ini valid?',
      c: 'Untuk menjawabnya, kalimat harus melewati lima tahap di jalan atas. Arahkan kursor ke tiap batu untuk melihat artinya.',
      d: 'Simpan gulungan ini dengan mengkliknya. Kita buka lagi di ujung jalan.',
      stashed: 'Gulungan tersimpan di pojok kanan atas. Klik kapan saja untuk melihatnya.'
    },
    predicate: {
      a: 'Lihat alas ini. Plakatnya bertuliskan {{M(x)}}: x adalah manusia. Huruf x adalah variabel, kotak kosong yang menunggu diisi.',
      q: 'Pertanyaanku: {{M(x)}} itu benar atau salah?',
      whyTrue: 'Benar untuk siapa? Siapa sebenarnya x itu?',
      whyFalse: 'Salah untuk siapa? Sudahkah kotak x terisi?',
      hint: 'Perhatikan kotak x yang berkedip. Selama kosong, adakah yang bisa kita nilai?',
      explain: 'Selama x kosong, {{M(x)}} belum benar atau salah. Nilai kebenaran muncul setelah x diisi atau dikuantifikasi.',
      right: 'Tepat. x masih kotak kosong, jadi {{M(x)}} belum bisa dinilai.',
      drag: 'Sekarang isi kotak itu. Seret aku ke atas alas.',
      dropped: 'Kini {{M(s)}}: Socrates adalah manusia. Benar! s adalah konstanta, nama untuk satu objek tertentu: aku.',
      end: 'Begitu x diisi, predikat menjadi kalimat yang bernilai. Tahap predikat selesai.'
    },
    domain: {
      a: 'Ini gerbang kota. Papan di atasnya menyebut domain kita: penduduk Athena. Domain adalah semesta pembicaraan.',
      q: 'Siapa yang boleh masuk ke kotak x? Seret kami ke gerbang, satu per satu.',
      member: '{name} penduduk Athena. Silakan masuk!',
      statue: 'Mirip denganku, bukan? Tapi patung bukan penduduk Athena. Ia di luar domain, jadi tidak boleh mengisi x.',
      end: 'Domain adalah penjaga gerbang. Karena itu, selalu sebutkan domain lebih dulu: tanpa domain, nilai kebenaran bisa berubah.'
    },
    class: {
      a: 'Di kelas ini domainnya berganti: murid-muridku. {{T(x)}} berarti x sudah mengerjakan tugas.',
      b: 'Pernyataanku: semua muridku sudah mengerjakan tugas. Kita tulis {{∀x T(x)}}, dibaca "untuk setiap x, T(x)".',
      c: 'Benarkah? Klik setiap murid untuk memeriksa tugasnya.',
      ok: 'Yang ini sudah. Periksa yang lain.',
      found: 'Lykos belum mengerjakan! Cukup satu yang belum, dan {{∀x T(x)}} langsung salah. Lykos adalah contoh tandingan.',
      d: 'Sekarang tekan tombol uji: bagaimana kalau Lykos menyelesaikan tugasnya?',
      toggled: 'Tanpa satu pun pengecualian, {{∀x T(x)}} benar. ∀ menuntut semua.'
    },
    market: {
      a: 'Malam turun. Kita di pasar, dan domainnya berganti lagi: orang-orang di pasar. {{B(x)}} berarti x bijak.',
      b: 'Adakah orang bijak di sini? Kita tulis {{∃x B(x)}}, dibaca "terdapat x sehingga B(x)".',
      c: 'Gerakkan lentera dan cari.',
      notWise: 'Bukan dia. Cari lagi.',
      found: 'Daphne, orang bijak! Satu saja cukup: {{∃x B(x)}} benar.',
      d: 'Tombol uji: bagaimana kalau Daphne pulang?',
      toggled: 'Tanpa Daphne, tidak ada satu pun orang bijak di pasar. {{∃x B(x)}} salah.',
      e: '∀ menuntut semua, ∃ cukup satu. "Paling sedikit satu" artinya bisa satu, bisa banyak, bahkan bisa semua.'
    },
    example: {
      a: 'Guru, aku mau menerjemahkan kalimat ini: semua murid Socrates sudah mengerjakan tugas.',
      b: 'Tahap pertama, predikat. Klik dua sifat di dalam kalimat itu.',
      semua: '"Semua" bukan sifat, Lykos. Itu jumlah. Simpan untuk tahap kuantor.',
      predsDone: 'Bagus. {{R(x)}}: x murid Socrates. {{T(x)}}: x sudah mengerjakan tugas.',
      c: 'Tahap kedua, domain. Kali ini kita bicara tentang seluruh penduduk Athena. Nikos si penjual zaitun lewat. Apakah ia anggota domain?',
      cWhy: 'Di mana Nikos tinggal? Siapa saja anggota domain kita?',
      cHint: 'Baca papan domain di panel kanan.',
      cRight: 'Benar. Nikos penduduk Athena, meski bukan muridku. Ingat dia.',
      cExplain: 'Domain kita penduduk Athena, dan Nikos penduduk Athena. Jadi ia anggota domain, meski bukan muridku.',
      d: 'Tahap ketiga, kuantor. Kata "semua" memakai kuantor apa?',
      dWhy: '∃ cukup satu. Apakah kalimatnya berkata "ada murid"?',
      dHint: '"Semua" menuntut setiap anggota domain.',
      dRight: 'Tepat. "Semua" adalah ∀: untuk setiap x di domain.',
      dExplain: '"Semua" menuntut setiap anggota domain, jadi kuantornya ∀.',
      e: 'Tahap keempat, penghubung. Apa yang menghubungkan {{R(x)}} dan {{T(x)}}?',
      eWhy: 'Bacalah kalimatmu dengan "dan": semua penduduk Athena adalah muridku dan sudah mengerjakan tugas. Apakah Nikos muridku?',
      eHint: 'Ingat polanya: "Semua M adalah F" memakai panah.',
      eRight: 'Tepat. Untuk setiap x: jika x muridku, maka x sudah mengerjakan tugas.',
      eExplain: 'Dengan ∧, Nikos menjadi contoh tandingan karena ia bukan muridku. Yang benar memakai panah: {{∀x (R(x) → T(x))}}.',
      f: 'Inilah dua pola yang perlu kau ingat. ∀ berpasangan dengan panah, ∃ berpasangan dengan "dan".'
    },
    main: {
      a: 'Kembali ke kasus kita. Kau sudah menerjemahkannya di papan tulis tadi. Klik tiap baris untuk mengingat bentuk simbolnya.',
      done: 'Semua sudah jadi simbol. Kata "penduduk Athena" tidak ditulis lagi karena sudah diwakili domain.',
      b: 'Tapi bagaimana dari dua baris atas sampai ke baris bawah? Kita butuh jurus. Buka gulungan UI, MP, dan EG.',
      c: 'EI hanya pelengkap: dipakai untuk premis "ada", dengan syarat c nama baru. Kasus kita tidak membutuhkannya. Siap? Mulai quest!'
    },
    solution: {
      a: 'Quest terakhir: dari dua premis sampai ke kesimpulan. Baris 1 dan 2 adalah premis.',
      valid: 'Setiap langkah sah. Argumen ini… valid!'
    },
    quiz: {
      a: 'Sebelum pulang, tiga jebakan dari Agora. Jawab dengan benar dan para murid akan bersorak.',
      end: 'Mahkota laurelmu: {score} dari 3. Jebakan ini sering menjatuhkan orang yang terburu-buru.'
    },
    summary: {
      a: 'Fajar menyingsing. Mari kita gulung perjalanan ini.',
      b: 'Ingat bedanya: ∀ dan ∃.',
      c: 'Dan untuk membuktikan, gunakan jurusnya.',
      d: 'Klik satu baris untuk kembali ke tempatnya, atau buka Kartu Argumen untuk melihat tiga wujudnya.'
    },
    closing: {
      a: 'Teruslah bertanya. Kalau masih bingung, tulis pertanyaanmu di kolom komentar. Sampai jumpa!'
    }
  },

  // ---------- Bukti bertahap (Scene 8) ----------
  proofSteps: [
    {
      row: 3, correct: 'UI',
      ask: 'Kalau aturan di baris 1 berlaku untuk semua orang, apakah berlaku juga untukku? Jurus apa untuk baris 3?',
      why: {
        EG: 'EG naik ke "ada". Tapi baris 1 dimulai dengan kata apa?',
        EI: 'EI dipakai untuk premis "ada". Apakah baris 1 berbicara tentang "ada"?',
        MP: 'Modus ponens butuh "jika A maka B" dan A. Sudahkah kita punya "jika M(s) maka F(s)"?'
      },
      hint: 'Lihat simbol pertama di baris 1. Jurus mana yang turun dari "semua"?',
      right: 'Benar. Berlaku untuk semua, berarti berlaku untukku: ganti x dengan s.',
      explain: 'Baris 1 berbicara tentang semua. UI menurunkannya ke satu nama: dari {{∀x (M(x) → F(x))}} kita boleh menulis {{M(s) → F(s)}}.'
    },
    {
      row: 4, correct: 'MP',
      ask: 'Kita punya "jika M(s) maka F(s)", dan kita punya M(s). Jurus apa untuk baris 4?',
      why: {
        UI: 'Lihat baris 2 dan 3. Yang satu "jika… maka", yang satu bagian "jika"-nya. Jurus apa yang memakai keduanya?',
        EG: 'Lihat baris 2 dan 3. Yang satu "jika… maka", yang satu bagian "jika"-nya. Jurus apa yang memakai keduanya?',
        EI: 'Lihat baris 2 dan 3. Yang satu "jika… maka", yang satu bagian "jika"-nya. Jurus apa yang memakai keduanya?'
      },
      hint: 'Bentuknya: A → B dan A. Jurus mana yang punya bentuk itu?',
      right: 'Benar. Modus ponens: Socrates manusia, jadi Socrates akan mati.',
      explain: 'Baris 3 berbentuk A → B dan baris 2 adalah A. Modus ponens memberi B: {{F(s)}}.'
    },
    {
      row: 5, correct: 'EG',
      ask: 'Kesimpulan kita tentang "ada", bukan tentang aku. Jurus apa untuk baris 5?',
      why: {
        UI: 'UI turun dari "semua". Kesimpulan kita naik ke "ada". Ke arah mana kita perlu bergerak?',
        EI: 'EI membuka "ada" menjadi nama. Kita justru ingin membuat "ada" dari nama. Jurus mana yang arahnya begitu?',
        MP: 'Modus ponens butuh "jika… maka". Adakah panah di baris 4?'
      },
      hint: 'Kita punya satu contoh nyata: F(s). Jurus mana yang naik dari satu contoh?',
      right: 'Benar. Aku penduduk Athena, jadi aku anggota domain, dan aku akan mati. Satu contoh cukup untuk "ada".',
      explain: 'EG naik dari satu contoh ke "ada": dari {{F(s)}} kita boleh menulis {{∃x F(x)}}, karena s anggota domain.'
    }
  ],

  // ---------- Kuis (dari bagian Kesalahan Umum di materi) ----------
  quiz: [
    {
      q: '"Semua M adalah F" ditulis sebagai…',
      options: [
        { label: '{{∀x (M(x) ∧ F(x))}}', why: 'Baca dengan "dan": semua anggota domain adalah M dan F. Itukah maksud kalimatnya?' },
        { label: '{{∀x (M(x) → F(x))}}', correct: true },
        { label: '{{∃x (M(x) → F(x))}}', why: '∃ cukup satu. Apakah kalimatnya berkata "ada"?' }
      ],
      hint: '∀ berpasangan dengan panah.',
      right: 'Benar. Untuk siapa saja: jika ia M, maka ia F.',
      explain: '"Semua M adalah F" ditulis {{∀x (M(x) → F(x))}}. ∀ berpasangan dengan panah.'
    },
    {
      q: 'Apa yang harus disebut lebih dulu sebelum menerjemahkan kalimat?',
      options: [
        { label: 'Kuantor', why: 'Kuantor bicara tentang "semua" atau "ada". Semua dari mana?' },
        { label: 'Domain', correct: true },
        { label: 'Kesimpulan', why: 'Kesimpulan ditulis terakhir. Siapa yang sedang kita bicarakan?' }
      ],
      hint: 'Ingat gerbang kota.',
      right: 'Benar. Tanpa domain, nilai kebenaran bisa berubah.',
      explain: 'Selalu sebutkan domain lebih dulu. Tanpa domain, nilai kebenaran bisa berubah.'
    },
    {
      q: 'Dua premis "ada" diinstansiasi dengan EI. Bolehkah keduanya memakai nama c?',
      options: [
        { label: 'Boleh, c untuk keduanya', why: 'Syarat EI: c harus nama baru. Setelah EI pertama, apakah c masih baru?' },
        { label: 'Tidak, harus dua nama berbeda (c dan d)', correct: true }
      ],
      hint: 'Baca syarat EI di kartu jurus.',
      right: 'Benar. Dua EI harus memakai dua nama berbeda.',
      explain: 'Syarat EI: c harus nama baru. Dua EI berbeda harus memakai nama berbeda, misalnya c dan d.'
    }
  ],

  // ---------- Rangkuman (Scene 10) ----------
  summary: [
    { text: 'Kalkulus predikat membuka kalimat menjadi objek, predikat, dan kuantor.', scene: 'predicate' },
    { text: '{{∀}} menuntut semua, {{∃}} cukup satu.', scene: 'class' },
    { text: 'Jurus pembuktian: UI, modus ponens, EG, plus EI untuk premis "ada".', scene: 'solution' }
  ]
};
