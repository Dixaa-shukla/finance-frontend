import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
  /*
   * ⚠️ DO NOT ADD @tailwindcss/vite HERE. Tailwind is compiled by the v3
   * PostCSS chain declared in postcss.config.js (tailwindcss + autoprefixer),
   * which is the only setup that reads tailwind.config.js -- where every NOVA
   * design token lives (navy/sky/lavender/brand colours, app-gradient,
   * card-sheen, shadow-glass, rounded-card, rounded-pill).
   *
   * @tailwindcss/vite is the Tailwind 4 plugin and it bundles its own nested
   * tailwindcss 4. The v4 engine IGNORES tailwind.config.js unless the CSS
   * carries an @config directive, so with it enabled every token above silently
   * stopped existing and the build died on the first one:
   *   "Cannot apply unknown utility class `bg-app-gradient`"
   * (raised from src/styles/globals.css, which uses @apply bg-app-gradient).
   */
  plugins: [react()],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  server: {
    port: 5173,
  },
});