# bblocks-viewer-topo-feature-plugin

A [bblocks-viewer](https://github.com/opengeospatial/bblocks-viewer) view plugin rendering
[topo-feature](https://github.com/ogcincubator/topo-feature) topology documents — a CityJSON-like
structure of `points`/`edges`/`rings`/`faces`/`shells`/`solids` feature collections
cross-referenced by id, rather than plain nested GeoJSON coordinates — as an interactive Three.js
scene.

This package implements the same plugin class contract external authors would use against
bblocks-viewer's view-plugin mechanism: `static supportedTypes`, optional `static viewName`/
`static icon`, `constructor(candidates, context)`, optional `matches()`, `render(el)`, optional
`destroy(el)`. It has no runtime dependency on bblocks-viewer itself, only on the candidate shape
(`{ type, content, url, label }`) the host defines.

It was split out of [bblocks-viewer-base-plugins](https://github.com/opengeospatial/bblocks-viewer-base-plugins)'
`ThreeDPlugin` (which still handles plain 3D GeoJSON) so this format — actively evolving and under
test in the topo-feature register — can iterate on its own release cycle, independent of both
bblocks-viewer's and bblocks-viewer-base-plugins' own schedules.

The build setup mirrors [`bblocks-view-plugin-starter`](https://github.com/ogcincubator/bblocks-view-plugin-starter),
the template new view plugins are meant to start from. The plugin-interface types themselves (for
editor autocomplete/checking via the `@implements` JSDoc comment on `TopoFeaturePlugin`, or
`npm run typecheck`) are **not** duplicated locally —
[`bblocks-viewer-plugin-types`](https://github.com/ogcincubator/bblocks-viewer-plugin-types) is the
canonical, dependency-free source, added here as a
`github:ogcincubator/bblocks-viewer-plugin-types` devDependency (types only, never a runtime
dependency) and imported as `import('@ogc/bblocks-viewer-plugin-types')` in JSDoc.

## Plugin

| Export | Matches | Notes |
|---|---|---|
| `TopoFeaturePlugin` | `application/geo+json`, `application/json`, `application/ld+json` whose content is a topo-feature topology document (`points`/`edges`/`rings`/`faces`/`shells`/`solids`) | Three.js scene with orbit controls, grid/wireframe/edges/vertices toggles and a reset-camera button, rendered as plain DOM (no Vuetify/mdi — those are host-only). |

## Build

```bash
npm install
npm run build
```

Produces `dist/index.js` (exports `TopoFeaturePlugin`) plus an on-demand chunk file for `earcut`
(bundled) and the mesh-building logic that needs it. The plugin only reaches for it lazily, inside
its own `import()` call at `render()` time. Deploy the whole `dist/` directory together (the chunk
files are fetched relative to `index.js`); don't move `index.js` alone.

`three`/`OrbitControls` are not bundled: they're fetched from `esm.sh` at a pinned version
(`THREE_VERSION` in `topo-feature-plugin.js`) at runtime instead, optionally sharing the loaded
module with bblocks-viewer-base-plugins' `ThreeDPlugin` via `context.depResolver` — see
bblocks-viewer's `.claude/shared-dependency-resolver-design.md` for the full rationale. `three` is
therefore a `devDependency` here (types/tooling only), not a `dependency`. `npm run build` fails if
that devDependency version and the pinned CDN version string drift apart
(`scripts/check-three-version.mjs`, run as `prebuild`) — keep this version synced with
bblocks-viewer-base-plugins' own `THREE_VERSION` too, so a shared `context.depResolver` call
actually hits the same cached instance for both plugins.

`src/utils/topo-geometry.js` takes `THREE` as a parameter to every function that needs it rather
than importing it itself, so its mesh-building runs against the exact CDN-resolved module instance
the scene uses — never reintroduce a top-level `import ... from 'three'` there, or Vite will bundle
a second, separate copy of three from the local devDependency.

## Declaring in a register

```yaml
# bblocks-config.yaml
viewer:
  view-plugins:
    - url: https://example.org/bblocks-viewer-topo-feature-plugin/index.js
      export: TopoFeaturePlugin
      weight: 100   # optional; higher sorts earlier among plugin tabs
```
