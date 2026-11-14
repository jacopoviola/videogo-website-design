/* Pricing and onboarding pages: entrances, theme toggle, and the Calendly embed (onboarding only). No pointer dust here. */
import { initUtility } from "./utility.js";
window.__vgMain = true;
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

function initReveal() {
  const groups = [...document.querySelectorAll("[data-stagger]")];
  groups.forEach((g) => { g.setAttribute("data-instant", ""); [...g.children].forEach((el, i) => { el.setAttribute("data-reveal-item", ""); el.style.setProperty("--i", i); }); });
  requestAnimationFrame(() => requestAnimationFrame(() => groups.forEach((g) => !g.classList.contains("is-in") && g.removeAttribute("data-instant"))));
  const targets = [...document.querySelectorAll("[data-reveal], [data-stagger]")];
  const show = (el, instant = false) => { if (el.classList.contains("is-in")) return; if (instant) el.setAttribute("data-instant", ""); el.classList.add("is-in"); setTimeout(() => { el.querySelectorAll("[data-reveal-item]").forEach((i) => { i.removeAttribute("data-reveal-item"); i.style.removeProperty("--i"); }); el.removeAttribute("data-instant"); }, instant ? 50 : 1000); };
  if (!("IntersectionObserver" in window) || reduceMotion.matches) { targets.forEach((el) => show(el, true)); return; }
  const io = new IntersectionObserver((entries) => { for (const e of entries) if (e.isIntersecting) { show(e.target); io.unobserve(e.target); } }, { rootMargin: "0px 0px -8% 0px", threshold: 0.12 });
  targets.forEach((el) => io.observe(el));
  document.addEventListener("focusin", (e) => { const host = e.target.closest?.("[data-reveal], [data-stagger]"); if (host) show(host, true); });
}

/* Calendly inline embed: the real widget (availability, timezone, confirmation all Calendly's own). If the script or the
   iframe does not load within a few seconds, the "Open calendar" link is the way in. Nothing here books, charges or subscribes. */
function initCalendly() {
  const root = document.querySelector("[data-calendly]");
  if (!root) return;
  const url = root.dataset.calendly, slot = root.querySelector("[data-cal-embed]"), fallback = root.querySelector("[data-cal-fallback]"), consent = root.querySelector("[data-cal-consent]"), loadButton = root.querySelector("[data-cal-load]");
  const fail = () => { root.setAttribute("data-failed", ""); fallback.hidden = false; };
  // Nothing from Calendly loads until the visitor asks for it (GDPR / ePrivacy): the "Open calendar" link is the alternative.
  loadButton.addEventListener("click", () => { consent.hidden = true; slot.hidden = false; load(); }, { once: true });
  function load() {
  const link = document.createElement("link"); link.rel = "stylesheet"; link.href = "https://assets.calendly.com/assets/external/widget.css"; document.head.append(link);
  const script = document.createElement("script"); script.src = "https://assets.calendly.com/assets/external/widget.js"; script.async = true;
  const timer = setTimeout(() => { if (!slot.querySelector("iframe")) fail(); }, 8000);
  script.onerror = () => { clearTimeout(timer); fail(); };
  script.onload = () => {
    try {
      const theme = document.documentElement.getAttribute("data-theme") === "dark";
      window.Calendly.initInlineWidget({ url: `${url}?background_color=${theme ? "17171a" : "ffffff"}&text_color=${theme ? "f5f5f7" : "1d1d1f"}&primary_color=${theme ? "d2b15f" : "1d1d1f"}`, parentElement: slot });
      const frame = slot.querySelector("iframe");
      if (frame) { frame.title = "Calendly booking calendar — 30-minute conversation with Jacopo"; frame.setAttribute("tabindex", "0"); frame.addEventListener("load", () => clearTimeout(timer)); frame.addEventListener("error", fail); } else fail();
    } catch { fail(); }
  };
  document.head.append(script);
  }
}

initUtility();
initReveal();
initCalendly();
