/* Scroll engine: staged hero entrance, reveal-on-scroll, parallax,
   progress bar, nav state, process timeline lighting. */
(function () {
  const root = document.documentElement;

  // --- Failsafe: never let content stay invisible ---------------------------
  // Every reveal is gated on the animation clock (CSS keyframes, Intersection
  // Observer). In a throttled / background-tab / preview context that clock can
  // freeze (animations report playState "running" but currentTime never leaves
  // 0) even while rAF for canvas keeps ticking — so probing rAF is unreliable.
  // Instead we probe the CSS animation clock directly: shortly after load, if no
  // animation has advanced past 0, the clock is frozen and we force the visible
  // end-state. On an active tab the clock has advanced by then and this never
  // runs, leaving the cinematic motion fully intact.
  function forceShowAll() {
    document.querySelectorAll('.reveal, .reveal-l').forEach(function (el) {
      el.classList.add('in');
      el.style.transition = 'none';
      el.style.opacity = '1';
      el.style.transform = 'none';
    });
    document.querySelectorAll('.stage').forEach(function (el) {
      el.style.animation = 'none';
      el.style.opacity = '1';
      el.style.transform = 'none';
    });
    var fill = document.querySelector('.proc-line .fill');
    if (fill) { fill.style.transition = 'none'; fill.style.width = '100%'; }
    document.querySelectorAll('.step').forEach(function (s) { s.classList.add('lit'); });
    document.querySelectorAll('[data-count]').forEach(function (el) {
      var dec = el.dataset.dec ? parseInt(el.dataset.dec) : 0;
      el.textContent = parseFloat(el.dataset.count).toFixed(dec) + (el.dataset.suffix || '');
    });
    // reveal the hero behind the held intro and collapse the pinned stage
    var porch = document.querySelector('.porch');
    if (porch) porch.classList.add('flat');
    var hi = document.querySelector('.hero-inner');
    if (hi) { hi.style.transform = 'none'; hi.style.opacity = '1'; }
    var m = document.getElementById('mesh');
    if (m) m.style.transform = 'none';
    document.body.classList.add('ready');
  }
  setTimeout(function () {
    var anims = document.getAnimations ? document.getAnimations() : [];
    var advancing = anims.some(function (a) { return (parseFloat(a.currentTime) || 0) > 0; });
    if (!advancing) forceShowAll();
  }, 1200);

  // --- Staged hero entrance ---
  // The overture (porch.js) normally adds `ready` when the curtain lifts.
  // This is a safety net in case that script is unavailable.
  setTimeout(function () { document.body.classList.add('ready'); }, 4500);

  // --- Reveal on scroll ---
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting) {
        e.target.classList.add('in');
        io.unobserve(e.target);
      }
    }
  }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
  document.querySelectorAll('.reveal, .reveal-l').forEach((el) => io.observe(el));

  // --- Process timeline progressive lighting ---
  const procWrap = document.querySelector('.proc-wrap');
  if (procWrap) {
    const steps = [...procWrap.querySelectorAll('.step')];
    const fill = procWrap.querySelector('.proc-line .fill');
    const pio = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          if (fill) fill.style.setProperty('--p', '100%');
          steps.forEach((s, i) => setTimeout(() => s.classList.add('lit'), 240 + i * 220));
          pio.disconnect();
        }
      });
    }, { threshold: 0.4 });
    pio.observe(procWrap);
  }

  // --- Progress bar + nav + parallax (rAF-batched) ---
  const nav = document.querySelector('.nav');
  const progress = document.querySelector('.progress');
  const parallaxEls = [...document.querySelectorAll('[data-parallax]')];
  let ticking = false;

  function onScroll() {
    const y = window.scrollY;
    const docH = document.documentElement.scrollHeight - window.innerHeight;
    const p = docH > 0 ? (y / docH) * 100 : 0;
    if (progress) progress.style.setProperty('--sp', p.toFixed(2) + '%');
    if (nav) nav.classList.toggle('scrolled', y > 40);

    if (!root.classList.contains('motion-off')) {
      for (const el of parallaxEls) {
        const speed = parseFloat(el.dataset.parallax) || 0.1;
        const rect = el.getBoundingClientRect();
        const center = rect.top + rect.height / 2 - window.innerHeight / 2;
        el.style.transform = `translate3d(0, ${(-center * speed).toFixed(1)}px, 0)`;
      }
    }
    ticking = false;
  }
  window.addEventListener('scroll', () => {
    if (!ticking) { requestAnimationFrame(onScroll); ticking = true; }
  }, { passive: true });
  onScroll();

  // --- Smooth anchor scroll w/ nav offset ---
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (id.length < 2) return;
      const t = document.querySelector(id);
      if (!t) return;
      e.preventDefault();
      const top = t.getBoundingClientRect().top + window.scrollY - 72;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });

  // --- Animated counters in hero meta ---
  const counters = document.querySelectorAll('[data-count]');
  const cio = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const el = e.target;
      const target = parseFloat(el.dataset.count);
      const suffix = el.dataset.suffix || '';
      const dec = el.dataset.dec ? parseInt(el.dataset.dec) : 0;
      const dur = 1400;
      const t0 = performance.now();
      function tick(now) {
        const k = Math.min(1, (now - t0) / dur);
        const eased = 1 - Math.pow(1 - k, 3);
        el.textContent = (target * eased).toFixed(dec) + suffix;
        if (k < 1) requestAnimationFrame(tick);
      }
      if (root.classList.contains('motion-off')) el.textContent = target.toFixed(dec) + suffix;
      else requestAnimationFrame(tick);
      cio.unobserve(el);
    });
  }, { threshold: 0.6 });
  counters.forEach((c) => cio.observe(c));
})();
