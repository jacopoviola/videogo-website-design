/* Theme toggle (bottom right) and the Human / LLM reading control (header).
   Theme: a manual choice is saved and wins on later visits; without one, js-flag.js already chose by the visitor's local clock.
   If storage is unavailable the toggle still works for the current visit. The LLM view shows the public /videogo.md itself. */
export function initUtility() {
  const root = document.documentElement, toggle = document.querySelector("[data-theme-toggle]");
  const readButtons = [...document.querySelectorAll("[data-read-mode]")];
  const body = document.querySelector("[data-md-body]"), status = document.querySelector("[data-md-status]");

  /* ---- Theme ---- */
  const paintToggle = () => { const dark = root.getAttribute("data-theme") === "dark"; toggle.setAttribute("aria-label", dark ? "Switch to light mode" : "Switch to dark mode"); toggle.title = toggle.getAttribute("aria-label"); };
  const applyTheme = (value) => {
    root.setAttribute("data-theme", value);
    try { localStorage.setItem("vg-theme", value); } catch {} // storage may be blocked: the attribute alone keeps the choice for this visit
    paintToggle(); document.dispatchEvent(new CustomEvent("vg:theme"));
  };
  if (toggle) { toggle.hidden = false; paintToggle(); toggle.addEventListener("click", () => applyTheme(root.getAttribute("data-theme") === "dark" ? "light" : "dark")); }

  /* ---- Read as: Human / LLM ---- */
  let markdown = null;
  const load = async () => {
    if (markdown !== null) return markdown;
    try { const res = await fetch("/videogo.md", { headers: { accept: "text/markdown, text/plain" } }); if (!res.ok) throw new Error(String(res.status)); markdown = await res.text(); body.textContent = markdown; }
    catch { body.textContent = "The Markdown file could not be loaded. Open /videogo.md directly."; }
    return markdown;
  };
  const setRead = (mode, { focus = true } = {}) => {
    const md = mode === "markdown";
    if (md) root.setAttribute("data-read", "markdown"); else root.removeAttribute("data-read");
    readButtons.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.readMode === mode)));
    const url = new URL(location.href); if (md) url.searchParams.set("read", "markdown"); else url.searchParams.delete("read");
    history.replaceState(null, "", url);
    if (md) { load(); window.scrollTo(0, 0); if (focus) document.getElementById("md-title").focus({ preventScroll: true }); }
    else if (focus) document.getElementById("main").focus?.({ preventScroll: true });
  };
  readButtons.forEach((b) => b.addEventListener("click", () => setRead(b.dataset.readMode)));
  document.querySelector("[data-md-return]")?.addEventListener("click", () => setRead("human"));
  document.querySelector("[data-md-copy]")?.addEventListener("click", async () => {
    const text = await load();
    try { if (!text) throw new Error("empty"); await navigator.clipboard.writeText(text); status.textContent = "Copied."; } catch { status.textContent = "Copy didn’t work here — use Download, or select the text."; }
    setTimeout(() => { status.textContent = ""; }, 4000);
  });
  document.addEventListener("click", (e) => { const a = e.target.closest?.('a[href^="#"]'); if (a && root.getAttribute("data-read") === "markdown") setRead("human", { focus: false }); }, true);
  if (new URLSearchParams(location.search).get("read") === "markdown") setRead("markdown", { focus: false });

  /* ---- The toggle steps aside while the demo form occupies the corner on a narrow window ---- */
  // …and while the demo form or any CTA sits in the bottom strip of a narrow window (phones show CTAs full width).
  const watched = [document.getElementById("demo-form"), ...document.querySelectorAll(".vg-btn--cta:not(.mk-header .vg-btn--cta)")].filter(Boolean), near = new Set();
  if (toggle && watched.length && "IntersectionObserver" in window) {
    new IntersectionObserver((entries) => { for (const e of entries) e.isIntersecting ? near.add(e.target) : near.delete(e.target); toggle.toggleAttribute("data-away", near.size > 0 && window.innerWidth < 1400 && document.activeElement !== toggle); }, { rootMargin: "-80% 0px 0px 0px" }).observe(watched[0]);
    watched.slice(1).forEach((el) => new IntersectionObserver((entries) => { for (const e of entries) e.isIntersecting ? near.add(e.target) : near.delete(e.target); toggle.toggleAttribute("data-away", near.size > 0 && window.innerWidth < 1400 && document.activeElement !== toggle); }, { rootMargin: "-80% 0px 0px 0px" }).observe(el));
  }
}
