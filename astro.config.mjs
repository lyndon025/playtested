// astro.config.mjs
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  adapter: cloudflare(),     // ✅ Cloudflare Workers (not Pages)
  output: 'server',          // ✅ Needed for Workers support
  vite: {
    plugins: [tailwindcss()],
  },
});