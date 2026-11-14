/* Pointer particles: a few tiny charcoal dots (light in the dark theme) shed near the moving pointer, gone in ~half a second.
   Decorative only: fixed canvas, pointer-events none, aria-hidden. The native cursor is untouched. Off for touch, reduced
   motion and hidden tabs. It is the page's single pointer effect (the hero dot field is a static background). Nothing is
   emitted over videos, form fields or the theme toggle, so particles never sit on media or controls. */
const MAX = 26, LIFE = 520, STEP = 16;

export function initParticles(reduceMotion, finePointer) {
  if (!finePointer.matches || reduceMotion.matches) return;
  const canvas = document.createElement("canvas");
  canvas.className = "mk-particles"; canvas.setAttribute("aria-hidden", "true");
  document.body.append(canvas);
  const ctx = canvas.getContext("2d"); let parts = [], frame = 0, lx = null, ly = null, dpr = 1, ink = "29,29,31", edge = "255,255,255";

  const size = () => { dpr = Math.min(window.devicePixelRatio || 1, 2); canvas.width = innerWidth * dpr; canvas.height = innerHeight * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
  const colours = () => { const cs = getComputedStyle(document.documentElement); ink = cs.getPropertyValue("--mk-particle").trim() || ink; edge = cs.getPropertyValue("--mk-particle-edge").trim() || edge; };
  const tick = (now) => {
    frame = 0; ctx.clearRect(0, 0, innerWidth, innerHeight);
    parts = parts.filter((p) => now - p.born < LIFE);
    for (const p of parts) {
      const k = (now - p.born) / LIFE, a = (1 - k) ** 1.6;
      p.x += p.vx; p.y += p.vy; p.vx *= 0.94; p.vy = p.vy * 0.94 + 0.012;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r + 0.9, 0, 6.2832); ctx.fillStyle = `rgba(${edge},${0.5 * a})`; ctx.fill(); // thin light edge keeps dots visible on dark surfaces
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.2832); ctx.fillStyle = `rgba(${ink},${0.78 * a})`; ctx.fill();
    }
    canvas.dataset.count = String(parts.length);
    if (parts.length) frame = requestAnimationFrame(tick);
  };
  const quiet = (target) => !(target instanceof Element) || target.closest(".mk-video__frame, input, textarea, .ut-theme, .md__body, video");

  size(); colours();
  window.addEventListener("resize", size);
  document.addEventListener("vg:theme", colours);
  document.addEventListener("visibilitychange", () => { if (document.hidden) { parts = []; ctx.clearRect(0, 0, innerWidth, innerHeight); canvas.dataset.count = "0"; } });
  window.addEventListener("pointermove", (e) => {
    if (e.pointerType !== "mouse" || document.hidden || reduceMotion.matches) return;
    if (lx === null) { lx = e.clientX; ly = e.clientY; return; }
    const dx = e.clientX - lx, dy = e.clientY - ly, dist = Math.hypot(dx, dy);
    if (dist < STEP) return;
    lx = e.clientX; ly = e.clientY;
    if (quiet(e.target)) return;
    const n = dist > 60 ? 2 : 1;
    for (let i = 0; i < n && parts.length < MAX; i++) parts.push({ x: e.clientX + (Math.random() - 0.5) * 14, y: e.clientY + 10 + (Math.random() - 0.5) * 14, vx: -dx / dist * 0.35 + (Math.random() - 0.5) * 0.5, vy: -dy / dist * 0.35 + (Math.random() - 0.5) * 0.5, r: 1.1 + Math.random() * 1.1, born: performance.now() });
    if (!frame) frame = requestAnimationFrame(tick);
  }, { passive: true });
}
