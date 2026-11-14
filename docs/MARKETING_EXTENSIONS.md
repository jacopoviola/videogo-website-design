# Marketing extensions to Design System v12

`src/styles/tokens.css` is unchanged v12 (byte-identical). Nothing here republishes or edits the Design System. The page needs things v12 does not define; they live in `marketing.css` / `preview.css` under `--mk-*`, `.mk-*`, `.pv-*` and are **local to this page**.

| Extension | Value | Basis |
|---|---|---|
| Hero display | `clamp(38px, 1.35rem + 4.4vw, 72px)`, line-height 1.04, 600, −0.03em | New, responsive, marketing only. The product page-title token stays 44/48 · 600 · −0.02em and is not reused for the hero |
| Section heading | 36/42 · 600 (28/34 mobile) | v12 onboarding-lead size |
| Lead paragraph | 19/30 | New |
| Section rhythm / container | 96px (64 mobile) / 1200px, 24px gutter (16 mobile) | New |
| Scroll entrances | opacity + 18px rise, 560ms, v12 enter easing, once per block; grouped cards stagger by 90ms; anchors and keyboard focus reveal instantly; hidden states only exist under `.js`, which js-flag.js removes if the main script never starts | New (v12 interface motion is 120–220ms; this is page-level motion) |
| Card hover | 3px lift via the `translate` property + border tone, 180ms; off for touch / reduced motion | New |
| Button hover | `scale(1.02)` over 180ms, transform only (no layout shift); off for touch and reduced motion | New |
| Product preview | HTML/CSS rebuild of the Studio screen, four steps ≈ 8.4 s, pause / replay, static Ready frame under reduced motion | Looks like v12; sizes are px so it behaves as an illustration |
| Illustrative cursors | a small one inside the product preview; one oversized (40×50) black cursor that clicks through the tools once in the manual-workflow panel. The visitor's cursor is never replaced | New |
| Hero dot field | canvas, charcoal dots on a 30px grid; dots within 130px of the pointer ease away and spring back when it stops; badge, headline, copy and CTA sit in a dot-free zone; static for touch and reduced motion; hidden below 768px. Demo section keeps static gutter dots | New |
| Self-learning diagram | HTML cards + SVG wires computed from their positions; one ~8s sequence on entry, then a complete still diagram; vertical flow below 1088px; static under reduced motion | New |
| Pointer particles | ≤26 dots, r 1.1–2.2px, 520ms life, thin light edge; fine pointers only; silent over the hero (dot field), videos, fields and the utility | New |
| Local dark theme | `theme.css` overrides v12 variables for this page only (v12 is light-only); product preview stays light; single-ink logos invert, photos and videos never do | New — needs design approval |
| Utility | bottom-right Theme (Light/Dark/System) + Read as (Human/Markdown); expanded ≥1720px, 44px launcher below; steps aside over the demo form | New |
| Dark panel | `#1D1D1F` (v12 primary action colour) for the Videogo comparison panel and video letterboxing only; the page stays light | v12 value, new use |
| Single-ink partner logos | supplied logos flattened to `#1D1D1F` at 72% opacity | New — see `ASSETS.md` |
| Mobile header | lockup + CTA, no menu | v12 leaves narrow navigation TBD |

Kept from v12 without change: light theme, Instrument Sans only, outlined lockup, near-black primary action, blue only for authorization (the preview's Publish button) and focus, radii 6/8/10/14/18, no gradients or glow, sentence case, NEED red only on the NEED marker, the fixed trust line.

## Fifth colour: brand red (2026-11-06)
- `--mk-red: #FF0048` (theme.css). Palette order for the marketing site: black, white, grey, gold, red. Red is the last colour and is used sparingly.
- Current use: the dotted backgrounds only. `--mk-dot-ink` is gold (`--mk-cta-bg`) on the light theme and `--mk-red` on the dark theme; it drives the hero dot field (canvas, read in `main.js`) and `.mk-dots` behind the closing form. `--mk-dot-alpha` sets their strength.
- Text in `#FF0048` on light surfaces is 3.6–3.9:1, below AA for small text; use it for non-text accents, or large text only. On dark surfaces it reaches 4.5–4.9:1.
- `tokens.css` (Design System v12) is untouched; this is a marketing-site extension until the owner adds it to the canonical system.
