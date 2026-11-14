/* Runs before first paint (blocking, tiny).
   1. Theme: a saved manual choice wins; otherwise the visitor's local clock decides once, at load —
      18:00–23:59 dark, 00:00–17:59 light. Never the operating-system appearance, never the server's time.
   2. Marks JS as available so entrance states never flash, and removes the mark again if the main script
      has not started within 3 s, so content can never stay hidden because a script failed. */
(function () {
  var root = document.documentElement, theme = null;
  try { var t = localStorage.getItem("vg-theme"); if (t === "light" || t === "dark") theme = t; } catch (e) {}
  if (!theme) theme = new Date().getHours() >= 18 ? "dark" : "light";
  root.setAttribute("data-theme", theme);
  try { if (/[?&]read=markdown(&|$)/.test(location.search)) root.setAttribute("data-read", "markdown"); } catch (e) {}
  root.classList.add("js");
  setTimeout(function () { if (!window.__vgMain) { root.classList.remove("js"); root.removeAttribute("data-read"); } }, 3000);
})();
