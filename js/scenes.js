/* =====================================================================
   AGORA LOGIKA — scenes.js
   Setiap scene = { id, bg, pipeline, state, ask, setup(E), beats:[fn] }.
   Satu beat = satu tekanan Spasi. Beat yang memanggil E.gate()/E.choices()
   menunggu interaksi sebelum bisa lanjut.
   Teks diambil dari content.js (CONTENT.lines.*).
   Koordinat dalam pixel panggung 1920×1080; kaki karakter di y = 800.
   ===================================================================== */
(function () {
  'use strict';
  const T = window.CONTENT, L = T.lines;
  const GROUND = 800;
  const D = ['done', 'done', 'done', 'done', 'done'];

  const scenes = [

    /* ---------------- 1. OPENING ATHENS ---------------- */
    {
      id: 'opening', bg: 'opening', chrome: false, dialog: false, ask: 'general',
      state: { kartuOn: false, kartu: 0, valid: false, inv: false },
      setup(E) {
        E.prop('title-block', 0, 170, 1920, 0, `
          <h1>${T.meta.title}</h1><p>${T.meta.subtitle}</p>`);
        E.button('Mulai perjalanan', 'btn-primary btn-start', 740, 660, () => E.next());
        const s = E.char('socrates', 'socrates', -120, 900);
        E.after(300, () => E.moveChar(s, 420, 900, 2200));
      },
      beats: [E => { }]
    },

    /* ---------------- 2. INTRODUCTION ---------------- */
    {
      id: 'intro', bg: 'agora', ask: 'general',
      pipeline: ['idle', 'idle', 'idle', 'idle', 'idle'],
      state: { kartuOn: false, kartu: 0, valid: false, inv: false },
      setup(E) {
        E.char('socrates', 'socrates', 300, GROUND);
        const A = T.argument;
        E.st.scroll = E.prop('scroll rolled', 560, 190, 760, 0, `
          <div class="scroll-rod"></div>
          <div class="scroll-paper">
            <p class="scroll-dom">Domain: ${A.domain}</p>
            ${A.natural.map(n => `<div class="srow"><b>${n.tag}</b><span>${n.text}</span></div>`).join('')}
            <div class="valid-box">Valid?</div>
          </div><div class="scroll-rod"></div>`);
      },
      beats: [
        E => { E.say(L.intro.a); document.getElementById('pipeline').classList.add('reveal'); E.stone(0, 'active'); },
        E => { E.say(L.intro.b); E.st.scroll.classList.remove('rolled'); E.sfx.open(); },
        E => { E.say(L.intro.c); E.pulse(document.getElementById('pipeline')); },
        E => {
          E.say(L.intro.d);
          const sc = E.st.scroll; sc.classList.add('clickable');
          const stash = () => {
            if (sc.classList.contains('stashed')) return;
            sc.classList.add('stashed'); E.state.kartuOn = true; E.refreshHud();
            E.pulse(document.getElementById('btn-kartu')); E.sfx.good();
            E.say(L.intro.stashed); E.unlock();
          };
          sc.addEventListener('click', stash);
          E.gate(stash);
        }
      ]
    },

    /* ---------------- 3. PREDICATE ---------------- */
    {
      id: 'predicate', bg: 'garden', ask: 'predicate',
      pipeline: ['done', 'active', 'idle', 'idle', 'idle'],
      state: { kartuOn: true, kartu: 0, valid: false, inv: false },
      setup(E) {
        E.char('socrates', 'socrates', 300, GROUND);
        E.st.lamp = E.prop('lamp', 718, 330, 84, 84, '<span>?</span>');
        E.st.pedestal = E.prop('pedestal', 660, 600, 200, 200,
          `<div class="plaque">${E.M('M(x)', { x: 'x' })}</div>`);
        E.panel.show('Predikat');
      },
      beats: [
        E => {
          E.say(L.predicate.a);
          E.st.line = E.panel.line('M(x)', { links: { x: 'x' } });
          E.panel.text(`${E.M('M(x)')}: x adalah manusia`);
          E.panel.text('x = variabel, kotak kosong yang menunggu diisi', 'note');
          E.st.pedestal.querySelector('.t-v').classList.add('blink');
        },
        E => {
          E.say(L.predicate.q);
          E.st.badge = E.panel.badge('Nilai: ?', 'idle');
          E.choices([
            { html: 'Benar', why: L.predicate.whyTrue },
            { html: 'Salah', why: L.predicate.whyFalse },
            { html: 'Belum bisa ditentukan', correct: true }
          ], {
            right: L.predicate.right, hint: L.predicate.hint, explain: L.predicate.explain,
            hintEl: () => [E.st.pedestal.querySelector('.plaque'), E.st.line],
            onRight: () => E.panel.setBadge(E.st.badge, 'Nilai: belum ada (x kosong)', 'idle')
          });
        },
        E => {
          E.say(L.predicate.drag);
          const s = E.chars.socrates, ped = E.st.pedestal;
          const place = () => {
            if (E.st.placed) return; E.st.placed = true;
            s.classList.add('locked'); s.style.transition = 'left .25s, top .25s';
            s.style.left = (760 - s._w / 2) + 'px'; s.style.top = (604 - s._h) + 'px';
            ped.querySelector('.plaque').innerHTML = E.M('M(s)');
            E.st.lamp.classList.add('on'); E.st.lamp.innerHTML = '<span>✓</span>';
            E.panel.morph(E.st.line, 'M(s)');
            E.panel.text(`${E.M('s')} = konstanta, nama untuk Socrates`, 'note');
            E.panel.setBadge(E.st.badge, `${E.M('M(s)')} = Benar ✓`, 'good');
            E.sfx.good(); E.say(L.predicate.dropped); E.unlock();
          };
          E.draggable(s, [ped], () => { place(); return true; });
          E.gate(place);
        },
        E => { E.say(L.predicate.end); E.stone(1, 'done'); }
      ]
    },

    /* ---------------- 4. DOMAIN ---------------- */
    {
      id: 'domain', bg: 'gate', ask: 'domain',
      pipeline: ['done', 'done', 'active', 'idle', 'idle'],
      state: { kartuOn: true, kartu: 0, valid: false, inv: false },
      setup(E) {
        E.st.gate = E.prop('gate open', 812, 420, 296, 380, '<div class="door l"></div><div class="door r"></div><div class="xbox">x</div>');
        E.st.sign = E.prop('sign', 770, 296, 380, 0, 'Domain: penduduk Athena');
        E.st.sign.dataset.tip = 'Domain = semesta pembicaraan';
        E.char('socrates', 'socrates', 170, GROUND);
        E.char('nikos', 'nikos', 340, GROUND);
        E.prop('cart', 430, 742, 180, 70);
        E.char('statue', 'statue', 520, 752);
        E.panel.show('Domain');
        E.panel.text('<b>Domain:</b> penduduk Athena', 'big');
        E.st.chips = E.panel.text('', 'chips');
      },
      beats: [
        E => { E.say(L.domain.a); E.pulse(E.st.sign); },
        E => {
          E.say(L.domain.q);
          const st = E.st, done = new Set();
          const people = [['socrates', 'Socrates', true], ['nikos', 'Nikos', true], ['statue', 'Patung Socrates', false]];
          const handle = (id) => {
            if (done.has(id)) return; done.add(id);
            const [, name, member] = people.find(p => p[0] === id), el = E.chars[id];
            el.classList.add('locked');
            if (member) {
              E.sfx.good();
              st.chips.insertAdjacentHTML('beforeend', `<span class="chip good">✓ ${name}</span>`);
              E.say(L.domain.member.replace('{name}', name));
              E.moveChar(el, 960, GROUND, 500, () => el.classList.add('entered'));
            } else {
              E.sfx.bad();
              st.gate.classList.remove('open');
              E.tag(el, '✗ bukan penduduk', 'bad');
              st.chips.insertAdjacentHTML('beforeend', `<span class="chip bad">✗ ${name}</span>`);
              E.say(L.domain.statue);
              el.style.transition = 'left .35s, top .35s';
              el.style.left = (520 - el._w / 2) + 'px'; el.style.top = (752 - el._h) + 'px';
              E.after(1200, () => st.gate.classList.add('open'));
            }
            if (done.size === 3) E.unlock();
          };
          people.forEach(([id]) => E.draggable(E.chars[id], [st.gate], el => { handle(el.dataset.id); return true; }));
          E.gate(() => people.forEach(([id]) => handle(id)));
        },
        E => { E.say(L.domain.end); E.stone(2, 'done'); }
      ]
    },

    /* ---------------- 5a. QUANTIFIER — KELAS (∀) ---------------- */
    {
      id: 'class', bg: 'classroom', ask: 'quantifier',
      pipeline: ['done', 'done', 'done', 'active', 'idle'],
      state: { kartuOn: true, kartu: 0, valid: false, inv: false },
      setup(E) {
        E.char('socrates', 'socrates', 230, GROUND);
        E.prop('sign small', 380, 140, 420, 0, 'Domain: murid Socrates');
        E.st.students = [
          E.char('st1', 'student1', 460, GROUND, { scale: 6 }), E.char('st2', 'student2', 600, GROUND, { scale: 6 }),
          E.char('lykos', 'lykos', 740, 770, { scale: 5, cls: 'backrow' }),
          E.char('st3', 'student3', 880, GROUND, { scale: 6 }), E.char('st4', 'student4', 1020, GROUND, { scale: 6 })
        ];
        E.panel.show('Kuantor universal');
      },
      beats: [
        E => {
          E.say(L.class.a);
          E.panel.text('<b>Domain:</b> murid Socrates');
          E.panel.def('T(x)', 'x sudah mengerjakan tugas');
        },
        E => {
          E.say(L.class.b);
          E.st.line = E.panel.line('∀x T(x)', { cls: 'big' });
          E.st.badge = E.panel.badge('Nilai: ?', 'idle');
        },
        E => {
          E.say(L.class.c);
          const st = E.st;
          const check = el => {
            if (el.classList.contains('checked')) return;
            el.classList.add('checked'); E.sfx.click();
            if (el.dataset.id === 'lykos') {
              E.tag(el, '✗ belum · contoh tandingan', 'bad');
              E.panel.setBadge(st.badge, `${E.M('∀x T(x)')} = Salah ✗`, 'bad');
              E.sfx.bad(); E.say(L.class.found); E.unlock();
            } else { E.tag(el, '✓ sudah', 'good'); if (!E.fast) E.say(L.class.ok); }
          };
          st.students.forEach(el => { el.classList.add('clickable'); el.addEventListener('click', () => check(el)); });
          E.gate(() => st.students.forEach(check));
        },
        E => {
          E.say(L.class.d);
          const st = E.st; let on = false;
          st.students.forEach(el => el.classList.remove('clickable'));
          const lyk = E.chars.lykos;
          const btn = E.button('Uji: Lykos menyelesaikan tugas', 'btn-secondary btn-test', 380, 230, () => toggle());
          const toggle = () => {
            on = !on;
            E.tag(lyk, on ? '✓ sudah' : '✗ belum · contoh tandingan', on ? 'good' : 'bad');
            E.panel.setBadge(st.badge, `${E.M('∀x T(x)')} = ${on ? 'Benar ✓' : 'Salah ✗'}`, on ? 'good' : 'bad');
            btn.textContent = on ? 'Uji: Lykos belum selesai' : 'Uji: Lykos menyelesaikan tugas';
            if (E.gated) { E.say(L.class.toggled); E.unlock(); }
          };
          E.gate(toggle);
        }
      ]
    },

    /* ---------------- 5b. QUANTIFIER — PASAR (∃) ---------------- */
    {
      id: 'market', mapAs: 'class', bg: 'market', ask: 'quantifier',
      pipeline: ['done', 'done', 'done', 'active', 'idle'],
      state: { kartuOn: true, kartu: 0, valid: false, inv: false },
      setup(E) {
        E.char('socrates', 'socrates', 220, GROUND);
        E.prop('sign small night', 380, 140, 420, 0, 'Domain: orang di pasar');
        E.st.chest = E.prop('chest', 330, 712, 96, 84);
        E.st.people = [
          E.char('v1', 'visitor1', 520, GROUND), E.char('daphne', 'daphne', 680, GROUND),
          E.char('v2', 'visitor2', 850, GROUND), E.char('v3', 'visitor3', 1010, GROUND)
        ];
        E.panel.show('Kuantor eksistensial');
      },
      beats: [
        E => {
          E.say(L.market.a);
          E.panel.text('<b>Domain:</b> orang di pasar');
          E.panel.def('B(x)', 'x bijak');
        },
        E => {
          E.say(L.market.b);
          E.st.line = E.panel.line('∃x B(x)', { cls: 'big' });
          E.st.badge = E.panel.badge('Nilai: ?', 'idle');
        },
        E => {
          E.say(L.market.c);
          const st = E.st;
          const reveal = el => {
            if (el.dataset.id === 'daphne') {
              if (st.found) return; st.found = true;
              el.classList.add('lit');
              E.tag(el, '✓ bijak', 'good'); st.chest.classList.add('open');
              E.panel.setBadge(st.badge, `${E.M('∃x B(x)')} = Benar ✓`, 'good');
              E.sfx.good(); E.say(L.market.found); E.unlock();
            } else { E.tag(el, 'bukan', 'info'); if (!st.found && !E.fast) E.say(L.market.notWise); }
          };
          E.lantern(st.people, reveal);
          E.gate(() => reveal(E.chars.daphne));
        },
        E => {
          E.say(L.market.d);
          const st = E.st, dap = E.chars.daphne; let gone = false;
          const btn = E.button('Uji: Daphne pulang', 'btn-secondary btn-test', 380, 230, () => toggle());
          const toggle = () => {
            gone = !gone;
            dap.classList.toggle('gone', gone); st.chest.classList.toggle('open', !gone);
            E.panel.setBadge(st.badge, gone ? `${E.M('∃x B(x)')} = Salah ✗ (tidak ada satu pun)` : `${E.M('∃x B(x)')} = Benar ✓`, gone ? 'bad' : 'good');
            btn.textContent = gone ? 'Uji: Daphne kembali' : 'Uji: Daphne pulang';
            if (E.gated) { E.say(L.market.toggled); E.unlock(); }
          };
          E.gate(toggle);
        },
        E => {
          E.say(L.market.e);
          E.prop('banner', 380, 330, 700, 0, `${E.M('∀')} menuntut semua, ${E.M('∃')} cukup satu`);
          E.stone(3, 'done');
        }
      ]
    },

    /* ---------------- 6. INTERACTIVE EXAMPLE: PENERJEMAH ---------------- */
    {
      id: 'example', bg: 'stoa', ask: 'translate',
      pipeline: ['done', 'done', 'done', 'done', 'active'],
      state: { kartuOn: true, kartu: 0, valid: false, inv: false },
      setup(E) {
        E.char('socrates', 'socrates', 200, GROUND);
        E.char('lykos', 'lykos', 350, GROUND);
        E.st.sentence = E.prop('sentence', 420, 140, 720, 0, `
          <span class="word" data-w="semua" data-link="q">Semua</span>
          <span class="word" data-w="R" data-link="R">murid Socrates</span>
          <span class="word" data-w="T" data-link="T">sudah mengerjakan tugas</span>.`);
        const names = T.pipeline.map(p => p.name);
        E.st.plates = E.prop('plates', 420, 360, 720, 0,
          names.map((n, i) => `<div class="plate" data-i="${i}"><span class="pnum">${i + 1}</span>${n}</div>`).join(''));
        E.panel.show('Penerjemah Socrates');
      },
      beats: [
        E => {
          E.say(L.example.a, 'lykos');
          E.st.plates.children[0].classList.add('done');
          E.panel.text('Kalimat: <i>"Semua murid Socrates sudah mengerjakan tugas."</i>');
        },
        E => {
          E.say(L.example.b);
          const st = E.st, tagged = new Set();
          const defs = { R: ['R(x)', 'x murid Socrates'], T: ['T(x)', 'x sudah mengerjakan tugas'] };
          const tag = w => {
            if (w === 'semua') { E.sfx.bad(); E.say(L.example.semua); return; }
            if (tagged.has(w)) return; tagged.add(w);
            const word = st.sentence.querySelector(`[data-w="${w}"]`);
            word.classList.add('tagged', 'tag-' + w); word.insertAdjacentHTML('beforeend', `<sup>${w}</sup>`);
            E.panel.def(defs[w][0], defs[w][1], { links: { [w]: w } });
            E.sfx.good();
            if (tagged.size === 2) { st.plates.children[1].classList.add('done'); E.say(L.example.predsDone); E.unlock(); }
          };
          st.sentence.querySelectorAll('.word').forEach(w => { w.classList.add('clickable'); w.addEventListener('click', () => tag(w.dataset.w)); });
          E.gate(() => { tag('R'); tag('T'); });
        },
        E => {
          const st = E.st;
          st.sentence.querySelectorAll('.word').forEach(w => w.classList.remove('clickable'));
          const nik = E.char('nikos', 'nikos', -100, GROUND);
          E.moveChar(nik, 520, GROUND, 1400);
          E.say(L.example.c);
          st.domLine = E.panel.text('<b>Domain:</b> penduduk Athena');
          E.choices([{ html: 'Ya, anggota domain', correct: true }, { html: 'Bukan', why: L.example.cWhy }], {
            right: L.example.cRight, hint: L.example.cHint, explain: L.example.cExplain,
            hintEl: () => st.domLine,
            onRight: () => { st.plates.children[2].classList.add('done'); E.tag(nik, 'anggota domain', 'info'); }
          });
        },
        E => {
          const st = E.st;
          E.say(L.example.d);
          E.choices([{ html: E.M('∀') + ' untuk setiap', correct: true }, { html: E.M('∃') + ' terdapat', why: L.example.dWhy }], {
            right: L.example.dRight, hint: L.example.dHint, explain: L.example.dExplain, letters: false,
            onRight: () => {
              st.plates.children[3].classList.add('done');
              st.formula = E.panel.line('∀x (R(x) ? T(x))', { cls: 'big formula', links: { '∀': 'q', R: 'R', T: 'T' } });
            }
          });
        },
        E => {
          const st = E.st, nik = E.chars.nikos;
          E.say(L.example.e);
          E.choices([{ html: E.M('→') + ' jika … maka', correct: true }, { html: E.M('∧') + ' dan', why: L.example.eWhy }], {
            right: L.example.eRight, hint: L.example.eHint, explain: L.example.eExplain, letters: false,
            onWrong: () => {
              st.struck = E.panel.line('∀x (R(x) ∧ T(x))', { cls: 'struck', step: false });
              E.tag(nik, '✗ bukan murid · contoh tandingan', 'bad');
            },
            onRight: () => {
              if (st.struck) st.struck.remove();
              E.tag(nik, 'anggota domain', 'info');
              E.panel.morph(st.formula, '∀x (R(x) → T(x))', { links: { '∀': 'q', R: 'R', T: 'T' }, cls: 'mline big formula final' });
              st.plates.children[4].classList.add('done');
            }
          });
        },
        E => {
          E.say(L.example.f);
          E.panel.clear();
          E.panel.text('Kalimat Lykos:', 'note');
          E.panel.line('∀x (R(x) → T(x))', { cls: 'big final', links: { '∀': 'q', R: 'R', T: 'T' } });
          E.panel.text('Dua pola dari materi:', 'note');
          E.panel.def('∀x (M(x) → F(x))', '"Semua M adalah F"', { cls: 'pattern' });
          E.panel.def('∃x (M(x) ∧ F(x))', '"Ada M yang F"', { cls: 'pattern' });
          E.stone(4, 'done');
        }
      ]
    },

    /* ---------------- 7. MAIN PROBLEM ---------------- */
    {
      id: 'main', bg: 'temple_night', ask: 'translate', pipeline: D,
      state: { kartuOn: true, kartu: 0, valid: false, inv: false },
      setup(E) {
        E.char('socrates', 'socrates', 220, GROUND);
        E.panel.show('Kasus utama');
        const A = T.argument;
        E.panel.text(`<b>Domain:</b> ${A.domain}`);
        E.panel.text(A.key.map(([f, t]) => `${E.M(f)} ${t}`).join(' &nbsp;·&nbsp; '), 'note');
        E.st.rows = A.natural.map((n, i) => {
          if (i === 2) E.st.gap = E.panel.text('<span class="gap-q">?</span>', 'gap');
          const el = E.panel.text(`<b class="rtag">${n.tag}</b><span class="rbody">${n.text}</span>`, 'arg-row');
          el.dataset.i = i; return el;
        });
        E.st.cards = E.prop('jurus-row', 380, 250, 720, 0, T.jurus.map(j =>
          `<button class="btn btn-scroll ${j.id === 'EI' ? 'ei' : ''}" data-j="${j.id}">${j.id}</button>`).join(''));
        E.st.cards.hidden = true;
        E.st.card = E.prop('jurus-card', 380, 360, 720, 0); E.st.card.hidden = true;
      },
      beats: [
        E => {
          E.say(L.main.a);
          const st = E.st, A = T.argument, done = new Set();
          const morph = el => {
            const i = +el.dataset.i; if (done.has(i)) return; done.add(i);
            el.classList.remove('clickable');
            const body = el.querySelector('.rbody');
            const swap = () => { body.innerHTML = E.M(A.natural[i].formula, { M: 'M', F: 'F' }); E.animateTokens(body, 0, 80); };
            if (E.fast) swap(); else { body.classList.add('morph-out'); setTimeout(() => { body.classList.remove('morph-out'); swap(); }, 260); }
            E.sfx.click();
            if (done.size === 3) { E.state.kartu = 1; E.say(L.main.done); E.unlock(); }
          };
          st.rows.forEach(el => { el.classList.add('clickable'); el.addEventListener('click', () => morph(el)); });
          E.gate(() => st.rows.forEach(morph));
        },
        E => {
          E.say(L.main.b);
          const st = E.st, seen = new Set();
          E.state.inv = true; E.refreshHud(); E.pulse(document.getElementById('btn-tas'));
          st.cards.hidden = false;
          const show = id => {
            const j = T.jurus.find(x => x.id === id);
            st.card.hidden = false;
            st.card.innerHTML = `<div class="jid">${j.id}</div><div class="jname">${j.name}</div>
              <div class="jrule">${E.M(j.rule)}</div><p>${j.meaning}</p>${j.note ? `<p class="jnote">${j.note}</p>` : ''}`;
            E.animateTokens(st.card.querySelector('.jrule'), 0, 70); E.fadeIn(st.card);
            st.cards.querySelector(`[data-j="${id}"]`).classList.add('seen');
            seen.add(id);
            if (['UI', 'MP', 'EG'].every(x => seen.has(x)) && E.gated) E.unlock();
          };
          st.cards.querySelectorAll('button').forEach(b => b.addEventListener('click', () => { E.sfx.open(); show(b.dataset.j); }));
          E.gate(() => ['UI', 'MP', 'EG'].forEach(show));
        },
        E => {
          E.say(L.main.c);
          E.button('Mulai quest', 'btn-primary btn-quest', 600, 640, () => E.next());
        }
      ]
    },

    /* ---------------- 8. STEP-BY-STEP SOLUTION ---------------- */
    {
      id: 'solution', bg: 'temple_inside', ask: 'solution', pipeline: D,
      state: { kartuOn: true, kartu: 1, valid: false, inv: true },
      setup(E) {
        E.char('socrates', 'socrates', 230, GROUND);
        E.panel.show('Quest: dari premis ke kesimpulan', { wide: true });
        const body = E.panel.body;
        body.insertAdjacentHTML('beforeend', `
          <div class="proof">
            <svg class="proof-arrows" width="70" height="380"><defs><marker id="pa" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0L10 5L0 10z" fill="#D9A441"/></marker></defs></svg>
            <div class="prow head"><span>No</span><span>Pernyataan</span><span>Alasan</span></div>
            ${[1, 2, 3, 4, 5].map(n => `<div class="prow" data-r="${n}"><span class="pno">${n}</span><span class="pst"></span><span class="prs"></span></div>`).join('')}
          </div>`);
        E.st.row = n => body.querySelector(`.prow[data-r="${n}"]`);
      },
      beats: [
        E => {
          E.say(L.solution.a);
          fillRow(E, 1, 0); fillRow(E, 2, 400);
        },
        ...T.proofSteps.map((step, k) => E => {
          E.say(step.ask);
          const r = E.st.row(step.row); r.classList.add('current');
          E.choices(T.jurus.map(j => ({ html: `<b>${j.id}</b> <small>${j.name}</small>`, correct: j.id === step.correct, why: step.why[j.id] })), {
            container: E.panel.foot, cls: 'jurus-choice', letters: false,
            right: step.right, hint: step.hint, explain: step.explain,
            hintEl: () => step.row === 3 ? [E.st.row(1).querySelector('.t-q')] : [E.st.row(step.row - 1)],
            onRight: () => {
              r.classList.remove('current');
              if (step.row === 5) {
                const s = E.chars.socrates; s.classList.add('spot');
                E.tag(s, 's anggota domain ✓', 'good');
              }
              fillRow(E, step.row, 0);
              drawArrows(E, step.row);
            }
          });
        }),
        E => {
          E.say(L.solution.valid);
          E.panel.foot.innerHTML = '';
          const v = T.validNote;
          E.panel.foot.insertAdjacentHTML('beforeend', `<div class="valid-note">${v.confirm ? '<span class="confirm">Konfirmasi dosen</span>' : ''}${v.text}</div>`);
          const stamp = E.prop('stamp', 36, 220, 420, 0, 'VALID ✓');
          if (!E.fast) E.sfx.stamp(); E.fadeIn(stamp);
          E.state.kartu = 2; E.state.valid = true;
        }
      ]
    },

    /* ---------------- 9. INTERACTIVE QUIZ ---------------- */
    {
      id: 'quiz', bg: 'amphitheater', ask: 'translate', pipeline: D,
      state: { kartuOn: true, kartu: 2, valid: true, inv: true },
      setup(E) {
        E.char('socrates', 'socrates', 230, GROUND);
        E.st.crowd = ['student1', 'student2', 'lykos', 'student3', 'student4', 'nikos', 'daphne']
          .map((k, i) => E.char('c' + i, k, 420 + i * 110, 560, { scale: 4, cls: 'crowd' }));
        E.st.score = 0;
        E.panel.show('Jebakan Agora <span class="laurels"><i></i><i></i><i></i></span>');
      },
      beats: [
        E => { E.say(L.quiz.a); },
        ...T.quiz.map((q, k) => E => {
          E.panel.clear();
          E.panel.text(`<span class="qnum">Soal ${k + 1} dari 3</span>`, 'note');
          E.panel.text(E.rich(q.q), 'question');
          E.say(q.q);
          E.choices(q.options.map(o => ({ html: E.rich(o.label), correct: !!o.correct, why: o.why })), {
            container: E.panel.foot, cls: 'quiz-choice',
            right: q.right, hint: q.hint, explain: q.explain,
            hintEl: () => [E.panel.body.querySelector('.question')],
            onRight: wrong => {
              if (wrong === 0) { E.st.score++; E.panel.title.querySelectorAll('.laurels i')[k].classList.add('on'); }
              E.st.crowd.forEach((c, i) => { c.classList.remove('cheer'); void c.offsetWidth; c.style.animationDelay = (i * 60) + 'ms'; c.classList.add('cheer'); });
            }
          });
        }),
        E => {
          E.panel.clear();
          E.panel.text(`<div class="crown">${E.st.score} / 3</div><p>daun laurel dari jawaban pertama</p>`, 'result');
          E.say(L.quiz.end.replace('{score}', E.st.score));
        }
      ]
    },

    /* ---------------- 10. SUMMARY ---------------- */
    {
      id: 'summary', bg: 'hill_dawn', ask: 'general', pipeline: D,
      state: { kartuOn: true, kartu: 2, valid: true, inv: true },
      setup(E) {
        E.char('socrates', 'socrates', 230, GROUND);
        E.st.scroll = E.prop('summary-scroll', 370, 150, 840, 0, '<ol class="sum-list"></ol>');
      },
      beats: [0, 1, 2].map(i => E => {
        E.say([L.summary.a, L.summary.b, L.summary.c][i]);
        const s = T.summary[i], li = document.createElement('li');
        li.innerHTML = `<span class="snum">${i + 1}</span><span>${E.rich(s.text)}</span><span class="sgo">Kembali ke scene</span>`;
        li.addEventListener('click', () => E.goScene(E.sceneIndex(s.scene)));
        E.st.scroll.querySelector('ol').appendChild(li); E.fadeIn(li);
      }).concat([E => {
        E.say(L.summary.d);
        E.button('Buka Kartu Argumen', 'btn-primary', 620, 640, () => E.openOverlay('kartu'));
      }])
    },

    /* ---------------- 11. CLOSING ---------------- */
    {
      id: 'closing', bg: 'dawn_city', ask: 'general', pipeline: D,
      state: { kartuOn: true, kartu: 2, valid: true, inv: true },
      setup(E) {
        E.prop('title-block end', 0, 170, 1920, 0, `<h1>Quest selesai</h1><p>Tulis pertanyaanmu di kolom komentar</p>`);
        ['student1', 'student2', 'lykos', 'nikos', 'daphne', 'student3', 'student4']
          .forEach((k, i) => E.char('e' + i, k, 520 + i * 130, 760, { scale: 6, cls: 'waver' }));
        const s = E.char('socrates', 'socrates', 300, GROUND, { cls: 'waver' });
        E.button('Ulangi perjalanan', 'btn-secondary', 640, 470, () => E.goScene(0));
        E.button('Buka peta', 'btn-secondary', 1010, 470, () => E.openOverlay('map'));
      },
      beats: [E => { E.say(L.closing.a); }]
    }
  ];

  /* ---------- helper untuk tabel bukti ---------- */
  function fillRow(E, n, delay) {
    const r = E.st.row(n), [stmt, reason] = T.argument.proof[n - 1];
    if (r.classList.contains('filled')) return;
    r.classList.add('filled');
    r.querySelector('.pst').innerHTML = E.M(stmt);
    r.querySelector('.prs').textContent = reason;
    E.animateTokens(r.querySelector('.pst'), delay, 70);
    E.fadeIn(r.querySelector('.prs'));
  }
  const DEPS = { 3: [1], 4: [2, 3], 5: [4] };
  function drawArrows(E, n) {
    const svg = E.panel.body.querySelector('.proof-arrows');
    const proof = E.panel.body.querySelector('.proof');
    const y = k => { const r = E.st.row(k); return r.offsetTop + r.offsetHeight / 2; };
    const LANE = { '1-3': 40, '2-4': 24, '3-4': 58, '4-5': 50 };
    (DEPS[n] || []).forEach(from => {
      const x = LANE[from + '-' + n];
      const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      p.setAttribute('d', `M66 ${y(from)} H${x} V${y(n)} H66`);
      p.setAttribute('marker-end', 'url(#pa)');
      p.setAttribute('class', 'dep');
      svg.appendChild(p);
    });
    svg.setAttribute('height', proof.offsetHeight);
  }

  window.SCENES = scenes;
})();
