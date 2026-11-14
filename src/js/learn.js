/* Self-learning diagram: wires are computed from the real card positions (so the same code serves the wide row layout and
   the narrow vertical flow), then a short one-off sequence runs when the diagram enters the viewport and settles into the
   complete picture. Reduced motion / no IntersectionObserver: the complete diagram is drawn immediately, nothing moves. */
const NS = "http://www.w3.org/2000/svg";
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

export function initLearn(reduceMotion) {
  const root = document.querySelector("[data-learn]");
  if (!root) return;
  const svg = root.querySelector(".lrn-wires"), node = (k) => root.querySelector(`[data-node="${k}"]`);
  const EDGES = [["in-1", "hub"], ["in-2", "hub"], ["in-3", "hub"], ["hub", "idea"], ["idea", "video"], ["video", "evidence"], ["evidence", "hub", "return"]];
  const wires = new Map();
  let running = false, finished = false, visible = false, onVisible = [];
  const gate = () => (visible && !document.hidden ? Promise.resolve() : new Promise((r) => onVisible.push(r))); // off-screen or hidden tab: hold here
  const resume = () => { if (visible && !document.hidden) { const q = onVisible; onVisible = []; q.forEach((r) => r()); } };

  const box = (el) => { const r = el.getBoundingClientRect(), o = root.getBoundingClientRect(); return { l: r.left - o.left, r: r.right - o.left, t: r.top - o.top, b: r.bottom - o.top, cx: r.left - o.left + r.width / 2, cy: r.top - o.top + r.height / 2 }; };
  const geometry = ([from, to, kind]) => {
    const mode = getComputedStyle(root).getPropertyValue("--lrn-mode").trim() || "row";
    const a = box(from === "hub" ? node("hub").querySelector(".lrn-hub__mark") : node(from)), b = box(to === "hub" ? node("hub").querySelector(".lrn-hub__mark") : node(to));
    if (mode === "row") {
      if (kind === "return") { const hub = box(node("hub")), drop = Math.max(a.b, hub.b) + 84; root.style.setProperty("--lrn-return-top", `${Math.max(a.b, hub.b) + 84 * 0.75 + 14}px`); return `M${a.cx},${a.b} C${a.cx},${drop} ${hub.cx},${drop} ${hub.cx},${hub.b + 6}`; }
      const mid = (a.r + b.l) / 2; return `M${a.r},${a.cy} C${mid},${a.cy} ${mid},${b.cy} ${b.l - 2},${b.cy}`;
    }
    const W = root.getBoundingClientRect().width, spine = 20; // narrow: a spine down the left, the return path up the right
    if (kind === "return") { const x = W - 16; return `M${a.r},${a.cy} C${x + 6},${a.cy} ${x + 6},${a.cy - 40} ${x},${a.cy - 70} L${x},${b.cy + 50} C${x},${b.cy + 10} ${b.r + 40},${b.cy} ${b.r + 6},${b.cy}`; }
    return `M${a.l},${a.cy} C${spine},${a.cy} ${spine},${a.cy} ${spine},${(a.cy + b.cy) / 2} C${spine},${b.cy} ${spine},${b.cy} ${b.l - 2},${b.cy}`;
  };
  const layout = () => {
    const o = root.getBoundingClientRect(); svg.setAttribute("viewBox", `0 0 ${o.width} ${o.height}`);
    for (const edge of EDGES) {
      const key = edge.join(">"); let w = wires.get(key);
      if (!w) { const path = document.createElementNS(NS, "path"); if (edge[2]) path.setAttribute("data-return", ""); path.dataset.from = edge[0]; path.dataset.to = edge[1]; svg.append(path); w = { path, shown: false }; wires.set(key, w); }
      w.path.setAttribute("d", geometry(edge));
      w.path.style.visibility = w.shown || finished || !running ? "visible" : "hidden";
    }
  };
  const travel = (key, ms) => new Promise((done) => { // one dot runs along a wire while the wire draws in behind it
    const w = wires.get(key), dot = document.createElementNS(NS, "circle"); dot.setAttribute("r", "3.2"); svg.append(dot);
    const dashed = w.path.hasAttribute("data-return"); let t0 = 0;
    w.shown = true; w.path.style.visibility = "visible";
    const step = (t) => { if (!t0) t0 = t; const k = Math.min(1, (t - t0) / ms), e = k < .5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2, len = w.path.getTotalLength(), p = w.path.getPointAtLength(len * e);
      dot.setAttribute("cx", p.x); dot.setAttribute("cy", p.y);
      if (!dashed) { w.path.style.strokeDasharray = `${len}`; w.path.style.strokeDashoffset = `${len * (1 - e)}`; } else w.path.style.opacity = String(0.7 * e);
      if (k < 1 && running) requestAnimationFrame(step); else { dot.remove(); w.path.style.strokeDasharray = ""; w.path.style.strokeDashoffset = ""; w.path.style.opacity = ""; done(); } };
    requestAnimationFrame(step);
  });
  const on = (...keys) => keys.forEach((k) => node(k).setAttribute("data-on", ""));
  const pulse = async () => { node("hub").setAttribute("data-pulse", ""); await wait(340); node("hub").removeAttribute("data-pulse"); };
  const settle = () => { running = false; finished = true; root.removeAttribute("data-anim"); root.setAttribute("data-complete", ""); root.querySelectorAll("[data-node]").forEach((n) => n.setAttribute("data-on", "")); node("idea").setAttribute("data-next", ""); layout(); };

  async function play() {
    running = true; layout(); await gate();
    on("in-1"); await wait(140); on("in-2"); await wait(140); on("in-3"); await wait(260); on("hub"); await wait(420);           // 1. inputs gather around Videogo
    await gate(); await Promise.all([travel("in-1>hub", 760), wait(120).then(() => travel("in-2>hub", 760)), wait(240).then(() => travel("in-3>hub", 760))]); // 2. dots travel in
    await pulse(); await gate();
    await travel("hub>idea", 620); on("idea"); await wait(620);                                                                 // 3. a concrete idea emerges
    await gate(); await travel("idea>video", 560); on("video"); await wait(560);                                                              // 4. the idea becomes a video
    await gate(); await travel("video>evidence", 560); on("evidence"); await wait(620);
    await gate(); on("return"); await travel("evidence>hub>return", 1300); await pulse();                                                     // 5. evidence flows back…
    on("next"); node("idea").setAttribute("data-next", "");                                                                     //    …and informs the next idea
    await wait(300); settle();
  }

  // Restrained hover response: the wires touching a card darken.
  root.querySelectorAll("[data-node]").forEach((el) => {
    const key = el.dataset.node, set = (hot) => wires.forEach((w) => { if (w.path.dataset.from === key || w.path.dataset.to === key) w.path.toggleAttribute("data-hot", hot); });
    el.addEventListener("pointerenter", (e) => e.pointerType === "mouse" && set(true)); el.addEventListener("pointerleave", () => set(false));
  });

  if ("ResizeObserver" in window) new ResizeObserver(layout).observe(root); else window.addEventListener("resize", layout);
  if (document.fonts?.ready) document.fonts.ready.then(layout);

  if (reduceMotion.matches || !("IntersectionObserver" in window)) { settle(); return; }
  root.setAttribute("data-anim", ""); layout();
  let started = false;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible && !started) { started = true; play().catch(settle); } resume(); }, { threshold: 0.3 }).observe(root);
  document.addEventListener("visibilitychange", resume);
  reduceMotion.addEventListener("change", () => reduceMotion.matches && settle());
  return { settle };
}
