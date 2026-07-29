import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

// Library build producing dist/index.js (named export: TopoFeaturePlugin) plus on-demand chunk
// files for its heavy dependencies (three, earcut). Deliberately leaves Rollup's default
// code-splitting in place — three/earcut are only reached from inside the plugin's own lazy
// `import()` calls at render() time, mirroring bblocks-viewer-base-plugins' setup. The host only
// ever needs one entry url (dist/index.js); the browser resolves chunk `import()`s relative to
// it, so the whole dist/ directory just needs to be deployed together.
export default defineConfig({
  build: {
    minify: 'esbuild',
    assetsInlineLimit: Infinity,
    lib: {
      entry: fileURLToPath(new URL('src/index.js', import.meta.url)),
      formats: ['es'],
      fileName: () => 'index.js',
    },
  },
});
