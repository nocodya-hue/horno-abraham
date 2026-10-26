// Horno Abraham: abierto/cerrado con el horario real, menú, encargos a WhatsApp, scroll suave, parallax y entradas
(function () {
  var reducido = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var tactil = matchMedia('(hover: none), (pointer: coarse)').matches;
  var g = window.gsap, ST = window.ScrollTrigger;

  // ---------- abierto / cerrado (hora de Madrid) ----------
  var H = window.HORARIO || [];
  var hm = function (h) { var m = Math.round((h % 1) * 60); return Math.floor(h) + ':' + (m < 10 ? '0' : '') + m; };
  function estado() {
    var p = new Intl.DateTimeFormat('es-ES', { timeZone: 'Europe/Madrid', weekday: 'short', hour: 'numeric', minute: 'numeric', hour12: false }).formatToParts(new Date());
    var dias = { dom: 0, lun: 1, mar: 2, 'mié': 3, jue: 4, vie: 5, 'sáb': 6 };
    var wd = (p.find(function (x) { return x.type === 'weekday'; }) || {}).value || ''; wd = wd.replace('.', '').toLowerCase();
    var d = dias[wd]; if (d === undefined) d = new Date().getDay();
    var ahora = +(p.find(function (x) { return x.type === 'hour'; }) || {}).value + (+(p.find(function (x) { return x.type === 'minute'; }) || {}).value) / 60;
    var hoy = (H.find(function (x) { return x[0] === d; }) || [d, []])[1];
    var txt, abierto = false;
    for (var i = 0; i < hoy.length; i++) { if (ahora >= hoy[i][0] && ahora < hoy[i][1]) { abierto = true; txt = 'Abierto ahora · hasta las ' + hm(hoy[i][1]); } }
    if (!abierto) {
      var sig = hoy.find(function (t) { return t[0] > ahora; });
      if (sig) txt = 'Cerrado · abrimos a las ' + hm(sig[0]);
      else { var m = (H.find(function (x) { return x[0] === (d + 1) % 7; }) || [0, [[8]]])[1][0]; txt = 'Cerrado · mañana desde las ' + hm(m[0]); }
    }
    document.querySelectorAll('[data-estado]').forEach(function (e) { e.classList.toggle('abierto', abierto); e.classList.toggle('cerrado', !abierto); e.querySelector('span').textContent = txt; });
    document.querySelectorAll('.horario tr').forEach(function (tr) { tr.classList.toggle('hoy', +tr.dataset.dia === d); });
  }
  estado(); setInterval(estado, 60000);

  // ---------- menú ----------
  var bm = document.querySelector('[data-menu]'), pm = document.querySelector('[data-menu-panel]');
  function menu(abrir) { if (!bm) return; bm.setAttribute('aria-expanded', abrir ? 'true' : 'false'); bm.setAttribute('aria-label', abrir ? 'Cerrar menú' : 'Abrir menú'); pm.hidden = !abrir; document.body.style.overflow = abrir ? 'hidden' : ''; }
  if (bm) { bm.addEventListener('click', function () { menu(bm.getAttribute('aria-expanded') !== 'true'); }); pm.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', function () { menu(false); }); }); }

  // ---------- encargo → WhatsApp ----------
  document.querySelectorAll('form[data-whatsapp]').forEach(function (f) {
    f.addEventListener('submit', function (ev) {
      ev.preventDefault(); var d = new FormData(f), l = ['Hola, quería hacer un encargo.'];
      if (d.get('nombre')) l.push('Nombre: ' + d.get('nombre'));
      l.push('Encargo: ' + d.get('tipo'));
      if (d.get('fecha')) l.push('Para el día: ' + new Date(d.get('fecha') + 'T12:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }));
      if (d.get('personas')) l.push('Para: ' + d.get('personas') + ' personas');
      if (d.get('mensaje')) l.push(d.get('mensaje'));
      open('https://wa.me/' + f.dataset.whatsapp + '?text=' + encodeURIComponent(l.join('\n')), '_blank', 'noopener');
    });
  });

  // ---------- cabecera: se esconde al bajar y vuelve al subir ----------
  var cab = document.querySelector('[data-cab]'), ultimo = 0;
  function cabecera(y) { if (!cab) return; cab.classList.toggle('se-oculta', y > ultimo && y > innerHeight * .8 && !(pm && !pm.hidden)); ultimo = y; }

  if (!g || !ST || reducido) {
    addEventListener('scroll', function () { cabecera(scrollY); }, { passive: true });
    document.querySelectorAll('[data-revela]').forEach(function (el) { el.style.opacity = 1; el.style.transform = 'none'; });
    return;
  }
  g.registerPlugin(ST); if (window.SplitText) g.registerPlugin(window.SplitText);

  var lenis = null;
  if (window.Lenis && !tactil) {
    lenis = new Lenis({ lerp: .11 });
    lenis.on('scroll', function (e) { ST.update(); cabecera(e.scroll); });
    g.ticker.add(function (t) { lenis.raf(t * 1000); }); g.ticker.lagSmoothing(0);
    document.querySelectorAll('a[href*="#"]').forEach(function (a) {
      a.addEventListener('click', function (ev) {
        var u = new URL(a.href, location.href); if (u.pathname !== location.pathname || !u.hash || u.hash.length < 2) return;
        var t = document.querySelector(u.hash); if (!t) return; ev.preventDefault(); lenis.scrollTo(t, { offset: -70, duration: 1.3 });
      });
    });
  } else addEventListener('scroll', function () { cabecera(scrollY); }, { passive: true });

  // hero: el titular sube, el pan cae en su sitio, las pegatinas se pegan y el bocadillo aparece
  g.from('.hero__tit span', { yPercent: 60, opacity: 0, duration: 1.1, ease: 'expo.out', stagger: .1 });
  g.from('.hero__producto', { y: 120, opacity: 0, rotate: -6, duration: 1.4, ease: 'expo.out', delay: .25 });
  g.from('.hero .pegatina', { scale: 0, rotate: -30, duration: .8, ease: 'back.out(2.2)', stagger: .12, delay: .7 });
  g.from('.bocadillo', { scale: .6, opacity: 0, duration: .9, ease: 'back.out(1.8)', delay: .9 });
  g.from('.hero__rotulo, .hero__sub, .hero__cta', { y: 20, opacity: 0, duration: 1, ease: 'expo.out', stagger: .08, delay: .5 });
  // el pan flota un poco con el scroll
  g.to('.hero__producto', { yPercent: -8, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
  // las pegatinas de las tarjetas se pegan al aparecer
  g.utils.toArray('.tarjeta__peg').forEach(function (p) { g.from(p, { scale: 0, rotate: -25, duration: .7, ease: 'back.out(2)', scrollTrigger: { trigger: p, start: 'top 92%' } }); });

  var splits = function () {
    document.querySelectorAll('[data-split]').forEach(function (el) {
      if (!window.SplitText) return;
      var s = new SplitText(el, { type: 'lines', linesClass: 'ln' });
      s.lines.forEach(function (l) { l.innerHTML = '<span class="ln__in">' + l.innerHTML + '</span>'; });
      var enHero = el.closest('.hero');
      g.from(el.querySelectorAll('.ln__in'), enHero ? { yPercent: 110, duration: 1.2, ease: 'expo.out', stagger: .08, delay: .2 }
        : { yPercent: 110, duration: 1.05, ease: 'expo.out', stagger: .07, scrollTrigger: { trigger: el, start: 'top 88%' } });
    });
    ST.refresh();
  };
  if (document.fonts) document.fonts.ready.then(splits); else splits();

  g.utils.toArray('[data-revela]').forEach(function (el, i) {
    g.to(el, { y: 0, opacity: 1, duration: .9, ease: 'expo.out', delay: (i % 4) * .05, scrollTrigger: { trigger: el, start: 'top 93%' } });
  });
  g.utils.toArray('[data-parallax-caja]').forEach(function (caja) {
    var im = caja.querySelector('.parallax'); if (!im) return;
    g.fromTo(im, { yPercent: -8 }, { yPercent: 0, ease: 'none', scrollTrigger: { trigger: caja, start: 'top bottom', end: 'bottom top', scrub: true } });
  });
  // la lista de panes se «escribe» línea a línea
  g.from('.pizarra__tit', { opacity: 0, x: -20, rotate: -4, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: '.pizarra', start: 'top 80%' } });

  addEventListener('load', function () { ST.refresh(); });
})();
