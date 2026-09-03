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
| `TopoFeaturePlugin` | `application/geo+json`, `application/json`, `application/ld+json` whose content is a topo-feature topology document (`points`/`edges`/`rings`/`faces`/`shells`/`solids`) **and** whose `points` carry a 3D coordinate | Three.js scene with orbit controls, grid/wireframe/edges/vertices toggles, a perspective ⇄ orthographic projection toggle, a fullscreen toggle, and a reset-camera button, rendered as plain DOM (no Vuetify/mdi — those are host-only). Solids, open shells (surfaces not already drawn as part of a solid) and Polygon-topology parcels render together whenever any is present, each its own color-grouped tier with its own inline toggle icon (shown only when that kind actually has content); falls back to the older single-tier chain — a standalone Face/Ring, bare edges, or bare points — only when none of the three is present. Fullscreen additionally swaps the compact icon toolbar for a collapsible panel grouped by kind, with a per-type select-all checkbox and per-instance checkboxes underneath it for overriding one object individually. A 2D-only topo-feature document is left to the default GeoJSON/map view. |

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

## Standalone test harness

`harness/` lets you exercise the actual `TopoFeaturePlugin` class — the real one from `src/`, not
a reimplementation — outside bblocks-viewer, either against a bundled fixture or an arbitrary
source document. Useful for visually checking geometry-engine behaviour (open shells, nested
shell traversal, Polygon parcels, the datum-grid fix, projection/fullscreen) without needing a
full register build.

It's a zero-build static page — no `npm install`/dev server required, since the plugin itself
never uses a bare `import 'three'` (it fetches `three`/`OrbitControls` from esm.sh via
already-resolved runtime `import()` calls; an import map can't and doesn't need to intercept
those). The only actual bare specifier in the dependency graph is `topo-geometry.js`'s
`import earcut from 'earcut'`, resolved via `harness/index.html`'s own import map.

```bash
npx serve .          # from the repo root
# then open http://localhost:<port>/harness/  (note the trailing slash — some static
# servers 30x-redirect a bare /harness to a path without one, which breaks the page's own
# relative ./main.js and ./fixtures/*.json requests)
```

Plain `file://` won't work — the fixture `fetch()` calls need `http(s)`.

The toolbar offers:
- A **Fixture** dropdown over `harness/fixtures/*.json` (copied from `3d-csdm-profile-wa`'s
  `assets/threeJS-viewer/data/`) — includes cases exercising solids, open shells (including
  nested/offset-derived shells), Polygon parcels, and a solid-with-void negative control (should
  render zero open shells, since both its shells are used by the solid).
- A **File** input to load a local JSON/GeoJSON document.
- A **URL** box to fetch and render an arbitrary remote document.

There's no automated test suite yet — `npm run typecheck` (tsc, types only) is the only
CI-checked verification; the harness is for manual/visual inspection.

## Declaring in a register

```yaml
# bblocks-config.yaml
viewer:
  view-plugins:
    - url: https://example.org/bblocks-viewer-topo-feature-plugin/index.js
      export: TopoFeaturePlugin
      weight: 100   # optional; higher sorts earlier among plugin tabs
```
