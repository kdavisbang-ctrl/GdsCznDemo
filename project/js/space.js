/* Space-portal starfield: gentle 3D drift at idle, hyperspace warp on Enter.
   Canvas clears transparent each frame so the CSS nebula/planet show through. */
(function () {
  function Starfield(canvas) {
    this.c = canvas;
    this.ctx = canvas.getContext('2d');
    this.stars = [];
    this.meteors = [];
    this.raf = null;
    this.speed = 0.5;
    this.target = 0.5;
    this.warping = false;
    this.warpT = 0;
    this.onDone = null;
    this.accent = { r: 167, g: 139, b: 250 };
    this.MAXZ = 1.25;
    this.t = 0;
    this.mx = 0; this.my = 0;      // target pointer offset (-1..1)
    this.px = 0; this.py = 0;      // smoothed pointer offset
    this.meteorTimer = 1400;
    this.moon = null;
    this.loop = this.loop.bind(this);
    this.resize = this.resize.bind(this);
    this.onPointer = this.onPointer.bind(this);
  }

  Starfield.prototype.onPointer = function (e) {
    this.mx = (e.clientX / window.innerWidth) * 2 - 1;
    this.my = (e.clientY / window.innerHeight) * 2 - 1;
  };

  Starfield.prototype.readAccent = function () {
    var v = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();
    var p = document.createElement('span');
    p.style.color = v || '#A78BFA';
    document.body.appendChild(p);
    var m = getComputedStyle(p).color.match(/\d+/g);
    document.body.removeChild(p);
    if (m) this.accent = { r: +m[0], g: +m[1], b: +m[2] };
  };

  Starfield.prototype.resize = function () {
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    var r = this.c.getBoundingClientRect();
    this.W = r.width; this.H = r.height;
    this.c.width = Math.round(this.W * this.dpr);
    this.c.height = Math.round(this.H * this.dpr);
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.cx = this.W / 2; this.cy = this.H / 2;
    this.f = Math.max(this.W, this.H) * 0.62;
    if (!this.stars.length) this.build();
  };

  Starfield.prototype.newStar = function (z) {
    return {
      x: (Math.random() * 2 - 1),
      y: (Math.random() * 2 - 1),
      z: (z === undefined) ? this.MAXZ : z,
      pz: z,
      tw: Math.random() * 6.283,
      accent: Math.random() < 0.07
    };
  };

  Starfield.prototype.build = function () {
    var n = Math.min(920, Math.max(380, Math.round(this.W * this.H / 1150)));
    this.stars = [];
    for (var i = 0; i < n; i++) this.stars.push(this.newStar(0.05 + Math.random() * (this.MAXZ - 0.05)));
    this.moon = {
      x: this.W * 0.16, y: this.H * 0.19, r: Math.max(18, this.W * 0.024),
      drift: 0.05 + Math.random() * 0.025
    };
  };

  Starfield.prototype.spawnMeteor = function () {
    var fromLeft = Math.random() < 0.5;
    var ang = (fromLeft ? 1 : -1) * (0.28 + Math.random() * 0.18);
    var sp = 7 + Math.random() * 5;
    this.meteors.push({
      x: fromLeft ? -40 : this.W + 40,
      y: Math.random() * this.H * 0.45,
      vx: Math.cos(ang) * sp * (fromLeft ? 1 : -1),
      vy: Math.sin(ang) * sp + 1.5,
      len: 90 + Math.random() * 80,
      life: 1
    });
  };

  Starfield.prototype.start = function () {
    this.readAccent();
    this.resize();
    window.addEventListener('resize', this.resize);
    window.addEventListener('pointermove', this.onPointer);
    if (!this.raf) this.raf = requestAnimationFrame(this.loop);
  };

  Starfield.prototype.stop = function () {
    if (this.raf) { cancelAnimationFrame(this.raf); this.raf = null; }
    window.removeEventListener('resize', this.resize);
    window.removeEventListener('pointermove', this.onPointer);
  };

  Starfield.prototype.warp = function (done) {
    this.warping = true;
    this.warpT = 0;
    this.onDone = done || null;
    this.target = 42;
    this.meteors = [];            // drop stray meteor streaks so colors stay clean
    if (!this.raf) this.raf = requestAnimationFrame(this.loop);
  };

  Starfield.prototype.drawMoon = function (offx, offy) {
    if (!this.moon) return;
    var ctx = this.ctx, m = this.moon, a = this.accent;
    // slow drift across the sky
    m.x += m.drift;
    if (m.x - m.r > this.W + 60) m.x = -60;
    var mx = m.x + offx * 1.4, my = m.y + offy * 1.4;
    // outer glow
    var g = ctx.createRadialGradient(mx, my, 0, mx, my, m.r * 3.4);
    g.addColorStop(0, 'rgba(' + a.r + ',' + a.g + ',' + a.b + ',0.20)');
    g.addColorStop(1, 'rgba(' + a.r + ',' + a.g + ',' + a.b + ',0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(mx, my, m.r * 3.4, 0, 6.283); ctx.fill();
    // disc
    ctx.fillStyle = 'rgba(214,219,238,0.9)';
    ctx.beginPath(); ctx.arc(mx, my, m.r, 0, 6.283); ctx.fill();
    // crescent shadow
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath(); ctx.arc(mx + m.r * 0.55, my - m.r * 0.28, m.r * 0.96, 0, 6.283); ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
    // accent rim
    ctx.strokeStyle = 'rgba(' + a.r + ',' + a.g + ',' + a.b + ',0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(mx, my, m.r + 0.5, -0.9, 0.7); ctx.stroke();
  };

  Starfield.prototype.drawMeteors = function () {
    var ctx = this.ctx, a = this.accent;
    if (!this.warping) {
      this.meteorTimer -= 16.7;
      if (this.meteorTimer <= 0) { this.spawnMeteor(); this.meteorTimer = 2600 + Math.random() * 4200; }
    }
    for (var i = this.meteors.length - 1; i >= 0; i--) {
      var m = this.meteors[i];
      m.x += m.vx; m.y += m.vy; m.life -= 0.012;
      if (m.life <= 0 || m.x < -120 || m.x > this.W + 120 || m.y > this.H + 120) { this.meteors.splice(i, 1); continue; }
      var tx = m.x - m.vx * (m.len / 8), ty = m.y - m.vy * (m.len / 8);
      var grad = ctx.createLinearGradient(m.x, m.y, tx, ty);
      var col = Math.random() < 0.5 ? (a.r + ',' + a.g + ',' + a.b) : '226,231,250';
      grad.addColorStop(0, 'rgba(' + col + ',' + (0.9 * m.life).toFixed(2) + ')');
      grad.addColorStop(1, 'rgba(' + col + ',0)');
      ctx.strokeStyle = grad; ctx.lineWidth = 1.6; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(m.x, m.y); ctx.lineTo(tx, ty); ctx.stroke();
      ctx.fillStyle = 'rgba(' + col + ',' + (0.9 * m.life).toFixed(2) + ')';
      ctx.beginPath(); ctx.arc(m.x, m.y, 1.4, 0, 6.283); ctx.fill();
    }
  };

  Starfield.prototype.loop = function () {
    var ctx = this.ctx, s, i, sx, sy, px, py, size, tw, a = this.accent;
    ctx.clearRect(0, 0, this.W, this.H);
    this.t += 16.7;

    if (this.warping) this.warpT += 16.7;
    this.speed += (this.target - this.speed) * (this.warping ? 0.3 : 0.05);
    var step = this.speed * 0.006;

    // smoothed pointer + slow ambient sway
    this.px += (this.mx - this.px) * 0.04;
    this.py += (this.my - this.py) * 0.04;
    var swayX = Math.sin(this.t * 0.00018) * 10;
    var swayY = Math.cos(this.t * 0.00013) * 7;
    var offBase = this.warping ? 0 : 1;
    var ox0 = (this.px * 34 + swayX) * offBase;
    var oy0 = (this.py * 24 + swayY) * offBase;

    if (!this.warping) this.drawMoon(ox0, oy0);

    for (i = 0; i < this.stars.length; i++) {
      s = this.stars[i];
      s.pz = s.z;
      s.z -= step;
      if (s.z <= 0.02) { this.stars[i] = this.newStar(this.MAXZ); continue; }
      var depth = (1 - s.z / this.MAXZ);
      sx = s.x / s.z * this.f + this.cx + ox0 * depth;
      sy = s.y / s.z * this.f + this.cy + oy0 * depth;
      if (sx < -40 || sx > this.W + 40 || sy < -40 || sy > this.H + 40) continue;
      size = Math.max(0.35, depth * 2.4);

      if (this.warping && this.speed > 2) {
        px = s.x / s.pz * this.f + this.cx;
        py = s.y / s.pz * this.f + this.cy;
        ctx.strokeStyle = 'rgba(218,226,255,0.92)';
        ctx.lineWidth = size;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(sx, sy);
        ctx.stroke();
      } else {
        s.tw += 0.045;
        tw = 0.7 + Math.sin(s.tw) * 0.3;
        ctx.fillStyle = s.accent
          ? 'rgba(' + a.r + ',' + a.g + ',' + a.b + ',' + (1 * tw).toFixed(3) + ')'
          : 'rgba(224,229,248,' + (0.95 * tw).toFixed(3) + ')';
        ctx.beginPath();
        ctx.arc(sx, sy, size * 0.7, 0, 6.283);
        ctx.fill();
        if (s.accent) {
          ctx.shadowColor = 'rgba(' + a.r + ',' + a.g + ',' + a.b + ',0.9)';
          ctx.shadowBlur = 8; ctx.fill(); ctx.shadowBlur = 0;
        }
      }
    }

    this.drawMeteors();

    if (this.warping && this.warpT > 170) {
      this.warping = false;
      if (this.onDone) { var d = this.onDone; this.onDone = null; d(); }
    }
    this.raf = requestAnimationFrame(this.loop);
  };

  window.Starfield = Starfield;
})();
