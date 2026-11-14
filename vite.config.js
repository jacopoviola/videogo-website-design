import { defineConfig } from "vite";
export default defineConfig({ build: { outDir: "dist", assetsInlineLimit: 0, rollupOptions: { input: { main: "index.html", pricing: "pricing.html", onboarding: "onboarding.html", culture: "culture.html", privacy: "privacy.html", terms: "terms.html" } } } });
