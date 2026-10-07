import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { readdir, rm } from 'node:fs/promises';
import { join } from 'node:path';

/** Emit 'hidden' sourcemaps then strip the `.map` files — zero sourcemaps ship
 *  (ARCHITECTURE §10.6). */
function stripSourcemaps(outDir = 'dist'): Plugin {
  return {
    name: 'ap-strip-sourcemaps',
    apply: 'build',
    async closeBundle() {
      const assets = join(outDir, 'assets');
      try {
        const files = await readdir(assets);
        await Promise.all(files.filter((f) => f.endsWith('.map')).map((f) => rm(join(assets, f))));
      } catch {
        // nothing to strip
      }
    },
  };
}

// Partner Landing is public-facing (partners self-issue validation QR checks).
export default defineConfig({
  plugins: [react(), stripSourcemaps()],
  build: {
    sourcemap: 'hidden',
    target: 'es2022',
    outDir: 'dist',
  },
  server: { port: 5175 },
});
