/* =====================================================================
   AGORA LOGIKA — main.js
   Menyalakan website: mengisi HUD, memasang tombol & keyboard,
   lalu membuka scene pertama (atau scene di URL, mis. index.html#solution).
   ===================================================================== */
(function () {
  'use strict';
  const $ = s => document.querySelector(s);
  const T = window.CONTENT, E = window.E;

  E.scenes = window.SCENES;

  // Isi label & tooltip batu Jalur Pipeline
  document.querySelectorAll('#pipeline li').forEach((li, i) => {
    li.querySelector('span').textContent = T.pipeline[i].name;
    li.dataset.tip = T.pipeline[i].tip;
  });

  // Wajah Socrates di tombol Ask
  const face = PX.portrait('socrates'), askFace = $('#ask-face');
  askFace.width = face.width; askFace.height = face.height;
  askFace.getContext('2d').drawImage(face, 0, 0);

  // Tombol HUD & navigasi
  $('#btn-map').addEventListener('click', () => E.openOverlay('map'));
  $('#btn-kartu').addEventListener('click', () => E.openOverlay('kartu'));
  $('#btn-tas').addEventListener('click', () => E.openOverlay('tas'));
  $('#btn-ask').addEventListener('click', () => E.openOverlay('ask'));
  $('#btn-next').addEventListener('click', e => { e.stopPropagation(); E.next(); });
  $('#btn-prev').addEventListener('click', e => { e.stopPropagation(); E.prev(); });
  document.querySelectorAll('.overlay .close').forEach(b => b.addEventListener('click', () => E.closeOverlays()));
  document.querySelectorAll('.overlay').forEach(o => o.addEventListener('click', e => { if (e.target === o) E.closeOverlays(); }));
  // Klik/ketuk teks dialog: selesaikan ketikan, atau lanjut
  $('#dlg-text').addEventListener('click', () => E.next());

  // Keyboard presenter
  const help = $('#help');
  document.addEventListener('keydown', e => {
    if (e.target.closest && e.target.closest('input, textarea')) return;
    const k = e.key;
    if (k === ' ' || k === 'ArrowRight' || k === 'PageDown') {
      e.preventDefault(); E.next(e.shiftKey && k === ' ');
    } else if (k === 'ArrowLeft' || k === 'PageUp') { e.preventDefault(); E.prev(); }
    else if (k === 'Escape') { help.hidden = true; E.closeOverlays(); }
    else if (k === 'Home') { e.preventDefault(); E.restartScene(); }
    else if (e.ctrlKey || e.metaKey || e.altKey) return;
    else if (k === 'a' || k === 'A') E.openOverlay('ask');
    else if (k === 'k' || k === 'K') E.openOverlay('kartu');
    else if (k === 'i' || k === 'I') E.openOverlay('tas');
    else if (k === 'm' || k === 'M') E.openOverlay('map');
    else if (k === 'r' || k === 'R') { document.body.classList.toggle('reduce-motion'); E.toast(E.reduced() ? 'Gerak dikurangi' : 'Gerak normal'); }
    else if (k === 'n' || k === 'N') { E.muted = !E.muted; E.toast(E.muted ? 'Suara mati' : 'Suara hidup'); }
    else if (k === 'p' || k === 'P') { const z = $('#pip-zone'); z.hidden = !z.hidden; }
    else if (k === 'f' || k === 'F') {
      if (!document.fullscreenElement) document.documentElement.requestFullscreen && document.documentElement.requestFullscreen();
      else document.exitFullscreen && document.exitFullscreen();
    } else if (k === 'h' || k === 'H' || k === '?') help.hidden = !help.hidden;
  });
  // Spasi tidak boleh "menekan" tombol yang sedang fokus
  document.addEventListener('keyup', e => { if (e.key === ' ') e.preventDefault(); });
  document.querySelectorAll('button').forEach(b => b.addEventListener('keydown', e => { if (e.key === ' ') e.preventDefault(); }));

  // Hormati preferensi sistem untuk mengurangi gerak
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) document.body.classList.add('reduce-motion');

  window.addEventListener('resize', E.fit);
  E.fit();

  // Mulai: index.html#predicate langsung membuka scene tersebut
  const start = Math.max(0, E.sceneIndex(location.hash.slice(1)));
  E.goScene(start, 0, false);
})();
