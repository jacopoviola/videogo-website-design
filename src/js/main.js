import { validateDemoRequest } from "./validate.js";
import { initLearn } from "./learn.js";
import { initParticles } from "./particles.js";
import { initUtility } from "./utility.js";

window.__vgMain = true; // tells js-flag.js the page script started (otherwise it un-hides everything after 3 s)

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");

function setToggle(button, { pressed, label }) {
  button.setAttribute("aria-pressed", String(pressed));
  button.querySelector("[data-label]").textContent = label;
}

/* ---------- Scroll entrances: each block reveals once as it enters the viewport; grouped cards stagger.
   No scroll listeners. Anchor jumps and keyboard focus reveal their target immediately. ---------- */
const STAGGER_ITEMS = ".mk-facts > div, .mk-chip, .mk-board > div, .mk-need";
function initReveal() {
  const groups = [...document.querySelectorAll("[data-stagger]")];
  for (const group of groups) {
    const items = group.matches("ol, ul, .mk-compare") ? [...group.children] : [...group.querySelectorAll(STAGGER_ITEMS)];
    group.setAttribute("data-instant", ""); // hide without animating the hide itself
    items.forEach((el, i) => { el.setAttribute("data-reveal-item", ""); el.style.setProperty("--i", i); });
  }
  requestAnimationFrame(() => requestAnimationFrame(() => groups.forEach((g) => !g.classList.contains("is-in") && g.removeAttribute("data-instant"))));
  const targets = [...document.querySelectorAll("[data-reveal], [data-stagger]")];
  const show = (el, instant = false) => {
    if (el.classList.contains("is-in")) return;
    if (instant) el.setAttribute("data-instant", "");
    el.classList.add("is-in");
    // Once entered, drop the stagger delay so hover responses are immediate.
    const items = el.querySelectorAll("[data-reveal-item]");
    setTimeout(() => { items.forEach((item) => { item.removeAttribute("data-reveal-item"); item.style.removeProperty("--i"); }); el.removeAttribute("data-instant"); }, instant ? 50 : 700 + items.length * 90);
  };
  if (!("IntersectionObserver" in window) || reduceMotion.matches) { targets.forEach((el) => show(el, true)); return; }
  const io = new IntersectionObserver((entries) => { for (const entry of entries) if (entry.isIntersecting) { show(entry.target); io.unobserve(entry.target); } }, { rootMargin: "0px 0px -8% 0px", threshold: 0.12 });
  targets.forEach((el) => io.observe(el));

  const revealWithin = (scope) => { if (!scope) return; [scope, ...scope.querySelectorAll("[data-reveal], [data-stagger]")].forEach((el) => el.matches?.("[data-reveal], [data-stagger]") && show(el, true)); const host = scope.closest("[data-reveal], [data-stagger]"); if (host) show(host, true); };
  const revealHash = (hash) => { if (!hash || hash.length < 2) return; let target = null; try { target = document.querySelector(hash); } catch {} if (target) revealWithin(target.closest("section, footer") || target); };
  document.addEventListener("click", (e) => { const a = e.target.closest?.('a[href^="#"]'); if (a) revealHash(a.getAttribute("href")); }, true);
  window.addEventListener("hashchange", () => revealHash(location.hash));
  document.addEventListener("focusin", (e) => { const host = e.target.closest?.("[data-reveal], [data-stagger]"); if (host) show(host, true); });
  revealHash(location.hash);
}

/* ---------- Product preview: a four-step HTML walkthrough (~8.4 s), not a video ---------- */
const PV_STEPS = [
  { hold: 1500, cursor: '[data-card="idea"]' },
  { hold: 2300, cursor: '[data-card="idea"]' },
  { hold: 2000, cursor: '[data-card="arrive"]' },
  { hold: 2600, cursor: '[data-pv-target="publish"]' }, // the cursor rests on Publish; nothing is published
];
function initPreview() {
  const root = document.getElementById("preview");
  if (!root) return;
  const toggle = document.querySelector("[data-pv-toggle]"), replay = document.querySelector("[data-pv-replay]");
  const cursor = root.querySelector("[data-pv-cursor]"), app = root.querySelector(".pv-app");
  let step = 0, timer = 0, playing = false, visible = false, userPaused = reduceMotion.matches; // reduced motion: static until the visitor presses Play

  const placeCursor = () => {
    const target = root.querySelector(PV_STEPS[step].cursor);
    if (!target || !target.offsetParent) return;
    const a = app.getBoundingClientRect(), r = target.getBoundingClientRect();
    cursor.style.setProperty("--cx", `${r.left - a.left + r.width * 0.55}px`);
    cursor.style.setProperty("--cy", `${r.top - a.top + Math.min(r.height * 0.5, 120)}px`);
  };
  const show = (n) => {
    step = n;
    root.dataset.step = String(n);
    requestAnimationFrame(placeCursor);
  };
  const schedule = () => { clearTimeout(timer); timer = setTimeout(() => { show((step + 1) % PV_STEPS.length); schedule(); }, PV_STEPS[step].hold); };
  const sync = () => {
    const shouldPlay = visible && !userPaused && !document.hidden;
    if (shouldPlay && !playing) { playing = true; root.setAttribute("data-playing", ""); schedule(); }
    if (!shouldPlay && playing) { playing = false; root.removeAttribute("data-playing"); clearTimeout(timer); }
    setToggle(toggle, { pressed: !playing, label: playing ? "Pause" : "Play" });
  };

  toggle.hidden = false; replay.hidden = false;
  toggle.addEventListener("click", () => { userPaused = playing; sync(); });
  replay.addEventListener("click", () => { show(0); userPaused = false; sync(); if (playing) schedule(); });
  document.addEventListener("visibilitychange", sync);
  window.addEventListener("resize", placeCursor);
  if ("IntersectionObserver" in window) new IntersectionObserver(([e]) => { visible = e.isIntersecting; sync(); }, { threshold: 0.25 }).observe(root);
  else visible = true;

  if (reduceMotion.matches) show(3); // static frame: the Ready state with the owner's controls
  sync();
}

/* ---------- Logo marquee (pauses on hover; static under reduced motion) ---------- */
function initMarquee() {
  const marquee = document.querySelector("[data-marquee]");
  if (!marquee) return;
  const track = marquee.querySelector(".mk-marquee__track"), originals = [...track.children];
  const apply = () => {
    track.querySelectorAll("[data-clone]").forEach((el) => el.remove());
    if (reduceMotion.matches) { marquee.removeAttribute("data-running"); return; }
    const copies = Math.max(1, Math.ceil(window.innerWidth / (originals.length * 168))) * 2 - 1;
    for (let c = 0; c < copies; c++) originals.forEach((li) => {
      const clone = li.cloneNode(true);
      clone.dataset.clone = ""; clone.setAttribute("aria-hidden", "true");
      track.append(clone);
    });
    marquee.setAttribute("data-running", "");
  };
  apply();
  reduceMotion.addEventListener("change", apply);
}

/* ---------- Showcase videos: real muted playback, no visible controls.
   Mouse: entering plays, leaving pauses, re-entering resumes; only the hovered video plays. Keyboard: focus plays, blur pauses,
   Enter/Space toggles. Touch: tap toggles. Off-screen or hidden tab: paused. Reduced motion: poster until explicitly activated.
   The poster stays while loading and if playback is refused or fails. Sound can never be enabled. ---------- */
function initVideos() {
  const items = [...document.querySelectorAll("[data-video]")].map((el) => ({ el, frame: el.querySelector(".mk-video__frame"), video: el.querySelector("video"), loaded: false, hover: false, focus: false, toggled: false, onscreen: true }));
  if (!items.length) return;

  const load = (it) => { if (it.loaded) return; it.loaded = true; it.video.preload = "auto"; it.video.src = it.video.dataset.src; it.video.load(); };
  const wants = (it) => it.onscreen && !document.hidden && !it.el.hasAttribute("data-failed") && (it.toggled || (!reduceMotion.matches && (it.hover || it.focus)));
  const sync = (it) => {
    it.video.muted = true; it.video.defaultMuted = true; it.video.volume = 0;
    if (wants(it)) {
      load(it);
      for (const other of items) if (other !== it && !other.video.paused) { other.hover = other.focus = other.toggled = false; other.video.pause(); } // one at a time
      const attempt = it.video.play();
      if (attempt?.catch) attempt.catch((err) => { if (err?.name !== "AbortError") it.toggled = false; }); // refused playback leaves the poster, never a broken card
    } else if (!it.video.paused) it.video.pause();
  };
  for (const it of items) {
    let lastPointer = "mouse";
    it.video.addEventListener("playing", () => it.frame.setAttribute("aria-pressed", "true"));
    it.video.addEventListener("pause", () => it.frame.setAttribute("aria-pressed", "false"));
    it.video.addEventListener("volumechange", () => { if (!it.video.muted) it.video.muted = true; });
    it.video.addEventListener("error", () => { if (!it.loaded) return; it.el.setAttribute("data-failed", ""); it.el.style.setProperty("--poster", `url("${it.video.poster}")`); sync(it); });
    // Touch also fires compatibility mouseenter/mouseleave; those must not count as hover or a tap would play-then-pause.
    const enter = (e) => { if (e.pointerType) lastPointer = e.pointerType; if (lastPointer !== "mouse") return; it.hover = true; sync(it); };
    const leave = (e) => { if ((e.pointerType || lastPointer) !== "mouse") return; it.hover = false; it.toggled = false; sync(it); };
    it.frame.addEventListener("pointerenter", enter); it.frame.addEventListener("pointerleave", leave);
    it.frame.addEventListener("mouseenter", enter); it.frame.addEventListener("mouseleave", leave); // belt and braces for browsers that skip pointer events
    it.frame.addEventListener("focus", () => { it.focus = it.frame.matches(":focus-visible"); sync(it); });
    it.frame.addEventListener("blur", () => { it.focus = false; it.toggled = false; sync(it); });
    it.frame.addEventListener("pointerdown", (e) => { lastPointer = e.pointerType || "mouse"; });
    it.frame.addEventListener("click", (e) => {
      const keyboard = e.detail === 0;
      if (!keyboard && lastPointer === "mouse" && !reduceMotion.matches) return; // mouse: hover already drives playback
      const playing = !it.video.paused;
      it.toggled = !playing; if (playing) { it.hover = false; it.focus = false; }
      sync(it);
    });
  }
  if ("IntersectionObserver" in window) {
    const near = new IntersectionObserver((entries, io) => { for (const e of entries) if (e.isIntersecting) { load(items.find((i) => i.frame === e.target)); io.unobserve(e.target); } }, { rootMargin: "600px 0px" });
    const seen = new IntersectionObserver((entries) => { for (const e of entries) { const it = items.find((i) => i.frame === e.target); it.onscreen = e.isIntersecting; if (!it.onscreen) it.toggled = it.hover = false; sync(it); } }, { threshold: 0.05 });
    items.forEach((it) => { near.observe(it.frame); seen.observe(it.frame); });
  }
  document.addEventListener("visibilitychange", () => items.forEach(sync));

  // Workflow steps under each video: revealed in order as they enter view; the hovered / focused video highlights its own.
  for (const it of items) {
    const steps = it.el.querySelector("[data-flowsteps]");
    if (!steps) continue;
    if (!reduceMotion.matches && "IntersectionObserver" in window) {
      steps.setAttribute("data-pending", "");
      [...steps.children].forEach((li, i) => { li.style.transitionDelay = `${i * 220}ms`; });
      new IntersectionObserver(([e], io) => { if (!e.isIntersecting) return; io.disconnect(); steps.removeAttribute("data-pending"); setTimeout(() => [...steps.children].forEach((li) => li.style.removeProperty("transition-delay")), 1200); }, { threshold: 0.6 }).observe(steps);
    }
    it.frame.addEventListener("pointerenter", () => it.el.setAttribute("data-hot", "")); it.frame.addEventListener("pointerleave", () => it.el.removeAttribute("data-hot"));
  }
}

/* ---------- Comparison: both workflows reveal when in view — the manual side stage by stage with its cursor hopping
   between tools; the Videogo side as a connected flow, then the feedback path from results back to planning. They settle complete. ---------- */
function initHop() {
  const compare = document.querySelector(".mk-compare"), hop = document.querySelector("[data-hop]");
  if (!compare || !hop) return;
  const stops = [...hop.querySelectorAll("span")], cursor = hop.querySelector(".mk-hop__cursor");
  const stage = (sel, from, step) => compare.querySelectorAll(sel).forEach((el, i) => el.style.setProperty("--d", `${from + i * step}ms`));
  if (reduceMotion.matches || !("IntersectionObserver" in window)) return;
  compare.setAttribute("data-pending", "");
  stage(".mk-panel:not(.mk-panel--dark) .mk-hop span", 200, 220); stage(".mk-panel:not(.mk-panel--dark) .mk-dims > div", 1500, 140);   // stages, then handoffs
  stage(".mk-flow li", 300, 260); stage(".mk-panel--dark .mk-dims > div", 1700, 140); compare.querySelector(".mk-flow__loop path")?.style.setProperty("--d", "1700ms"); compare.querySelector(".mk-flow__tip")?.style.setProperty("--d", "1900ms"); compare.querySelector(".mk-flow__back")?.style.setProperty("--d", "1800ms");
  const io = new IntersectionObserver(([e]) => {
    if (!e.isIntersecting) return;
    io.disconnect();
    compare.removeAttribute("data-pending");
    stops.forEach((stop, n) => setTimeout(() => { // one oversized illustrative cursor clicks through the tools once, then rests
      if (n === 0) hop.setAttribute("data-hopping", "");
      const box = hop.getBoundingClientRect(), r = stop.getBoundingClientRect();
      hop.style.setProperty("--hx", `${r.left - box.left + r.width * 0.72}px`); hop.style.setProperty("--hy", `${r.top - box.top + r.height * 0.6}px`);
      setTimeout(() => { cursor.setAttribute("data-press", ""); stops.forEach((s) => s.removeAttribute("data-active")); stop.setAttribute("data-active", ""); setTimeout(() => cursor.removeAttribute("data-press"), 160); }, 580);
    }, 500 + n * 900));
    setTimeout(() => compare.querySelectorAll("[style*='--d']").forEach((el) => el.style.removeProperty("--d")), 4500); // settled: no lingering delays on hover states
  }, { threshold: 0, rootMargin: "0px 0px -35% 0px" }); // starts once the section's top passes 65% of the viewport, however tall it is
  io.observe(compare);
}

/* ---------- Comparison pairs: hovering or focusing a row lights the matching row on the other side. ---------- */
function initPairs() {
  const compare = document.querySelector("[data-pairs]");
  if (!compare) return;
  const sides = [...compare.querySelectorAll(".mk-panel .mk-dims")].map((dl) => [...dl.children]);
  const set = (i, on) => sides.forEach((rows) => rows[i]?.toggleAttribute("data-hot", on));
  sides.forEach((rows) => rows.forEach((row, i) => {
    row.addEventListener("pointerenter", () => set(i, true)); row.addEventListener("pointerleave", () => set(i, false));
  }));
}

/* ---------- Hero dot field: a sparse charcoal dot grid drawn once (and again on resize / theme change). ---------- */
function initDotField() {
  const canvas = document.querySelector("[data-dotfield]");
  if (!canvas || !canvas.getContext) return;
  const hero = canvas.parentElement, copy = hero.querySelector(".mk-hero__copy"), ctx = canvas.getContext("2d");
  const GAP = 30, RADIUS = 1.6, REACH = 130, PUSH = 22, SPRING = 0.085, DAMP = 0.8;
  let dots = [], w = 0, h = 0, frame = 0, px = -9999, py = -9999, active = false;

  const build = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2), box = hero.getBoundingClientRect();
    w = box.width; h = Math.min(box.height, 900);
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr); canvas.style.height = `${h}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const c = copy.getBoundingClientRect(), cx = c.left - box.left + c.width / 2, cy = c.top - box.top + c.height / 2;
    const rx = Math.min(c.width, 920) / 2 + 40, ry = c.height / 2 + 56; // clear zone around badge, headline, copy and CTA
    dots = [];
    for (let y = GAP / 2; y < h; y += GAP) for (let x = (w % GAP) / 2 + GAP / 2; x < w; x += GAP) {
      const d = (Math.abs((x - cx) / rx) ** 4 + Math.abs((y - cy) / ry) ** 4) ** 0.25; // <1 inside the clear rounded box
      const clear = Math.max(0, Math.min(1, (d - 1) / 0.45));        // fade in just outside it
      const fade = Math.max(0, Math.min(1, (h - y) / 260));          // and out towards the product preview
      const alpha = strength() * clear * fade;
      if (alpha > 0.02) dots.push({ x, y, ox: 0, oy: 0, vx: 0, vy: 0, alpha });
    }
  };
  const draw = () => {
    ctx.clearRect(0, 0, w, h);
    for (const d of dots) { ctx.globalAlpha = d.alpha; ctx.beginPath(); ctx.arc(d.x + d.ox, d.y + d.oy, RADIUS, 0, 6.2832); ctx.fill(); }
  };
  const tick = () => {
    frame = 0;
    let moving = false;
    for (const d of dots) {
      const dx = d.x + d.ox - px, dy = d.y + d.oy - py, dist = Math.hypot(dx, dy);
      if (active && dist < REACH && dist > 0.01) { const f = (1 - dist / REACH) ** 2 * PUSH * 0.16; d.vx += (dx / dist) * f; d.vy += (dy / dist) * f; }
      d.vx = (d.vx - d.ox * SPRING) * DAMP; d.vy = (d.vy - d.oy * SPRING) * DAMP;
      d.ox += d.vx; d.oy += d.vy;
      if (Math.abs(d.ox) + Math.abs(d.oy) + Math.abs(d.vx) + Math.abs(d.vy) > 0.02) moving = true; else { d.ox = d.oy = d.vx = d.vy = 0; }
    }
    draw();
    canvas.toggleAttribute("data-settled", !moving);
    if (moving) frame = requestAnimationFrame(tick);
  };
  const kick = () => { if (!frame) frame = requestAnimationFrame(tick); };

  const strength = () => { const v = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--mk-dot-alpha")); return v > 0 ? Math.min(v / 100, 1) : 0.4; }; // --mk-dot-alpha: per-theme dot strength
  const ink = () => { const cs = getComputedStyle(document.documentElement); return cs.getPropertyValue("--mk-dot-ink").trim() || cs.getPropertyValue("--vg-text-primary").trim() || "#1D1D1F"; }; // --mk-dot-ink: optional accent for the dot field
  const rebuild = () => { build(); ctx.fillStyle = ink(); draw(); };
  document.addEventListener("vg:theme", rebuild);
  rebuild();
  if (document.fonts?.ready) document.fonts.ready.then(rebuild);
  if ("ResizeObserver" in window) new ResizeObserver(rebuild).observe(hero); else window.addEventListener("resize", rebuild);

  // The field stays still: the pointer-particle layer is the page's one pointer effect.
}

/* ---------- Demo request form ---------- */
const MESSAGES = {
  sending: "Sending…",
  success: (email) => `Request received. We’ll reply to ${email} to arrange a conversation.`,
  invalid: "Check the highlighted fields and try again.",
  rate_limited: "Too many attempts from this connection. Try again in a few minutes.",
  challenge_failed: "The spam check didn’t pass. Reload the page and try again.",
  failed: "Your request didn’t send, and nothing was saved. Try again.",
};

let turnstileToken = "";
function initTurnstile() {
  const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY, slot = document.getElementById("turnstile-slot");
  if (!siteKey || !slot) return;
  window.__vgTurnstileReady = () => {
    window.turnstile.render(slot, {
      sitekey: siteKey, theme: "light", appearance: "interaction-only",
      callback: (token) => { turnstileToken = token; },
      "expired-callback": () => { turnstileToken = ""; },
      "error-callback": () => { turnstileToken = ""; },
    });
  };
  const s = document.createElement("script");
  s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=__vgTurnstileReady";
  s.async = true; s.defer = true;
  document.head.append(s);
}

function initForm() {
  const form = document.getElementById("demo-form");
  if (!form) return;
  const status = document.getElementById("form-status"), submit = form.querySelector('[type="submit"]');
  const fields = { firstName: ["f-first", "e-first"], lastName: ["f-last", "e-last"], email: ["f-email", "e-email"], website: ["f-website", "e-website"], message: ["f-message", "e-message"] };

  const showErrors = (errors) => {
    let first = null;
    for (const [name, [inputId, errorId]] of Object.entries(fields)) {
      const input = document.getElementById(inputId), error = document.getElementById(errorId), message = errors[name] || "";
      input.setAttribute("aria-invalid", message ? "true" : "false");
      error.textContent = message; error.hidden = !message;
      if (message && !first) first = input;
    }
    return first;
  };
  const setStatus = (kind, text) => { status.dataset.kind = kind; status.textContent = text; };

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(form));
    const { errors, values } = validateDemoRequest(data);
    const firstInvalid = showErrors(errors);
    if (firstInvalid) { setStatus("error", MESSAGES.invalid); firstInvalid.focus(); return; }

    submit.disabled = true; submit.setAttribute("data-loading", ""); submit.setAttribute("aria-busy", "true");
    setStatus("pending", MESSAGES.sending);
    try {
      const res = await fetch(form.action, {
        method: "POST", headers: { "content-type": "application/json", accept: "application/json" },
        body: JSON.stringify({ ...values, company: data.company || "", turnstileToken }),
      });
      const body = await res.json().catch(() => ({}));
      // Success is shown only when the server confirms the request was stored.
      if (res.ok && body.ok === true && body.stored === true) { setStatus("success", MESSAGES.success(values.email)); form.reset(); }
      else if (res.status === 422 && body.errors) { showErrors(body.errors)?.focus(); setStatus("error", MESSAGES.invalid); }
      else setStatus("error", MESSAGES[body.error] || MESSAGES.failed);
    } catch {
      setStatus("error", MESSAGES.failed);
    } finally {
      submit.disabled = false; submit.removeAttribute("data-loading"); submit.removeAttribute("aria-busy");
      if (window.turnstile && turnstileToken) { window.turnstile.reset(); turnstileToken = ""; }
    }
  });
}

initUtility();
initReveal();
initPreview();
initMarquee();
initVideos();
initHop();
initPairs();
initDotField();
initLearn(reduceMotion);
initParticles(reduceMotion, finePointer);
initTurnstile();
initForm();
