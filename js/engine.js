/* =====================================================================
   AGORA LOGIKA — engine.js
   Mesin presentasi: tempo per "beat", dialog, panel notasi,
   pilihan jawaban dengan umpan balik Socratic, seret-lepas,
   transisi pixel, overlay (Ask, Kartu, Jurus, Peta), dan suara.
   Biasanya kamu TIDAK perlu mengubah file ini.
   ===================================================================== */
(function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const T = window.CONTENT;
  const W = 1920, H = 1080;

  const stage = $('#stage'), world = $('#world'), fx = $('#fx'), dark = $('#dark');
  const bgCtx = $('#bg').getContext('2d');
  const dlg = $('#dialog'), dlgText = $('#dlg-text'), speakerEl = $('#speaker'),
    choicesEl = $('#choices'), portraitBox = $('#portrait'), indicator = $('#next-ind');
  const panel = $('#panel'), panelTitle = $('#panel-title'), panelBody = $('#panel-body'), panelFoot = $('#panel-foot');

  const E = {
    scenes: [], idx: 0, beat: 0, gated: false, solver: null, fast: false,
    st: {}, chars: {}, scale: 1, muted: false,
    state: { kartuOn: false, kartu: 0, valid: false, inv: false }
  };
  window.E = E;

  /* ---------------- Skala panggung (responsif) ---------------- */
  E.fit = function () {
    const s = Math.min(window.innerWidth / W, window.innerHeight / H);
    E.scale = s;
    stage.style.transform = `translate(-50%, -50%) scale(${s})`;
  };
  E.toStage = function (clientX, clientY) {
    const r = stage.getBoundingClientRect();
    return { x: (clientX - r.left) / E.scale, y: (clientY - r.top) / E.scale };
  };
  E.rectOf = function (el) {
    const r = el.getBoundingClientRect(), s = stage.getBoundingClientRect();
    return { x: (r.left - s.left) / E.scale, y: (r.top - s.top) / E.scale, w: r.width / E.scale, h: r.height / E.scale };
  };

  /* ---------------- Timer per scene ---------------- */
  let timers = [];
  E.after = function (ms, fn) {
    if (E.fast || E.reduced()) { fn(); return; }
    timers.push(setTimeout(fn, ms));
  };
  function clearTimers() { timers.forEach(clearTimeout); timers = []; }
  E.reduced = () => document.body.classList.contains('reduce-motion');

  /* ---------------- Suara 8-bit (WebAudio, tanpa file) ---------------- */
  let actx = null;
  function beep(seq, type = 'square', vol = 0.045) {
    if (E.muted || E.fast) return;
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      let t = actx.currentTime;
      seq.forEach(([f, d]) => {
        const o = actx.createOscillator(), g = actx.createGain();
        o.type = type; o.frequency.value = f; g.gain.setValueAtTime(vol, t);
        g.gain.exponentialRampToValueAtTime(0.0001, t + d);
        o.connect(g); g.connect(actx.destination); o.start(t); o.stop(t + d); t += d * 0.9;
      });
    } catch (e) { /* audio tidak tersedia */ }
  }
  E.sfx = {
    good: () => beep([[660, 0.08], [990, 0.14]]),
    bad: () => beep([[220, 0.1], [160, 0.16]], 'sawtooth', 0.03),
    click: () => beep([[520, 0.04]], 'square', 0.025),
    stamp: () => beep([[523, 0.09], [659, 0.09], [784, 0.09], [1046, 0.3]]),
    open: () => beep([[392, 0.05], [523, 0.08]], 'triangle', 0.05)
  };

  /* ---------------- Tokenizer formula → HTML berwarna ---------------- */
  const OPS = '→∧∨¬↔⊢∴', QS = '∀∃';
  function esc(s) { return s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
  E.M = function (str, links = {}) {
    let out = '';
    for (let i = 0; i < str.length; i++) {
      const ch = str[i], nx = str[i + 1];
      const link = links[ch] ? ` data-link="${links[ch]}"` : '';
      if (ch === ' ') { out += '<span class="sp"> </span>'; continue; }
      if (QS.includes(ch)) out += `<span class="tok t-q" data-tip="${T.symbols[ch]}"${link}>${ch}</span>`;
      else if (OPS.includes(ch)) out += `<span class="tok t-op" data-tip="${esc(T.symbols[ch] || '')}"${link}>${ch}</span>`;
      else if (ch === '?') out += `<span class="tok t-slot">&nbsp;</span>`;
      else if ('(),'.includes(ch)) out += `<span class="tok t-pun">${ch}</span>`;
      else if (/[A-Z]/.test(ch) && nx === '(') out += `<span class="tok t-p"${link}>${ch}</span>`;
      else if (/[A-Z]/.test(ch)) out += `<span class="tok t-meta">${ch}</span>`;
      else if ('xy'.includes(ch)) out += `<span class="tok t-v" data-tip="variabel"${link}>${ch}</span>`;
      else if ('scd'.includes(ch)) out += `<span class="tok t-c" data-tip="konstanta"${link}>${ch}</span>`;
      else out += `<span class="tok">${esc(ch)}</span>`;
    }
    return `<span class="math">${out}</span>`;
  };
  // Teks dialog: {{formula}} diwarnai, sisanya di-escape
  E.rich = function (text) {
    return text.split(/(\{\{.*?\}\})/).map(part =>
      part.startsWith('{{') ? E.M(part.slice(2, -2)) : esc(part)).join('');
  };
  E.animateTokens = function (el, base = 0, step = 110) {
    if (E.fast || E.reduced()) return;
    el.querySelectorAll('.tok, .sp').forEach((t, i) => {
      t.classList.remove('enter'); void t.offsetWidth;
      t.style.animationDelay = (base + i * step) + 'ms'; t.classList.add('enter');
    });
  };

  /* ---------------- Dialog dengan efek mesin tik ---------------- */
  const SPEAKERS = { socrates: 'Socrates', lykos: 'Lykos' };
  let typing = null, lastLine = null;
  E.say = function (text, who = 'socrates') {
    lastLine = { text, who };
    speakerEl.textContent = SPEAKERS[who] || who;
    portraitBox.innerHTML = ''; portraitBox.appendChild(PX.portrait(who));
    stopTyping();
    dlgText.innerHTML = E.rich(text);
    const nodes = []; const walker = document.createTreeWalker(dlgText, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) nodes.push(walker.currentNode);
    if (E.fast || E.reduced()) { updateIndicator(); return; }
    const full = nodes.map(n => n.textContent); nodes.forEach(n => n.textContent = '');
    let ni = 0, ci = 0;
    setTalking(who, true);
    typing = { nodes, full, timer: setInterval(() => {
      for (let k = 0; k < 2; k++) {
        if (ni >= nodes.length) { E.finishTyping(); return; }
        ci++; nodes[ni].textContent = full[ni].slice(0, ci);
        if (ci >= full[ni].length) { ni++; ci = 0; }
      }
    }, 45) };
    updateIndicator();
  };
  function stopTyping() { if (typing) { clearInterval(typing.timer); typing = null; } }
  E.finishTyping = function () {
    if (!typing) return false;
    typing.nodes.forEach((n, i) => n.textContent = typing.full[i]);
    stopTyping(); setTalking(null, false); updateIndicator(); return true;
  };
  function setTalking(who, on) {
    Object.values(E.chars).forEach(c => c.classList.remove('talking'));
    if (on && E.chars[who]) E.chars[who].classList.add('talking');
  }
  function updateIndicator() {
    indicator.className = typing ? 'typing' : E.gated ? 'waiting' : 'ready';
    indicator.textContent = typing ? '' : E.gated ? 'Menunggu jawaban' : 'Spasi untuk lanjut';
    if (E.chars.socrates) E.chars.socrates.classList.toggle('thinking', E.gated && !typing);
  }
  E.updateIndicator = updateIndicator;

  /* ---------------- Gate: beat menunggu interaksi ---------------- */
  E.gate = function (solver) { E.gated = true; E.solver = solver; updateIndicator(); };
  E.unlock = function () { E.gated = false; E.solver = null; updateIndicator(); };

  /* ---------------- Pilihan jawaban (umpan balik 3 tingkat) ---------------- */
  // options: [{html, correct, why}] · cfg: {container, right, hint, hintEl, explain, onRight, onWrong, who, cls}
  E.choices = function (options, cfg = {}) {
    const box = cfg.container || choicesEl;
    box.innerHTML = '';
    const correctIdx = options.findIndex(o => o.correct);
    let wrong = 0, done = false, hinted = null;
    const btns = options.map((o, i) => {
      const b = document.createElement('button');
      b.className = 'btn btn-choice ' + (cfg.cls || '');
      b.innerHTML = (cfg.letters === false ? '' : `<span class="letter">${'ABCD'[i]}</span>`) + `<span class="lbl">${o.html}</span>`;
      b.addEventListener('click', () => pick(i));
      box.appendChild(b); return b;
    });
    function clearHint() { if (hinted) { hinted.forEach(h => h.classList.remove('hint-glow')); hinted = null; } }
    function win(text) {
      done = true; clearHint();
      btns[correctIdx].classList.add('is-right');
      btns.forEach(b => b.disabled = true);
      if (text) E.say(text, cfg.who);
      E.sfx.good();
      cfg.onRight && cfg.onRight(wrong);
      E.unlock();
    }
    function pick(i) {
      if (done) return;
      E.sfx.click();
      if (i === correctIdx) { win(cfg.right); return; }
      wrong++; btns[i].classList.add('is-wrong'); btns[i].disabled = true; E.sfx.bad();
      cfg.onWrong && cfg.onWrong(i, wrong);
      if (wrong === 1) E.say(options[i].why || cfg.hint || cfg.explain, cfg.who);
      else if (wrong === 2) {
        E.say(cfg.hint || cfg.explain, cfg.who);
        const els = cfg.hintEl ? [].concat(cfg.hintEl()) : [];
        els.forEach(h => h && h.classList.add('hint-glow')); hinted = els;
      } else win(cfg.explain);
    }
    E.gate(() => { if (!done) win(cfg.right); });
    return { pick, buttons: btns };
  };

  /* ---------------- Panel notasi ---------------- */
  E.panel = {
    show(title, opts = {}) {
      panel.classList.remove('hidden'); panel.classList.toggle('wide', !!opts.wide);
      panelTitle.innerHTML = title; panelBody.innerHTML = ''; panelFoot.innerHTML = '';
    },
    hide() { panel.classList.add('hidden'); panel.classList.remove('wide'); },
    clear() { panelBody.innerHTML = ''; panelFoot.innerHTML = ''; },
    body: panelBody, foot: panelFoot, title: panelTitle,
    // Baris formula yang muncul simbol demi simbol
    line(formula, opts = {}) {
      const el = document.createElement('div');
      el.className = 'mline ' + (opts.cls || '');
      el.innerHTML = E.M(formula, opts.links);
      (opts.parent || panelBody).appendChild(el);
      if (opts.step !== false) E.animateTokens(el, opts.delay || 0);
      return el;
    },
    // Definisi: formula + arti
    def(formula, text, opts = {}) {
      const el = document.createElement('div');
      el.className = 'pdef ' + (opts.cls || '');
      el.innerHTML = `${E.M(formula, opts.links)}<span class="pdef-text">${E.rich(text)}</span>`;
      (opts.parent || panelBody).appendChild(el);
      E.fadeIn(el); E.animateTokens(el, 0, 70);
      return el;
    },
    text(html, cls = '') {
      const el = document.createElement('div');
      el.className = 'ptext ' + cls; el.innerHTML = html;
      panelBody.appendChild(el); E.fadeIn(el); return el;
    },
    badge(label, kind = 'idle', parent) {
      const el = document.createElement('div');
      el.className = 'truth ' + kind; el.innerHTML = label;
      (parent || panelBody).appendChild(el); return el;
    },
    setBadge(el, label, kind) {
      el.className = 'truth ' + kind; el.innerHTML = label;
      if (!E.fast) { el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop'); }
    },
    morph(el, formula, opts = {}) {
      const swap = () => {
        el.classList.remove('morph-out');
        el.innerHTML = opts.html || E.M(formula, opts.links);
        if (opts.cls) el.className = opts.cls;
        E.animateTokens(el, 0, 90);
      };
      if (E.fast || E.reduced()) { swap(); return; }
      el.classList.add('morph-out');
      setTimeout(swap, 280);
    }
  };
  E.fadeIn = function (el) {
    if (E.fast || E.reduced()) return;
    el.classList.remove('fade-in'); void el.offsetWidth; el.classList.add('fade-in');
  };

  /* ---------------- Dunia: karakter & properti ---------------- */
  const SCALE = { socrates: 8, statue: 8, nikos: 7, daphne: 7, lykos: 7 };
  E.char = function (id, kind, x, y, opts = {}) {
    const s = opts.scale || SCALE[kind] || 6;
    const el = document.createElement('div');
    el.className = 'char char-' + kind + (opts.cls ? ' ' + opts.cls : '');
    const cv = PX.drawSprite(kind);
    el.appendChild(cv);
    const w = cv.width * s, h = cv.height * s;
    el.style.width = w + 'px'; el.style.height = h + 'px';
    el.style.left = (x - w / 2) + 'px'; el.style.top = (y - h) + 'px';
    el._w = w; el._h = h; el.dataset.id = id;
    if (opts.name) el.setAttribute('aria-label', opts.name);
    world.appendChild(el); E.chars[id] = el;
    return el;
  };
  E.moveChar = function (el, x, y, ms = 1000, then) {
    const nx = x - el._w / 2, ny = y - el._h;
    const goingLeft = nx < parseFloat(el.style.left);
    if (E.fast || E.reduced()) { el.style.left = nx + 'px'; el.style.top = ny + 'px'; then && then(); return; }
    el.style.transition = `left ${ms}ms linear, top ${ms}ms linear`;
    el.classList.add('walking'); el.classList.toggle('flip', goingLeft);
    requestAnimationFrame(() => { el.style.left = nx + 'px'; el.style.top = ny + 'px'; });
    E.after(ms, () => { el.classList.remove('walking', 'flip'); el.style.transition = ''; then && then(); });
  };
  E.tag = function (el, html, kind = 'info') {
    let t = el.querySelector('.tag');
    if (!t) { t = document.createElement('div'); el.appendChild(t); }
    t.className = 'tag ' + kind; t.innerHTML = html;
    if (!E.fast) { t.classList.remove('pop'); void t.offsetWidth; t.classList.add('pop'); }
    return t;
  };
  E.untag = function (el) { const t = el.querySelector('.tag'); if (t) t.remove(); };
  E.prop = function (cls, x, y, w, h, html = '') {
    const el = document.createElement('div');
    el.className = 'prop ' + cls;
    Object.assign(el.style, { left: x + 'px', top: y + 'px', width: w ? w + 'px' : '', height: h ? h + 'px' : '' });
    el.innerHTML = html; world.appendChild(el); return el;
  };
  E.button = function (label, cls, x, y, onClick) {
    const b = document.createElement('button');
    b.className = 'btn ' + cls + ' prop'; b.innerHTML = label;
    Object.assign(b.style, { left: x + 'px', top: y + 'px' });
    b.addEventListener('click', e => { e.stopPropagation(); E.sfx.click(); onClick(b); });
    world.appendChild(b); return b;
  };

  /* ---------------- Seret-lepas ---------------- */
  E.draggable = function (el, targets, onDrop) {
    el.classList.add('draggable');
    let start = null, off = null;
    el.addEventListener('pointerdown', ev => {
      if (el.classList.contains('locked')) return;
      ev.preventDefault();
      const p = E.toStage(ev.clientX, ev.clientY);
      start = { x: parseFloat(el.style.left), y: parseFloat(el.style.top) };
      off = { x: p.x - start.x, y: p.y - start.y };
      el.setPointerCapture(ev.pointerId); el.classList.add('dragging'); el.style.transition = 'none';
      targets.forEach(t => t.classList.add('drop-ready'));
    });
    el.addEventListener('pointermove', ev => {
      if (!start) return;
      const p = E.toStage(ev.clientX, ev.clientY);
      el.style.left = (p.x - off.x) + 'px'; el.style.top = (p.y - off.y) + 'px';
      const c = { x: p.x - off.x + el._w / 2, y: p.y - off.y + el._h / 2 };
      targets.forEach(t => { const r = E.rectOf(t); t.classList.toggle('drop-hover', c.x > r.x && c.x < r.x + r.w && c.y > r.y - 120 && c.y < r.y + r.h); });
    });
    el.addEventListener('pointerup', ev => {
      if (!start) return;
      el.classList.remove('dragging');
      const c = { x: parseFloat(el.style.left) + el._w / 2, y: parseFloat(el.style.top) + el._h / 2 };
      const hit = targets.find(t => { const r = E.rectOf(t); return c.x > r.x && c.x < r.x + r.w && c.y > r.y - 120 && c.y < r.y + r.h; });
      targets.forEach(t => t.classList.remove('drop-ready', 'drop-hover'));
      const back = () => { el.style.transition = 'left .3s, top .3s'; el.style.left = start.x + 'px'; el.style.top = start.y + 'px'; };
      if (!hit || onDrop(el, hit, back) === false) back();
      start = null;
    });
  };

  /* ---------------- Lentera (Scene pasar) ---------------- */
  E.lantern = function (people, onReveal) {
    dark.hidden = false;
    const glow = document.createElement('div'); glow.className = 'lantern'; world.appendChild(glow);
    glow.style.left = '330px'; glow.style.top = '640px';
    let dwell = new Map();
    const move = ev => {
      const p = E.toStage(ev.clientX, ev.clientY);
      dark.style.setProperty('--lx', p.x + 'px'); dark.style.setProperty('--ly', p.y + 'px');
      glow.style.left = p.x + 'px'; glow.style.top = p.y + 'px';
      people.forEach(el => {
        const r = E.rectOf(el), cx = r.x + r.w / 2, cy = r.y + r.h / 2;
        const near = Math.hypot(p.x - cx, p.y - cy) < 130;
        if (near && !el.classList.contains('lit')) {
          if (!dwell.has(el)) dwell.set(el, setTimeout(() => { el.classList.add('lit'); onReveal(el); }, 320));
        } else if (!near && dwell.has(el)) { clearTimeout(dwell.get(el)); dwell.delete(el); }
      });
    };
    stage.addEventListener('pointermove', move);
    E.st._cleanup = () => { stage.removeEventListener('pointermove', move); dwell.forEach(clearTimeout); };
    dark.style.setProperty('--lx', '330px'); dark.style.setProperty('--ly', '640px');
    return glow;
  };

  /* ---------------- Jalur Pipeline & HUD ---------------- */
  const stones = [...document.querySelectorAll('#pipeline li')];
  E.stones = function (states) { states.forEach((s, i) => E.stone(i, s)); };
  E.stone = function (i, s) {
    const li = stones[i]; if (!li) return;
    li.className = 'stone ' + s;
    if (s === 'done' && !E.fast) { li.classList.add('pop'); }
  };
  E.refreshHud = function () {
    const k = $('#btn-kartu'), t = $('#btn-tas');
    k.classList.toggle('is-locked', !E.state.kartuOn);
    k.dataset.tip = E.state.kartuOn ? 'Kartu Argumen (K)' : 'Terbuka di scene Agora';
    t.classList.toggle('is-locked', !E.state.inv);
    t.dataset.tip = E.state.inv ? 'Jurus (I)' : 'Terbuka di Dinding Kuil';
  };
  E.pulse = function (el) { if (E.fast) return; el.classList.remove('pulse-once'); void el.offsetWidth; el.classList.add('pulse-once'); };

  /* ---------------- Transisi pixel ---------------- */
  const tcv = $('#transition'), tctx = tcv.getContext('2d');
  function transition(mid) {
    if (E.reduced()) { stage.classList.add('fade'); setTimeout(() => { mid(); stage.classList.remove('fade'); }, 200); return; }
    const B = 64, cols = Math.ceil(W / B), rows = Math.ceil(H / B), dur = 420;
    const delays = []; for (let c = 0; c < cols; c++) for (let r = 0; r < rows; r++) delays.push({ c, r, d: (c / cols) * 0.65 + Math.random() * 0.35 });
    tcv.classList.add('on');
    const run = (cover, done) => {
      const t0 = performance.now();
      const frame = now => {
        const p = (now - t0) / dur;
        tctx.clearRect(0, 0, W, H); tctx.fillStyle = '#14182A';
        delays.forEach(({ c, r, d }) => { if (cover ? p >= d : p < d) tctx.fillRect(c * B, r * B, B, B); });
        if (p < 1) requestAnimationFrame(frame); else done();
      };
      requestAnimationFrame(frame);
    };
    run(true, () => { mid(); run(false, () => { tctx.clearRect(0, 0, W, H); tcv.classList.remove('on'); }); });
  }

  /* ---------------- Navigasi scene & beat ---------------- */
  E.sceneIndex = id => E.scenes.findIndex(s => s.id === id);

  function build(i) {
    clearTimers(); stopTyping(); E.closeOverlays(true);
    if (E.st._cleanup) E.st._cleanup();
    E.idx = i; const sc = E.scenes[i];
    world.innerHTML = ''; fx.innerHTML = ''; choicesEl.innerHTML = '';
    dark.hidden = true; E.panel.hide();
    E.chars = {}; E.st = {};
    stage.dataset.scene = sc.id;
    const info = PX.drawBackground(sc.bg, bgCtx);
    (info.torches || []).forEach(([x, y]) => {
      const g = document.createElement('div'); g.className = 'torch-glow';
      g.style.left = (x * 4) + 'px'; g.style.top = (y * 4) + 'px'; fx.appendChild(g);
    });
    if (info.birds) for (let b = 0; b < 3; b++) {
      const d = document.createElement('div'); d.className = 'bird'; d.style.top = (120 + b * 46) + 'px';
      d.style.animationDelay = (b * 2.3) + 's'; fx.appendChild(d);
    }
    const chrome = sc.chrome !== false;
    $('#hud').classList.toggle('hidden', !chrome);
    $('#btn-ask').classList.toggle('hidden', !chrome);
    dlg.classList.toggle('hidden', sc.dialog === false);
    E.stones(sc.pipeline || ['idle', 'idle', 'idle', 'idle', 'idle']);
    Object.assign(E.state, sc.state || {});
    E.refreshHud();
    const m = T.map.findIndex(x => x.scene === (sc.mapAs || sc.id));
    $('#scene-label').textContent = m >= 0 ? `${m + 1} · ${T.map[m].concept}` : '';
    sc.setup && sc.setup(E);
  }
  function runBeat(b) {
    const sc = E.scenes[E.idx];
    E.beat = b; E.gated = false; E.solver = null;
    choicesEl.innerHTML = '';
    if (sc.beats[b]) sc.beats[b](E);
    updateIndicator();
  }
  function replayTo(n) {
    E.fast = true; stage.classList.add('instant');
    for (let b = 0; b < n; b++) { runBeat(b); if (E.gated && E.solver) E.solver(); }
    E.fast = false;
    runBeat(n);
    requestAnimationFrame(() => requestAnimationFrame(() => stage.classList.remove('instant')));
  }
  E.goScene = function (i, startBeat = 0, withTransition = true) {
    if (i < 0 || i >= E.scenes.length) return;
    const go = () => { build(i); replayTo(Math.min(startBeat, E.scenes[i].beats.length - 1)); };
    withTransition ? transition(go) : go();
  };
  E.next = function (force) {
    if (E.overlayOpen()) { E.closeOverlays(); return; }
    if (E.finishTyping()) return;
    if (E.gated) {
      if (force && E.solver) { E.solver(); return; }
      E.toast('Jawab pertanyaan Socrates dulu. Shift + Spasi untuk melewati.');
      choicesEl.classList.remove('nudge'); void choicesEl.offsetWidth; choicesEl.classList.add('nudge');
      return;
    }
    const sc = E.scenes[E.idx];
    if (E.beat + 1 < sc.beats.length) runBeat(E.beat + 1);
    else if (E.idx + 1 < E.scenes.length) E.goScene(E.idx + 1);
    else E.toast('Perjalanan selesai. Tekan M untuk membuka peta.');
  };
  E.prev = function () {
    if (E.overlayOpen()) { E.closeOverlays(); return; }
    if (E.beat > 0) E.goScene(E.idx, E.beat - 1, false);
    else if (E.idx > 0) E.goScene(E.idx - 1, E.scenes[E.idx - 1].beats.length - 1);
  };
  E.restartScene = () => E.goScene(E.idx, 0, false);

  /* ---------------- Toast & tooltip ---------------- */
  let toastTimer;
  E.toast = function (msg) {
    const t = $('#toast'); t.textContent = msg; t.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
  };
  const tip = $('#tooltip');
  stage.addEventListener('mouseover', e => {
    const t = e.target.closest('[data-tip]');
    if (t && t.dataset.tip) {
      tip.textContent = t.dataset.tip; tip.classList.add('show');
      const r = E.rectOf(t);
      tip.style.left = Math.min(W - 40, Math.max(40, r.x + r.w / 2)) + 'px';
      tip.style.top = (r.y > 140 ? r.y - 12 : r.y + r.h + 56) + 'px';
    }
    const l = e.target.closest('[data-link]');
    if (l) document.querySelectorAll(`[data-link="${l.dataset.link}"]`).forEach(x => x.classList.add('linked'));
  });
  stage.addEventListener('mouseout', e => {
    const t = e.target.closest('[data-tip]'); if (t) tip.classList.remove('show');
    const l = e.target.closest('[data-link]');
    if (l) document.querySelectorAll('.linked').forEach(x => x.classList.remove('linked'));
  });

  /* ---------------- Overlay ---------------- */
  const overlays = ['ask', 'kartu', 'tas', 'map'];
  let savedLine = null;
  E.overlayOpen = () => overlays.some(o => !$('#ov-' + o).hidden);
  E.closeOverlays = function (silent) {
    const askWasOpen = !$('#ov-ask').hidden;
    overlays.forEach(o => $('#ov-' + o).hidden = true);
    if (askWasOpen && savedLine && !silent) { const f = E.fast; E.fast = true; E.say(savedLine.text, savedLine.who); E.fast = f; }
    savedLine = null;
  };
  E.openOverlay = function (name) {
    const el = $('#ov-' + name);
    const wasOpen = !el.hidden;
    E.closeOverlays();
    if (wasOpen) return;
    if (name === 'kartu' && !E.state.kartuOn) { E.toast('Kartu Argumen terbuka setelah scene Agora.'); return; }
    if (name === 'tas' && !E.state.inv) { E.toast('Jurus terbuka di Dinding Kuil.'); return; }
    E.sfx.open();
    if (name === 'ask') renderAsk();
    if (name === 'kartu') renderKartu();
    if (name === 'tas') renderTas();
    if (name === 'map') renderMap();
    el.hidden = false;
    const focusable = el.querySelector('button'); focusable && focusable.focus({ preventScroll: true });
  };

  function renderAsk() {
    savedLine = lastLine;
    const sc = E.scenes[E.idx];
    const list = [...(T.ask[sc.ask] || []), ...(sc.ask !== 'general' ? [] : [])];
    const all = list.length ? list : T.ask.general;
    const box = $('#ask-list'); box.innerHTML = '';
    all.forEach(item => {
      const b = document.createElement('button');
      b.className = 'btn btn-secondary ask-q'; b.innerHTML = E.rich(item.q);
      b.addEventListener('click', () => { E.sfx.click(); E.say(item.a); box.querySelectorAll('.ask-q').forEach(x => x.classList.remove('chosen')); b.classList.add('chosen'); });
      box.appendChild(b);
    });
  }
  function renderKartu() {
    const A = T.argument, k = E.state.kartu;
    const col1 = `<h3>Kalimat</h3><p class="dom">Domain: ${A.domain}</p>` +
      A.natural.map(n => `<div class="krow"><b>${n.tag}</b><span>${n.text}</span></div>`).join('') +
      `<div class="valid-box ${E.state.valid ? 'yes' : ''}">${E.state.valid ? 'Valid ✓' : 'Valid?'}</div>`;
    const col2 = k >= 1
      ? `<h3>Formula</h3><p class="dom">${A.key.map(([f, t]) => E.M(f) + ' ' + t).join(' &nbsp; ')}</p>` +
        A.natural.map(n => `<div class="krow"><b>${n.tag}</b>${E.M(n.formula)}</div>`).join('')
      : `<h3>Formula</h3><p class="locked-note">Terbuka di Dinding Kuil</p>`;
    const col3 = k >= 2
      ? `<h3>Bukti</h3>` + A.proof.map((r, i) => `<div class="krow small"><b>${i + 1}</b>${E.M(r[0])}<em>${r[1]}</em></div>`).join('') +
        `<div class="valid-box yes">Valid ✓</div>`
      : `<h3>Bukti</h3><p class="locked-note">Terbuka di Ruang Quest</p>`;
    $('#kartu-cols').innerHTML = `<div class="kcol">${col1}</div><div class="kcol ${k >= 1 ? '' : 'lockedcol'}">${col2}</div><div class="kcol ${k >= 2 ? '' : 'lockedcol'}">${col3}</div>`;
  }
  function renderTas() {
    $('#tas-cards').innerHTML = T.jurus.map(j => `
      <div class="jcard ${j.id === 'EI' ? 'ei' : ''}">
        <div class="jid">${j.id}</div><div class="jname">${j.name}</div>
        <div class="jrule">${E.M(j.rule)}</div><p>${esc(j.meaning)}</p>
        ${j.note ? `<p class="jnote">${esc(j.note)}</p>` : ''}
      </div>`).join('');
  }
  function renderMap() {
    const pos = [[150, 520], [330, 420], [510, 500], [690, 400], [860, 480], [1030, 380], [1200, 470], [1360, 360], [1180, 220], [940, 190], [700, 160]];
    const svg = `<svg class="map-path" viewBox="0 0 1500 640" aria-hidden="true"><polyline points="${pos.map(p => p.join(',')).join(' ')}" /></svg>`;
    const cur = E.scenes[E.idx].mapAs || E.scenes[E.idx].id;
    const nodes = T.map.map((m, i) => `
      <button class="map-node ${m.scene === cur ? 'current' : ''}" style="left:${pos[i][0]}px;top:${pos[i][1]}px" data-scene="${m.scene}">
        <span class="mn-num">${i + 1}</span><span class="mn-name">${m.name}</span><span class="mn-concept">${m.concept}</span>
      </button>`).join('');
    $('#map-area').innerHTML = svg + nodes;
    $('#map-area').querySelectorAll('.map-node').forEach(b => b.addEventListener('click', () => {
      E.closeOverlays(true); E.goScene(E.sceneIndex(b.dataset.scene));
    }));
  }
})();
