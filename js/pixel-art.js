/* =====================================================================
   AGORA LOGIKA — pixel-art.js
   Semua grafis pixel dibuat dengan kode (tanpa file gambar):
   - SPRITES : peta pixel karakter (huruf = warna)
   - drawSprite() : mengubah peta pixel menjadi <canvas>
   - BG      : latar tiap scene, digambar di kanvas 480×270 lalu
               diperbesar 4× (1920×1080) tanpa smoothing.
   Ubah warna di PAL / PALETTES untuk mengganti tampilan karakter.
   ===================================================================== */
(function () {
  'use strict';

  // ---------- Palet dunia (sama dengan dokumen desain) ----------
  const C = {
    ink: '#2B2118', marble: '#EDE6D6', marbleS: '#BDB4A3', marbleD: '#8F887A',
    parchment: '#F3E7C9', olive: '#7FB069', oliveD: '#4E7A3E', oliveDD: '#2F4F2A',
    silver: '#A9C29A', trunk: '#6B4A2E', trunkD: '#4A3220', road: '#C9B48A',
    roadD: '#A8916A', terra: '#C8553D', terraD: '#8E3A2A', gold: '#D9A441',
    aegean: '#4F8FD6', night: '#1B1F3B', dusk: '#4A3B6B', sunset: '#E8835A'
  };

  const SKIES = {
    dusk:  ['#3B2E5A', '#6B4A7A', '#C8607A', '#E8835A', '#F2B66D'],
    dusk2: ['#4A3B6B', '#8A5A86', '#D9787A', '#EFA070'],
    evening: ['#1E2348', '#3A3466', '#6B4A7A', '#A5617A'],
    night: ['#0B0E22', '#141A3A', '#1B1F3B', '#2A2F55'],
    dawn:  ['#5B6FA8', '#9C86B4', '#E9A39A', '#F7D08A', '#FBE3A8']
  };

  // ---------- Util dasar ----------
  function hex(h) { const n = parseInt(h.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
  function mix(a, b, t) {
    const A = hex(a), B = hex(b);
    const r = A.map((v, i) => Math.round(v + (B[i] - v) * t));
    return '#' + r.map(v => v.toString(16).padStart(2, '0')).join('');
  }
  function rect(ctx, x, y, w, h, col) { ctx.fillStyle = col; ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); }
  function px(ctx, x, y, col) { ctx.fillStyle = col; ctx.fillRect(Math.round(x), Math.round(y), 1, 1); }
  function rng(seed) {
    let s = (seed * 9301 + 49297) % 233280 || 1;
    return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
  }
  function disc(ctx, cx, cy, r, col) {
    for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++)
      if (x * x + y * y <= r * r + r * 0.6) px(ctx, cx + x, cy + y, col);
  }

  // Langit bergradasi bertangga dengan dithering (khas pixel art)
  function sky(ctx, stops, y0 = 0, y1 = 270) {
    const H = y1 - y0, sub = 4, steps = (stops.length - 1) * sub;
    for (let y = 0; y < H; y++) {
      const t = y / H * steps, k = Math.floor(t), f = t - k;
      const seg = Math.min(Math.floor(k / sub), stops.length - 2), s = k % sub;
      const c0 = mix(stops[seg], stops[seg + 1], s / sub);
      const c1 = mix(stops[seg], stops[seg + 1], Math.min(1, (s + 1) / sub));
      rect(ctx, 0, y0 + y, 480, 1, c0);
      if (f > 0.55) for (let x = y % 2; x < 480; x += 2) px(ctx, x, y0 + y, c1);
    }
  }
  function stars(ctx, n, seed, yMax) {
    const r = rng(seed);
    for (let i = 0; i < n; i++) {
      const x = r() * 480, y = r() * yMax, b = r();
      px(ctx, x, y, b > 0.85 ? '#FFF6D8' : b > 0.5 ? '#C9CDE8' : '#7A80A8');
      if (b > 0.95) { px(ctx, x + 1, y, '#7A80A8'); px(ctx, x - 1, y, '#7A80A8'); px(ctx, x, y + 1, '#7A80A8'); px(ctx, x, y - 1, '#7A80A8'); }
    }
  }
  function hill(ctx, base, amp, col, seed, f1 = 0.018, f2 = 0.047) {
    for (let x = 0; x < 480; x++) {
      const h = amp * (0.6 * Math.sin(x * f1 + seed) + 0.4 * Math.sin(x * f2 + seed * 2.3));
      const y = Math.round(base - Math.abs(h));
      rect(ctx, x, y, 1, 270 - y, col);
    }
  }
  function ground(ctx, y, col, speck, seed) {
    rect(ctx, 0, y, 480, 270 - y, col);
    const r = rng(seed);
    for (let i = 0; i < 380; i++) px(ctx, r() * 480, y + r() * (270 - y), speck);
  }
  function road(ctx, cx, yTop, yBot, wTop, wBot) {
    for (let y = yTop; y < yBot; y++) {
      const t = (y - yTop) / (yBot - yTop), w = wTop + (wBot - wTop) * t;
      rect(ctx, cx - w / 2, y, w, 1, C.road);
      if ((y - yTop) % Math.max(2, Math.round(3 + t * 6)) === 0) rect(ctx, cx - w / 2, y, w, 1, C.roadD);
      px(ctx, cx - w / 2, y, C.roadD); px(ctx, cx + w / 2 - 1, y, C.roadD);
    }
  }
  function tiles(ctx, y0, a, b, size = 10) {
    for (let y = y0; y < 270; y += size / 2) for (let x = -size; x < 480 + size; x += size) {
      const odd = ((y - y0) / (size / 2)) % 2;
      rect(ctx, x + (odd ? size / 2 : 0), y, size, size / 2, ((x / size + (y - y0) / (size / 2)) % 2) ? a : b);
    }
    for (let y = y0; y < 270; y += size / 2) rect(ctx, 0, y, 480, 1, mix(a, '#000000', 0.15));
  }

  // Pilar Yunani: kapital, batang beralur, alas
  function column(ctx, x, top, bottom, w, pal) {
    const p = pal || { m: C.marble, s: C.marbleS, d: C.marbleD };
    rect(ctx, x - 2, top, w + 4, 2, p.m); rect(ctx, x - 2, top + 2, w + 4, 1, p.s);
    rect(ctx, x - 1, top + 3, w + 2, 1, p.m);
    rect(ctx, x, top + 4, w, bottom - top - 7, p.m);
    for (let i = 1; i < w - 1; i += 2) rect(ctx, x + i, top + 5, 1, bottom - top - 10, p.s);
    rect(ctx, x + w - 1, top + 4, 1, bottom - top - 7, p.d);
    rect(ctx, x - 1, bottom - 3, w + 2, 1, p.s); rect(ctx, x - 2, bottom - 2, w + 4, 2, p.m);
  }
  // Kuil (gaya Parthenon)
  function temple(ctx, x, base, w, colH, n, pal, colW = 4) {
    const p = pal || { m: C.marble, s: C.marbleS, d: C.marbleD };
    rect(ctx, x - 6, base - 2, w + 12, 2, p.s); rect(ctx, x - 4, base - 4, w + 8, 2, p.m); rect(ctx, x - 2, base - 6, w + 4, 2, p.s);
    rect(ctx, x, base - 6 - colH, w, colH, p.d);
    const gap = (w - n * colW) / (n - 1);
    for (let i = 0; i < n; i++) column(ctx, x + i * (colW + gap), base - 6 - colH, base - 6, colW, p);
    const aT = base - 6 - colH - 5;
    rect(ctx, x - 3, aT, w + 6, 5, p.m); rect(ctx, x - 3, aT + 2, w + 6, 1, p.s);
    for (let i = 0; i < w; i += 4) rect(ctx, x + i, aT + 3, 2, 1, p.d);
    const ph = Math.max(4, Math.round(w * 0.16)), cx = x + w / 2;
    for (let r = 0; r < ph; r++) {
      const half = (w / 2 + 4) * (1 - r / ph);
      rect(ctx, cx - half, aT - 1 - r, half * 2, 1, r === 0 ? p.s : p.m);
    }
    for (let r = 2; r < ph - 1; r++) { const half = (w / 2) * (1 - r / ph) - 2; if (half > 2) rect(ctx, cx - half, aT - 1 - r, half * 2, 1, r % 2 ? p.s : p.m); }
  }
  function olive(ctx, x, base, size, seed) {
    const r = rng(seed), h = Math.round(size * 1.1);
    for (let y = 0; y < h; y++) { const sx = Math.round(Math.sin(y * 0.35 + seed) * 1.5); rect(ctx, x + sx, base - y, 3, 1, y % 3 ? C.trunk : C.trunkD); }
    const cy = base - h - size * 0.3;
    const blobs = [[0, 0, 0.62], [-0.55, 0.12, 0.45], [0.55, 0.1, 0.48], [-0.25, -0.35, 0.42], [0.3, -0.32, 0.44]];
    blobs.forEach(([bx, by, br]) => disc(ctx, x + bx * size, cy + by * size, Math.round(br * size), C.oliveDD));
    blobs.forEach(([bx, by, br]) => disc(ctx, x + bx * size - 1, cy + by * size - 1, Math.round(br * size) - 2, C.oliveD));
    for (let i = 0; i < size * 4; i++) {
      const a = r() * Math.PI * 2, d = r() * size * 0.75;
      px(ctx, x + Math.cos(a) * d, cy + Math.sin(a) * d * 0.8 - 1, r() > 0.5 ? C.silver : C.olive);
    }
  }
  function cypress(ctx, x, base, h, col = '#24402A', hi = '#36593A') {
    for (let y = 0; y < h; y++) {
      const t = y / h, w = Math.max(1, Math.round(Math.sin(Math.min(1, t * 1.25) * Math.PI * 0.95) * 5));
      rect(ctx, x - w, base - y, w * 2, 1, col); if (y % 4 === 0) px(ctx, x - w + 1, base - y, hi);
    }
    rect(ctx, x - 1, base - 1, 2, 3, C.trunkD);
  }
  function bushes(ctx, y, n, seed, col = C.oliveD, hi = C.olive) {
    const r = rng(seed);
    for (let i = 0; i < n; i++) { const x = r() * 480, s = 6 + r() * 6; disc(ctx, x, y, s, col); disc(ctx, x - 2, y - 2, s - 3, hi); }
  }
  function torch(ctx, x, base) {
    rect(ctx, x, base - 26, 2, 26, C.trunkD); rect(ctx, x - 2, base - 28, 6, 2, '#5A3A22');
    px(ctx, x, base - 30, '#FFD27A'); px(ctx, x + 1, base - 30, C.sunset); px(ctx, x, base - 31, C.gold); px(ctx, x + 1, base - 29, '#FFD27A');
    return [x + 1, base - 30];
  }
  function stall(ctx, x, base, w, awn) {
    rect(ctx, x, base - 30, 2, 30, C.trunkD); rect(ctx, x + w - 2, base - 30, 2, 30, C.trunkD);
    for (let i = 0; i < w + 6; i++) rect(ctx, x - 3 + i, base - 36 + (i % 2), 1, 7, Math.floor(i / 4) % 2 ? awn : C.parchment);
    rect(ctx, x - 3, base - 29, w + 6, 1, C.ink);
    rect(ctx, x + 1, base - 12, w - 2, 12, C.trunk); rect(ctx, x + 1, base - 12, w - 2, 1, '#8A6440');
    for (let i = 4; i < w - 4; i += 5) { amphora(ctx, x + i, base - 12, i % 10 ? C.terra : C.terraD); }
  }
  function amphora(ctx, x, base, col) {
    rect(ctx, x + 1, base - 7, 1, 1, col); rect(ctx, x, base - 6, 3, 1, col); rect(ctx, x - 1, base - 5, 5, 3, col);
    rect(ctx, x, base - 2, 3, 1, col); rect(ctx, x + 1, base - 1, 1, 1, col); px(ctx, x, base - 5, '#E8A27A');
  }
  function wall(ctx, top, bottom, gx, gw, pal) {
    const p = pal || { a: '#B9A27E', b: '#A48D6B', m: '#7E6A50' };
    rect(ctx, 0, top, 480, bottom - top, p.a);
    for (let y = top; y < bottom; y += 6) {
      rect(ctx, 0, y, 480, 1, p.m);
      for (let x = ((y - top) / 6) % 2 ? 0 : 6; x < 480; x += 12) rect(ctx, x, y, 1, 6, p.m);
    }
    for (let x = 0; x < 480; x += 10) rect(ctx, x, top - 6, 6, 6, p.b);
    rect(ctx, 0, top - 1, 480, 1, p.m);
    // lengkung gerbang
    const cx = gx + gw / 2, r = gw / 2, archTop = top + 10;
    for (let y = archTop; y < bottom; y++) {
      let half = r;
      if (y < archTop + r) { const dy = archTop + r - y; half = Math.sqrt(Math.max(0, r * r - dy * dy)); }
      rect(ctx, cx - half - 3, y, 3, 1, C.marbleS); rect(ctx, cx + half, y, 3, 1, C.marbleS);
      rect(ctx, cx - half, y, half * 2, 1, '#2A2238');
    }
  }
  function birds(ctx, list) {
    list.forEach(([x, y]) => { px(ctx, x - 2, y - 1, C.ink); px(ctx, x - 1, y, C.ink); px(ctx, x, y, C.ink); px(ctx, x + 1, y, C.ink); px(ctx, x + 2, y - 1, C.ink); });
  }
  function houses(ctx, base, seed, tint) {
    const r = rng(seed);
    let x = -4;
    while (x < 480) {
      const w = 16 + Math.round(r() * 18), h = 12 + Math.round(r() * 16);
      rect(ctx, x, base - h, w, h, mix('#E9DCC4', tint, 0.35));
      rect(ctx, x + w - 2, base - h, 2, h, mix('#BFAE90', tint, 0.35));
      for (let i = 0; i < 4; i++) rect(ctx, x - 2 + i, base - h - 1 - i, w + 4 - i * 2, 1, mix(C.terra, tint, 0.3));
      if (r() > 0.4) rect(ctx, x + 4, base - h + 5, 3, 4, '#3A2E3E');
      x += w + 1 + Math.round(r() * 4);
    }
  }

  const DUSK_MARBLE = { m: '#E9C9B6', s: '#B98E9A', d: '#7E5D7A' };
  const NIGHT_MARBLE = { m: '#8D93B5', s: '#646A8E', d: '#3C4166' };
  const DAWN_MARBLE = { m: '#F3DCCB', s: '#C9A5A8', d: '#8E7390' };

  // ---------- Latar tiap scene ----------
  // Tiap fungsi mengembalikan {torches:[[x,y]..], birds:bool} untuk efek DOM.
  const BG = {
    opening(ctx) {
      sky(ctx, SKIES.dusk, 0, 200);
      disc(ctx, 330, 150, 20, '#F6B26B'); disc(ctx, 330, 150, 16, '#F9CF85');
      hill(ctx, 178, 28, '#5B4A6E', 1.2);
      temple(ctx, 168, 152, 112, 20, 9, DUSK_MARBLE, 4);
      hill(ctx, 212, 12, '#4A5A3A', 3.1, 0.03, 0.07);
      ground(ctx, 214, '#5E6B3C', '#6F7E48', 7);
      road(ctx, 240, 206, 270, 8, 260);
      cypress(ctx, 120, 214, 44); cypress(ctx, 360, 214, 38); cypress(ctx, 382, 214, 30);
      olive(ctx, 40, 262, 26, 3); olive(ctx, 110, 268, 20, 5); olive(ctx, 420, 264, 28, 8); olive(ctx, 470, 272, 22, 11);
      return { birds: true };
    },
    agora(ctx) {
      sky(ctx, SKIES.dusk2, 0, 150);
      hill(ctx, 120, 14, '#6B4E72', 2);
      temple(ctx, 360, 108, 60, 12, 6, DUSK_MARBLE, 3);
      const P = DUSK_MARBLE;
      rect(ctx, 20, 70, 440, 12, C.terraD);
      for (let i = 0; i < 440; i += 3) rect(ctx, 20 + i, 70, 1, 12, C.terra);
      rect(ctx, 16, 82, 448, 6, P.m); rect(ctx, 16, 86, 448, 1, P.s);
      rect(ctx, 20, 88, 440, 102, '#5C4366');
      for (let i = 0; i < 11; i++) column(ctx, 28 + i * 42, 88, 192, 8, P);
      tiles(ctx, 192, '#D8C7AE', '#C4B196', 12);
      olive(ctx, 20, 262, 26, 13); olive(ctx, 462, 262, 24, 17);
      return {};
    },
    garden(ctx) {
      sky(ctx, SKIES.dusk, 0, 190);
      hill(ctx, 170, 16, '#5B4A6E', 4.4);
      for (let i = 0; i < 9; i++) cypress(ctx, 30 + i * 55, 196, 36 + (i % 3) * 8);
      ground(ctx, 196, '#56683A', '#668047', 21);
      bushes(ctx, 200, 14, 22);
      road(ctx, 190, 196, 270, 40, 150);
      olive(ctx, 40, 268, 30, 23); olive(ctx, 270, 252, 18, 29);
      return {};
    },
    gate(ctx) {
      sky(ctx, SKIES.dusk, 0, 120);
      hill(ctx, 96, 18, '#5B4A6E', 6);
      temple(ctx, 370, 80, 60, 12, 6, DUSK_MARBLE, 3);
      wall(ctx, 92, 202, 200, 80);
      ground(ctx, 200, '#6E7444', '#7E8550', 31);
      road(ctx, 240, 200, 270, 74, 240);
      olive(ctx, 30, 266, 24, 37); olive(ctx, 120, 272, 18, 41);
      return {};
    },
    classroom(ctx) {
      rect(ctx, 0, 0, 480, 200, '#D9CBB2');
      for (let x = 0; x < 480; x += 2) rect(ctx, x, 0, 1, 200, x % 8 ? '#D9CBB2' : '#CFC0A5');
      rect(ctx, 0, 0, 480, 16, C.terraD); for (let i = 0; i < 480; i += 8) rect(ctx, i, 6, 4, 4, C.gold);
      // jendela senja
      [[40, 40], [290, 40]].forEach(([x, y]) => {
        const g = ctx; const w = 90, h = 90;
        for (let j = 0; j < h; j++) rect(g, x, y + j, w, 1, mix('#6B4A7A', '#F2B66D', j / h));
        disc(g, x + 60, y + 62, 10, '#F9CF85');
        rect(g, x - 3, y - 3, w + 6, 3, C.marbleS); rect(g, x - 3, y + h, w + 6, 4, C.marbleS);
        rect(g, x + w / 2 - 1, y, 2, h, C.marbleS);
      });
      for (let i = 0; i < 6; i++) column(ctx, 6 + i * 92, 16, 202, 10);
      tiles(ctx, 200, '#BFA98A', '#A99375', 14);
      return {};
    },
    market(ctx) {
      sky(ctx, SKIES.night, 0, 170); stars(ctx, 120, 3, 150);
      disc(ctx, 400, 40, 10, '#E9E4CF'); disc(ctx, 404, 37, 9, '#1B1F3B');
      hill(ctx, 130, 16, '#232849', 8);
      temple(ctx, 60, 118, 70, 13, 7, NIGHT_MARBLE, 3);
      houses(ctx, 172, 5, '#1B1F3B');
      ground(ctx, 172, '#3A3240', '#463C4C', 51);
      road(ctx, 240, 172, 270, 160, 480);
      stall(ctx, 30, 214, 70, C.terra); stall(ctx, 380, 214, 70, C.aegean);
      const t = [torch(ctx, 130, 212), torch(ctx, 300, 212), torch(ctx, 462, 214)];
      return { torches: t };
    },
    stoa(ctx) {
      sky(ctx, SKIES.evening, 0, 120); stars(ctx, 30, 7, 60);
      const P = { m: '#D8C3BC', s: '#A88E9C', d: '#6E5A78' };
      rect(ctx, 0, 40, 480, 10, C.terraD); for (let i = 0; i < 480; i += 3) rect(ctx, i, 40, 1, 10, C.terra);
      rect(ctx, 0, 50, 480, 6, P.m); rect(ctx, 0, 54, 480, 1, P.s);
      for (let i = 0; i < 7; i++) column(ctx, 10 + i * 78, 56, 196, 10, P);
      tiles(ctx, 196, '#B9A796', '#A69381', 14);
      // meja batu
      rect(ctx, 150, 186, 120, 6, P.m); rect(ctx, 150, 191, 120, 2, P.s); rect(ctx, 160, 193, 8, 12, P.s); rect(ctx, 252, 193, 8, 12, P.s);
      return { torches: [torch(ctx, 109, 196), torch(ctx, 330, 196)] };
    },
    temple_night(ctx) {
      sky(ctx, SKIES.night, 0, 120); stars(ctx, 90, 11, 60);
      const P = NIGHT_MARBLE;
      rect(ctx, 0, 24, 480, 10, P.m); rect(ctx, 0, 30, 480, 1, P.s);
      for (let i = 0; i < 480; i += 6) rect(ctx, i, 26, 3, 3, P.d);
      rect(ctx, 0, 34, 480, 166, '#262B4E');
      for (let i = 0; i < 6; i++) column(ctx, 12 + i * 92, 34, 202, 16, P);
      rect(ctx, 0, 200, 480, 4, P.s); rect(ctx, 0, 204, 480, 4, P.m);
      tiles(ctx, 208, '#3D4266', '#33385A', 14);
      return { torches: [torch(ctx, 70, 206), torch(ctx, 250, 206)] };
    },
    temple_inside(ctx) {
      rect(ctx, 0, 0, 480, 210, '#1F2342');
      for (let y = 0; y < 210; y += 6) rect(ctx, 0, y, 480, 1, '#232849');
      const P = NIGHT_MARBLE;
      for (let i = 0; i < 6; i++) column(ctx, 8 + i * 92, 0, 212, 18, P);
      tiles(ctx, 210, '#3A3F63', '#30355A', 16);
      return { torches: [torch(ctx, 104, 210), torch(ctx, 22, 210)] };
    },
    amphitheater(ctx) {
      sky(ctx, SKIES.night, 0, 140); stars(ctx, 130, 17, 90);
      hill(ctx, 110, 10, '#232849', 12);
      for (let r = 0; r < 9; r++) {
        const ry = 70 + r * 12, rx = 300 - r * 8;
        for (let a = 0; a <= 180; a += 0.5) {
          const rad = a * Math.PI / 180;
          rect(ctx, 240 + Math.cos(rad) * rx, 214 - Math.sin(rad) * (ry * 0.9) - (8 - r) * 2, 2, 5, r % 2 ? '#7A7FA3' : '#646A8E');
        }
      }
      rect(ctx, 0, 206, 480, 64, '#4A4F75');
      tiles(ctx, 214, '#5A5F86', '#4E537A', 16);
      return { torches: [torch(ctx, 40, 214), torch(ctx, 440, 214)] };
    },
    hill_dawn(ctx) {
      sky(ctx, SKIES.dawn, 0, 200);
      disc(ctx, 120, 150, 22, '#FBE3A8'); disc(ctx, 120, 150, 17, '#FFF3CF');
      hill(ctx, 176, 30, '#8E7390', 9.2);
      temple(ctx, 318, 150, 120, 22, 9, DAWN_MARBLE, 4);
      hill(ctx, 214, 12, '#6F7E48', 2.7, 0.03, 0.07);
      ground(ctx, 216, '#6F7E48', '#80904F', 61);
      olive(ctx, 30, 264, 28, 63); olive(ctx, 450, 266, 30, 67);
      return { birds: true };
    },
    dawn_city(ctx) {
      sky(ctx, SKIES.dawn, 0, 200);
      disc(ctx, 380, 120, 26, '#FBE3A8'); disc(ctx, 380, 120, 20, '#FFF3CF');
      hill(ctx, 150, 34, '#8E7390', 5.5);
      temple(ctx, 180, 118, 120, 20, 9, DAWN_MARBLE, 4);
      houses(ctx, 196, 9, '#F0A79A');
      ground(ctx, 196, '#B9A27E', '#C9B48A', 71);
      road(ctx, 240, 196, 270, 120, 420);
      olive(ctx, 26, 266, 26, 73); olive(ctx, 456, 266, 26, 79);
      return { birds: true };
    }
  };

  // ---------- Sprite karakter (16 × 24) ----------
  // k=garis, s/S=kulit, g/G=janggut, w/W=jubah, b=sandal, e=mata,
  // h=rambut, t/T=tunik. Titik = transparan.
  const SPRITES = {
    socrates: [
      '......kkkk......',
      '.....kssssk.....',
      '....kssssssk....',
      '...kgssssssgk...',
      '...kgsessesgk...',
      '...kgssSSssgk...',
      '...kggggggggk...',
      '....kggGGggk....',
      '....kWgggggWk...',
      '...kwwWgggWwwk..',
      '..kwwwwWgWwwwwk.',
      '..kwwwwwwwwwwwk.',
      '.kswwwwwwwwwwwsk',
      '.kswwwwwwwwwwWsk',
      '..kwwwwwwwwwWWk.',
      '..kwwwwwwwwwWWk.',
      '..kwwWwwwwwwWWk.',
      '..kwwWwwwwwwWWk.',
      '...kwWwwwwwWWk..',
      '...kwWwwwwwWWk..',
      '...kwwwwwwwWWk..',
      '....kkkkkkkkk...',
      '....kbbk.kbbk...',
      '....kkkk.kkkk...'
    ],
    person: [
      '................',
      '................',
      '......kkkk......',
      '.....khhhhk.....',
      '....khhhhhhk....',
      '....khsssshk....',
      '....ksessesk....',
      '....kssSSssk....',
      '.....kssssk.....',
      '......kssk......',
      '....kttttttk....',
      '...kttttttttk...',
      '..ksttttttttsk..',
      '..ksttttttttsk..',
      '..kstttTTtttsk..',
      '...kttttttTTk...',
      '...kttttttTTk...',
      '...kttttttTTk...',
      '....kssk..kssk..',
      '....kssk..kssk..',
      '....kssk..kssk..',
      '....kbbk..kbbk..',
      '....kkkk..kkkk..',
      '................'
    ],
    personLong: [
      '................',
      '................',
      '......kkkk......',
      '.....khhhhk.....',
      '....khhhhhhk....',
      '...khhsssshhk...',
      '...khsesseshk...',
      '...khssSSsshk...',
      '...khhssssshk...',
      '...khhhsskhhk...',
      '...kttttttttk...',
      '..kttttttttttk..',
      '..ksttttttttsk..',
      '..ksttttttttsk..',
      '..kstttTTtttsk..',
      '...kttttttTTk...',
      '...kttttttTTk...',
      '...kttttttTTk...',
      '...kttttttTTk...',
      '....kssk..kssk..',
      '....kssk..kssk..',
      '....kbbk..kbbk..',
      '....kkkk..kkkk..',
      '................'
    ]
  };

  const SKIN = { s: '#E0A878', S: '#B97F55' };
  const PALETTES = {
    socrates: { k: C.ink, s: SKIN.s, S: SKIN.S, g: '#C9C4BA', G: '#8E8A82', w: '#F5EFE0', W: '#CFC6B0', b: '#7A4A2A', e: C.ink },
    statue:   { k: '#6E685E', s: '#D9D3C5', S: '#AFA898', g: '#C9C2B2', G: '#9E978A', w: '#E6E0D2', W: '#BDB6A6', b: '#9E978A', e: '#8F887A' },
    nikos:    { k: C.ink, s: '#C98E62', S: '#9C6A45', h: '#3A2A1E', t: '#6E9A4A', T: '#4E7A3E', b: '#7A4A2A', e: C.ink },
    daphne:   { k: C.ink, s: '#E6B48C', S: '#BE8A62', h: '#2B1E16', t: '#4F8FD6', T: '#3768A8', b: '#7A4A2A', e: C.ink },
    lykos:    { k: C.ink, s: '#D9A070', S: '#AE764C', h: '#7A3E1E', t: '#E8835A', T: '#B8603E', b: '#7A4A2A', e: C.ink },
    student1: { k: C.ink, s: '#E0A878', S: '#B97F55', h: '#4A3020', t: '#C8553D', T: '#8E3A2A', b: '#7A4A2A', e: C.ink },
    student2: { k: C.ink, s: '#C98E62', S: '#9C6A45', h: '#1E1A16', t: '#D9A441', T: '#A87C2E', b: '#7A4A2A', e: C.ink },
    student3: { k: C.ink, s: '#E6B48C', S: '#BE8A62', h: '#6B4A2E', t: '#7A6BB0', T: '#564A88', b: '#7A4A2A', e: C.ink },
    student4: { k: C.ink, s: '#D9A070', S: '#AE764C', h: '#2B2118', t: '#4FA89A', T: '#357A70', b: '#7A4A2A', e: C.ink },
    visitor1: { k: C.ink, s: '#C98E62', S: '#9C6A45', h: '#5A4A3A', t: '#9A7E5E', T: '#76604A', b: '#7A4A2A', e: C.ink },
    visitor2: { k: C.ink, s: '#E0A878', S: '#B97F55', h: '#2B2118', t: '#8E6A9A', T: '#6A4E76', b: '#7A4A2A', e: C.ink },
    visitor3: { k: C.ink, s: '#D9A070', S: '#AE764C', h: '#8A8A8A', t: '#B8A070', T: '#8E7A52', b: '#7A4A2A', e: C.ink }
  };

  // Jenis karakter → peta pixel + palet
  const KINDS = {
    socrates: ['socrates', 'socrates'], statue: ['socrates', 'statue'],
    nikos: ['person', 'nikos'], lykos: ['person', 'lykos'], daphne: ['personLong', 'daphne'],
    student1: ['person', 'student1'], student2: ['person', 'student2'], student3: ['personLong', 'student3'],
    student4: ['person', 'student4'], visitor1: ['person', 'visitor1'], visitor2: ['personLong', 'visitor2'],
    visitor3: ['person', 'visitor3']
  };

  // Gambar peta pixel ke canvas berukuran asli (diperbesar lewat CSS)
  function drawSprite(kind, crop) {
    const [mapName, palName] = KINDS[kind] || KINDS.socrates;
    const map = SPRITES[mapName], pal = PALETTES[palName];
    const c = crop || { x: 0, y: 0, w: 16, h: map.length };
    const cv = document.createElement('canvas');
    cv.width = c.w; cv.height = c.h;
    const ctx = cv.getContext('2d');
    for (let y = 0; y < c.h; y++) {
      const row = map[c.y + y] || '';
      for (let x = 0; x < c.w; x++) {
        const ch = row[c.x + x];
        if (ch && ch !== '.' && pal[ch]) px(ctx, x, y, pal[ch]);
      }
    }
    return cv;
  }
  // Potret kepala untuk kotak dialog
  function portrait(kind) {
    const crop = kind === 'socrates' || kind === 'statue' ? { x: 2, y: 0, w: 12, h: 10 } : { x: 2, y: 2, w: 12, h: 9 };
    return drawSprite(kind, crop);
  }

  function drawBackground(name, ctx) {
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, 480, 270);
    const f = BG[name] || BG.agora;
    return f(ctx) || {};
  }

  window.PX = { C, drawSprite, portrait, drawBackground, KINDS };
})();
