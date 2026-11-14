# Videogo landing — design copy

Front-end-only copy of the videogo.ai marketing site, for design work.

## Run
```bash
npm install
npm run dev        # http://localhost:5173
```

## Where things are
| Path | What |
|---|---|
| `index.html`, `pricing.html`, `onboarding.html`, `culture.html`, `privacy.html`, `terms.html` | Pages (copy lives in the HTML) |
| `src/styles/tokens.css` | Design System tokens. Please don't edit; propose changes instead |
| `src/styles/marketing.css`, `preview.css`, `learn.css`, `pricing.css`, `culture.css`, `theme.css`, `utility.css` | Page styles |
| `src/js/` | Animations, preview player, theme toggle, form validation |
| `public/` | Images, videos, logos, fonts are in `src/assets/fonts` |
| `docs/MARKETING_EXTENSIONS.md` | Notes on the marketing-only tokens and classes |

## Notes
- The demo-request form has no backend here. Submitting it in `npm run dev` will show an error. That's expected.
- The bot check (Turnstile) doesn't load locally.
- Customer logos, videos and photos are for this design work only. Don't reuse or publish them.

## Sending changes
Work on a branch and open a pull request. Keep changes to HTML, CSS, JS and assets.
