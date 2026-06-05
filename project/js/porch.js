/* Front porch: held space-portal intro (Enter gate) + hyperspace warp,
   then the pinned scenic-scroll hero. Intro content is visible by default,
   so it never depends on the CSS keyframe clock to be usable. */
(function () {
  var root = document.documentElement;
  var body = document.body;
  var intro = document.getElementById('intro');
  var canvas = document.getElementById('starfield');
  var enterBtn = document.getElementById('enterBtn');
  var skipBtn = document.getElementById('skipBtn');
  var porch = document.querySelector('.porch');
  var heroInner = document.querySelector('.hero-inner');
  var mesh = document.getElementById('mesh');
  var cue = document.querySelector('.scroll-cue');
  var sf = null;

  function motionOK() {
    return !root.classList.contains('motion-off') &&
           !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  // ---- Intro setup -------------------------------------------------------
  if (intro) {
    root.classList.add('lock');
    if (canvas && window.Starfield) { sf = new Starfield(canvas); sf.start(); }
  } else {
    body.classList.add('ready');
  }

  var done = false;
  function endIntro(instant) {
    if (done) return;
    done = true;

    function finish() {
      body.classList.add('intro-done');
      root.classList.remove('lock');
      requestAnimationFrame(function () { body.classList.add('ready'); });
      setTimeout(function () {
        if (intro) intro.style.display = 'none';
        if (sf) sf.stop();
      }, 150);
      frame();
    }

    if (instant || !motionOK() || !sf) {
      if (sf) sf.stop();
      finish();
    } else {
      body.classList.add('intro-warp');         // fade the title out
      sf.warp(finish);                           // hyperspace, then reveal
    }
  }
  window.__skipIntro = function () { endIntro(true); };

  // ---- Return to space (re-open the front porch) -------------------------
  function returnToSpace() {
    if (!intro) return;
    window.scrollTo(0, 0);
    // show the portal instantly (no clock-dependent fade, so it can never get stuck hidden)
    body.classList.remove('intro-warp', 'intro-done', 'ready');
    intro.style.display = '';
    intro.style.opacity = '';
    intro.style.transform = '';
    if (!sf && canvas && window.Starfield) sf = new Starfield(canvas);
    if (sf) {
      sf.speed = 0.5; sf.target = 0.5; sf.warping = false; sf.onDone = null;
      if (!sf.raf) sf.start();
    }
    if (heroInner) { heroInner.style.transform = ''; heroInner.style.opacity = ''; }
    root.classList.add('lock');
    done = false;
  }
  window.__returnToSpace = returnToSpace;
  document.querySelectorAll('.js-return-space').forEach(function (el) {
    el.addEventListener('click', function (e) { e.preventDefault(); returnToSpace(); });
  });

  if (enterBtn) enterBtn.addEventListener('click', function () { endIntro(false); });
  if (skipBtn) skipBtn.addEventListener('click', function (e) { e.stopPropagation(); endIntro(true); });
  window.addEventListener('keydown', function (e) {
    if (done || !intro) return;
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); endIntro(false); }
    else if (e.key === 'Escape') { endIntro(true); }
  });

  // ---- Pinned scenic scroll ---------------------------------------------
  if (!motionOK() && porch) porch.classList.add('flat');

  function frame() {
    if (!porch) return;
    if (!motionOK()) {
      if (heroInner) { heroInner.style.transform = ''; heroInner.style.opacity = ''; }
      if (mesh) mesh.style.transform = '';
      if (cue) cue.style.opacity = '';
      return;
    }
    var total = porch.offsetHeight - window.innerHeight;
    var p = total > 0 ? Math.min(1, Math.max(0, -porch.getBoundingClientRect().top / total)) : 0;
    var fade = Math.max(0, (p - 0.48) / 0.52);
    if (heroInner) {
      heroInner.style.transform = 'translate3d(0,' + (-p * 76).toFixed(1) + 'px,0) scale(' + (1 + p * 0.05).toFixed(3) + ')';
      heroInner.style.opacity = (1 - fade * 0.94).toFixed(3);
    }
    if (mesh) mesh.style.transform = 'scale(' + (1 + p * 0.24).toFixed(3) + ') translateY(' + (p * -18).toFixed(1) + 'px)';
    if (cue) cue.style.opacity = (1 - Math.min(1, p * 4)).toFixed(2);
  }

  var ticking = false;
  window.addEventListener('scroll', function () {
    if (!ticking) { requestAnimationFrame(function () { frame(); ticking = false; }); ticking = true; }
  }, { passive: true });
  window.addEventListener('resize', frame);
  window.addEventListener('tweakschange', frame);
  frame();
})();
