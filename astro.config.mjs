// astro.config.mjs
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  site: "https://playtested.net",
  output: "static", // Static build to /dist
  trailingSlash: "always", // or "never" - choose one and be consistent
  integrations: [sitemap()],
  vite: { plugins: [tailwindcss()] },
});
