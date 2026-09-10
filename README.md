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

| Export              | Matches                                                                                                                                                                                                               | Notes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
|---------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `TopoFeaturePlugin` | `application/geo+json`, `application/json`, `application/ld+json` whose content is a topo-feature topology document (`points`/`edges`/`rings`/`faces`/`shells`/`solids`) **and** whose `points` carry a 3D coordinate | Three.js scene with orbit controls, grid/wireframe/edges/vertices toggles, a perspective ⇄ orthographic projection toggle, a fullscreen toggle, and a reset-camera button, rendered as plain DOM (no Vuetify/mdi — those are host-only). Which features render as which kind, at what opacity/color/initial visibility, and whether their geometry is flattened to a fixed elevation, is decided by a **rule engine** (see below) — by default the plugin's own built-in rules, optionally overridden per Building Block. Whenever the host gives this plugin a large-enough container — its own "expand" dialog, or this plugin's own fullscreen button — the compact icon toolbar is swapped for a collapsible panel grouped by kind instead, with a per-type select-all checkbox and per-instance checkboxes underneath it for overriding one object individually; this is driven by the container's actual size, not by which control was clicked. A 2D-only topo-feature document is left to the default GeoJSON/map view. |

## Rendering rules

The plugin has no built-in knowledge of any particular topo-feature *profile* — it doesn't know
what a "parcel" is, or what `wa-parcel-state:former-tenure` means. Instead, every feature is run
through an ordered list of **rules**, each naming:

- `source` — a top-level document key to classify features from (`solids`, `parcels`, or anything
  else a profile's schema defines — the plugin never hard-codes which keys exist), with one
  reserved exception: **`surfaces`** always refers to open shells — surfaces not already drawn as
  part of a solid (see `getOpenShells`). These aren't a plain top-level document array like
  `solids`/`parcels`; they're derived from the solid/shell reference graph, so the plugin computes
  them itself and makes them available under this name for any rule to target. A document that
  happens to define its own top-level `surfaces` array (not part of the base topo-feature spec, but
  not reserved by it either) would have that array shadowed by this derived list — avoid the name
  for anything else in a profile's schema.
- `geometry` — which geometry-building strategy to use (`solid`, `open-shell`, `polygon`, `face`,
  `ring`)
- `match` *(optional)* — a `property` (dot-path from the feature root, e.g.
  `"properties.parcelState"`) and one or more `values` to match against it. A value may be a
  **literal**, a **CURIE** (expanded against the document's own inline `@context` — the plugin
  never hard-codes a vocabulary's prefixes), or a **full URI**; all three forms are compared
  after expansion, so a rule written as a CURIE matches a document using the expanded URI and
  vice versa. A rule with no `match` is a catch-all for its `source`.
- `kind` — the id used to group this rule's matches for the toggle UI
- `group` *(optional)* — lets several rules with different `kind`s share one panel heading and one
  inline toggle button (e.g. "Created" and "Former Tenure" both under one "Parcels" heading, each
  still independently toggleable underneath it). Defaults to the rule's own `kind` — a rule that
  omits `group` behaves exactly as if grouping didn't exist.
- `kindLabel` *(optional)* — a human-friendly label for this rule's specific `kind`, shown as its
  sub-heading when its `group` contains more than one `kind`. Falls back to a humanized version of
  the `kind` slug when omitted.
- `style` — `{ opacity, color, lineColor, lineStyle }` — `color`/`opacity` style the filled mesh;
  `lineColor` and `lineStyle` (`"solid"`, the default, or `"dashed"`) style its outline
- `initiallyVisible` — boolean, default `true`
- `label` — `{ properties: [...dot-paths], fallback }`, tried in order; the first property that
  resolves to a usable value wins
- `elevation` — `"preserve"` (default) or `"flatten"` (flattens to Z=0), or `{ flattenTo: <n> }`
  for a specific datum

```json
{
  "rules": [
    {
      "source": "parcels",
      "kind": "former-tenure-parcel",
      "geometry": "polygon",
      "match": { "property": "properties.parcelState", "values": ["wa-parcel-state:former-tenure"] },
      "initiallyVisible": false,
      "style": { "opacity": 0.35, "color": "#a1531a" }
    }
  ]
}
```

With **no configuration at all**, the plugin falls back to its own built-in rule set
(`src/utils/default-config.js`), which reproduces this plugin's original hard-coded behaviour
exactly: solids, open shells (surfaces not already drawn as part of a solid) and Polygon-topology
parcels render together whenever any is present, each its own color-grouped tier; only when none
of the three is present does rendering fall back to the older single-tier chain — a standalone
Face/Ring, bare edges, or bare points. This is verified byte-identical against every fixture in
`harness/fixtures/` (see `domain-independence.test.js` and the classification logic in
`rules.test.js`/`default-config.test.js`).

The rule-matching machinery lives in `src/utils/rules.js` (feature classification) and
`src/utils/curie.js` (CURIE/URI/literal value expansion) — both dependency-free, unit-tested
modules with no knowledge of Three.js or any particular vocabulary.

## Per-block configuration

A Building Block can override or extend the built-in rules by declaring a `resources` entry in its
`bblock.json`:

```json
{
  "resources": [
    {
      "role": "https://github.com/ogcincubator/bblocks-viewer-topo-feature-plugin/role/viewer-config",
      "ref": "viewer-config.json",
      "format": "application/json",
      "title": "Topo viewer rendering rules for this block"
    }
  ]
}
```

No change to `bblocks-viewer` or `bblocks-postprocess` is required for this: `resources[].role`
already accepts any URI (see the
[bblocks-authoring skill](https://github.com/ogcincubator/ogc-llm-skills)'s "well-known resource
roles" — PROF explicitly allows applications to add roles beyond its own set). The plugin reads
this via `context.bblock.resources` — the full per-block metadata every view plugin already
receives — fetches the referenced JSON, and merges it over its own defaults
(`src/utils/resolve-config.js`, `src/utils/config.js`). A block's own rules replace the built-in
`rules`/`kindOrder` entirely rather than appending to them; `defaults` (and `defaults.style` within
it) shallow-merge instead. Any failure along this path — no `context.bblock`, no matching resource,
a failed fetch, invalid JSON — falls back to the built-in defaults alone; the plugin never throws
because a per-block config is missing or malformed.

One assumption this relies on, not yet verified against a real published register: that a
`resources[].ref` written as a relative path in `bblock.json` resolves to a fetchable absolute URL
by the time it reaches `context.bblock`. If a register's own config isn't taking effect, check this
first.

## Non-cadastral example

`harness/fixtures/utility-network.json` (paired with `utility-network-config.json`) is a
deliberately non-cadastral document — underground utility pipe segments as `solids`, classified by
an `assetCondition` property, with no `parcels` array and no cadastral vocabulary anywhere. Its
config exercises literal (`"decommissioned"`), CURIE (`"util:hazardous"`), and full-URI
(`"http://example.org/utility-status#planned"`, also flattened to Z=0) value matching in one
example. `src/utils/domain-independence.test.js` runs both through the real pipeline — the same
`rules.js`/`resolve-config.js`/`topo-geometry.js` code the WA examples render through, nothing
mocked but the network fetch — as the acceptance test that the renderer needs no cadastral/WA
vocabulary at all.

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

`harness/index.html` lets you exercise the actual `TopoFeaturePlugin` class — outside bblocks-viewer, either against a bundled fixture or an arbitrary
source document. Useful for visually checking geometry-engine behaviour (open shells, nested
shell traversal, Polygon parcels, the datum-grid fix, projection/fullscreen) without needing a
full register build.


_Plain `file://` won't work — the fixture `fetch()` calls need `http(s)`._

The toolbar offers:
- A **Fixture** dropdown over `harness/fixtures/*.json`  — includes cases exercising solids, open shells (including
  nested/offset-derived shells), Polygon parcels, a solid-with-void negative control (should
  render zero open shells, since both its shells are used by the solid), and the non-cadastral
  utility-network example (see above), which auto-applies its own bundled config on selection.
- A **File** input to load a local JSON/GeoJSON document.
- A **URL** box to fetch and render an arbitrary remote document.
- A **Config file** / **Config URL** pair to attach a rule config (see "Per-block configuration"
  above) to whatever document is currently loaded — this exercises the exact
  `context.bblock.resources` delivery mechanism a real register would use (a locally-picked config
  file is handed to the plugin as a `blob:` URL, which `fetch()`es identically to a real absolute
  URL); **Clear config** drops back to the plugin's built-in defaults. Switching fixtures resets
  any manually-loaded config first.

## Testing

```bash
npm run test
```

Runs the unit test suite (`src/utils/*.test.js`, via Node's built-in test runner — no extra
dependency) covering CURIE/URI/literal value matching, feature classification, config
parsing/merging, elevation flattening, and the non-cadastral acceptance test described above. This
covers the rendering-rule logic in isolation; the harness above remains the way to check actual
Three.js output, which the unit tests deliberately don't touch.

## Declaring as a viewer in a Building Blocks repository

```yaml
# bblocks-config.yaml
viewer:
  view-plugins:
    - url: https://cdn.jsdelivr.net/gh/ogcincubator/bblocks-viewer-topo-feature-plugin@dist/index.js
      export: TopoFeaturePlugin
      weight: 100   # optional; higher sorts earlier among plugin tabs
```
