// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from "@tailwindcss/vite";
import cloudflare from "@astrojs/cloudflare";

// https://astro.build/config
export default defineConfig({
  // Built-in Image settings (Astro 5+)
  image: {
    // Authorize any remote domains you want to optimize
    // e.g. RAWG cover art
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'media.rawg.io',
        port: '',
        pathname: '/**',
      },
    ],
    // Alternatively you can whitelist by domain:
    // domains: ['media.rawg.io'],
  },

  // Vite plugins
  vite: {
    plugins: [tailwindcss()],
  },

  // Adapter for deployment
  adapter: cloudflare(),
});
