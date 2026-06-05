/* Hero engineering mesh — drifting node field with proximity links.
   Reads --accent from CSS, respects motion toggle + reduced motion. */
(function () {
  const canvas = document.getElementById('mesh');
  if (!canvas) return;
  const ctx = canvas.getContext('2d', { alpha: true });

  let W = 0, H = 0, DPR = 1;
  let nodes = [];
  let raf = null;
  let mouseX = 0.5, mouseY = 0.4, tmx = 0.5, tmy = 0.4;
  let scrollY = 0;
  let accent = { r: 167, g: 139, b: 250 };

  function readAccent() {
    const v = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();
    const probe = document.createElement('span');
    probe.style.color = v || '#A78BFA';
    document.body.appendChild(probe);
    const rgb = getComputedStyle(probe).color.match(/\d+/g);
    document.body.removeChild(probe);
    if (rgb) accent = { r: +rgb[0], g: +rgb[1], b: +rgb[2] };
  }

  function motionOn() {
    if (document.documentElement.classList.contains('motion-off')) return false;
    return !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function size() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    const r = canvas.getBoundingClientRect();
    W = r.width; H = r.height;
    canvas.width = Math.round(W * DPR);
    canvas.height = Math.round(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    build();
  }

  function build() {
    const density = Math.min(120, Math.max(46, Math.round((W * H) / 16000)));
    nodes = [];
    for (let i = 0; i < density; i++) {
      const depth = Math.random();           // 0 far → 1 near (parallax + size)
      nodes.push({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * (0.12 + depth * 0.2),
        vy: (Math.random() - 0.5) * (0.12 + depth * 0.2),
        depth,
        r: 0.7 + depth * 1.8,
        pulse: Math.random() * Math.PI * 2,
        node: Math.random() < 0.16        // a few "lit" engineering nodes
      });
    }
  }

  const LINK = 132;

  function frame() {
    ctx.clearRect(0, 0, W, H);
    const moving = motionOn();

    // smooth mouse + scroll parallax
    mouseX += (tmx - mouseX) * 0.05;
    mouseY += (tmy - mouseY) * 0.05;
    const px = (mouseX - 0.5);
    const py = (mouseY - 0.5);

    for (const n of nodes) {
      if (moving) {
        n.x += n.vx; n.y += n.vy; n.pulse += 0.02;
        if (n.x < -20) n.x = W + 20; else if (n.x > W + 20) n.x = -20;
        if (n.y < -20) n.y = H + 20; else if (n.y > H + 20) n.y = -20;
      }
    }

    // links
    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i];
      const ax = a.x + px * a.depth * 46;
      const ay = a.y + py * a.depth * 30 - scrollY * (0.04 + a.depth * 0.08);
      for (let j = i + 1; j < nodes.length; j++) {
        const b = nodes[j];
        const bx = b.x + px * b.depth * 46;
        const by = b.y + py * b.depth * 30 - scrollY * (0.04 + b.depth * 0.08);
        const dx = ax - bx, dy = ay - by;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < LINK) {
          const o = (1 - d / LINK) * 0.5 * Math.min(a.depth + b.depth, 1.2);
          ctx.strokeStyle = `rgba(${accent.r},${accent.g},${accent.b},${o * 0.55})`;
          ctx.lineWidth = 0.6;
          ctx.beginPath();
          ctx.moveTo(ax, ay);
          ctx.lineTo(bx, by);
          ctx.stroke();
        }
      }
    }

    // nodes
    for (const n of nodes) {
      const x = n.x + px * n.depth * 46;
      const y = n.y + py * n.depth * 30 - scrollY * (0.04 + n.depth * 0.08);
      const tw = 0.55 + Math.sin(n.pulse) * 0.25;
      if (n.node) {
        ctx.fillStyle = `rgba(${accent.r},${accent.g},${accent.b},${0.9 * tw})`;
        ctx.shadowColor = `rgba(${accent.r},${accent.g},${accent.b},0.8)`;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(x, y, n.r * 1.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      } else {
        ctx.fillStyle = `rgba(${190 + accent.r * 0.1},${195},${225},${0.32 * tw})`;
        ctx.beginPath();
        ctx.arc(x, y, n.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    if (moving) raf = requestAnimationFrame(frame);
    else raf = null;
  }

  function kick() { if (!raf) raf = requestAnimationFrame(frame); }

  window.addEventListener('pointermove', (e) => {
    tmx = e.clientX / window.innerWidth;
    tmy = e.clientY / window.innerHeight;
    kick();
  });
  window.addEventListener('scroll', () => {
    scrollY = window.scrollY;
    if (scrollY < window.innerHeight) kick();
  }, { passive: true });

  let rt;
  window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(size, 150); });
  window.addEventListener('tweakschange', () => { readAccent(); kick(); });

  function start() {
    readAccent();
    size();
    // draw one static frame even if motion is off
    frame();
    if (motionOn()) kick();
  }

  if (document.readyState === 'complete' || document.readyState === 'interactive') start();
  else window.addEventListener('DOMContentLoaded', start);
})();
