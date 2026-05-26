// Lightweight canvas particle system for the hero section.
// Intentionally dependency-free.

export function startHeroParticles(canvas, _opts = {}) {
  if (!canvas) return () => {};

  const ctx = canvas.getContext('2d');
  if (!ctx) return () => {};

  let rafId = 0;
  let running = true;

  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  const state = {
    w: 0,
    h: 0,
    particles: [],
    mouseX: 0,
    mouseY: 0,
    hasMouse: false,
  };

  const resize = () => {
    const rect = canvas.getBoundingClientRect();
    state.w = Math.max(1, Math.floor(rect.width));
    state.h = Math.max(1, Math.floor(rect.height));
    canvas.width = Math.floor(state.w * dpr);
    canvas.height = Math.floor(state.h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Density tuned for performance.
    const targetCount = Math.round((state.w * state.h) / 22000);
    const count = Math.max(45, Math.min(160, targetCount));

    state.particles = new Array(count).fill(0).map((_, i) => {
      const r = (Math.random() * 1.6 + 0.5) * (i % 7 === 0 ? 1.6 : 1);
      const speed = Math.random() * 0.35 + 0.08;
      return {
        x: Math.random() * state.w,
        y: Math.random() * state.h,
        vx: (Math.random() - 0.5) * speed,
        vy: (Math.random() - 0.5) * speed,
        r,
        a: Math.random() * 0.6 + 0.25,
      };
    });
  };

  const draw = (t) => {
    if (!running) return;

    ctx.clearRect(0, 0, state.w, state.h);

    // Subtle fade layer for trailing effect.
    ctx.fillStyle = 'rgba(3, 7, 18, 0.20)';
    ctx.fillRect(0, 0, state.w, state.h);

    // Move & draw particles.
    for (let i = 0; i < state.particles.length; i++) {
      const p = state.particles[i];

      // Mouse influence.
      if (state.hasMouse) {
        const dx = state.mouseX - p.x;
        const dy = state.mouseY - p.y;
        const dist2 = dx * dx + dy * dy;
        const influence = 1 / (dist2 / 12000 + 1);
        p.vx += dx * influence * 0.00002;
        p.vy += dy * influence * 0.00002;
      }

      p.x += p.vx;
      p.y += p.vy;

      // Gentle drift.
      const drift = Math.sin((t / 1000) * 0.6 + i) * 0.003;
      p.x += drift;

      // Wrap.
      if (p.x < -10) p.x = state.w + 10;
      if (p.x > state.w + 10) p.x = -10;
      if (p.y < -10) p.y = state.h + 10;
      if (p.y > state.h + 10) p.y = -10;

      // Particle glow.
      ctx.beginPath();
      ctx.fillStyle = `rgba(6, 182, 212, ${p.a})`;
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();

      // Occasional purple sparkle.
      if (i % 11 === 0) {
        ctx.beginPath();
        ctx.fillStyle = `rgba(124, 58, 237, ${Math.min(0.55, p.a + 0.15)})`;
        ctx.arc(p.x + 0.6, p.y - 0.4, p.r * 0.7, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Connect close particles.
    // Keep it cheap: only check a subset.
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    const maxLinks = 340;
    let links = 0;

    for (let i = 0; i < state.particles.length; i++) {
      if (links >= maxLinks) break;
      const a = state.particles[i];
      for (let j = i + 1; j < state.particles.length && j < i + 18; j++) {
        const b = state.particles[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < 110 * 110) {
          const alpha = 0.22 * (1 - d2 / (110 * 110));
          ctx.strokeStyle = `rgba(6, 182, 212, ${alpha})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
          links++;
        }
      }
    }

    ctx.restore();

    rafId = requestAnimationFrame(draw);
  };

  const onMouseMove = (e) => {
    const rect = canvas.getBoundingClientRect();
    state.mouseX = e.clientX - rect.left;
    state.mouseY = e.clientY - rect.top;
    state.hasMouse = true;
  };

  const onMouseLeave = () => {
    state.hasMouse = false;
  };

  const onResize = () => resize();

  resize();
  canvas.addEventListener('mousemove', onMouseMove);
  canvas.addEventListener('mouseleave', onMouseLeave);
  window.addEventListener('resize', onResize);

  rafId = requestAnimationFrame(draw);

  return () => {
    running = false;
    cancelAnimationFrame(rafId);
    window.removeEventListener('resize', onResize);
    canvas.removeEventListener('mousemove', onMouseMove);
    canvas.removeEventListener('mouseleave', onMouseLeave);
  };
}

