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

// Business Panel is CLOUD-served (each operator manages their own branches).
export default defineConfig({
  plugins: [react(), stripSourcemaps()],
  build: {
    sourcemap: 'hidden',
    target: 'es2022',
    outDir: 'dist',
  },
  // Dev port kept within the Keycloak client's allowed redirect range
  // (http://localhost:5173/* and :5174) so the OIDC login round-trip works.
  server: { port: 5173 },
});
