// astro.config.mjs
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import tailwindcss from '@tailwindcss/vite';
import sitemap from "@astrojs/sitemap";


export default defineConfig({
  site: 'https://playtested.net',
  integrations: [sitemap()],
  adapter: cloudflare(),     // ✅ Cloudflare Workers (not Pages)
  output: 'server',          // ✅ Needed for Workers support
  vite: {
    plugins: [tailwindcss()],
  },
    image: {
    service: { entrypoint: "astro/assets/services/squoosh" }
  },
});