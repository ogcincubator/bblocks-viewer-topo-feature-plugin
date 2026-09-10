# Changelog

## Unreleased — generic rule-based rendering

The plugin's rendering logic has been refactored from a hard-coded, WA-cadastral-shaped pipeline
into a generic, rule-based classification engine that any topo-feature register can configure —
without the plugin ever needing to understand domain vocabulary such as
`wa-parcel-state:former-tenure`. Landed in stages; see the git history (`Stage 0` through
`Stage 4` commits) for the individual, independently-verified steps.

### Added

- A rule-based feature classification engine (`src/utils/rules.js`) matching features from a named
  top-level document collection against literal, CURIE, or full-URI property values — CURIEs are
  expanded against a document's own inline `@context` (`src/utils/curie.js`), so the plugin never
  hard-codes a vocabulary's prefixes.
- A per-block configuration mechanism (`src/utils/resolve-config.js`, `src/utils/config.js`): a
  register can declare a `bblock.json` `resources` entry (role
  `https://github.com/ogcincubator/bblocks-viewer-topo-feature-plugin/role/viewer-config`); the
  plugin fetches and merges it over its own built-in defaults via `context.bblock`, with no change
  required to `bblocks-viewer` or `bblocks-postprocess`. Any failure (missing resource, failed
  fetch, invalid JSON) falls back to the built-in defaults — the plugin never throws over a
  missing or malformed per-block config.
- `elevation: "flatten"` (or `{ flattenTo: <n> }`) — flattens a feature's geometry to a fixed Z
  (`src/utils/topo-geometry.js`'s `flattenGeometryZ`), a capability that did not exist before this
  refactor.
- A non-cadastral proof fixture (`harness/fixtures/utility-network.json` +
  `utility-network-config.json`, underground utility pipes classified by `assetCondition`, no
  `parcels` array or cadastral vocabulary at all) and an acceptance test
  (`src/utils/domain-independence.test.js`) proving the renderer needs none of that vocabulary.
- A harness **Config file**/**Config URL** input pair, so the per-block config mechanism can be
  exercised visually, not just at the unit-test level.
- A unit test suite (`npm run test`, Node's built-in test runner) — 67 tests across
  `src/utils/*.test.js`. None existed before this refactor.
- `style.lineColor` and `style.lineStyle` (`"solid"`, the default, or `"dashed"`) — per-rule outline
  styling, via `src/utils/topo-geometry.js`'s `styleOutline`, applied after any elevation
  flattening so a dashed line's phase reflects the final vertex positions.
- `group` and `kindLabel` rule fields: several rules with different `kind`s can now share one
  panel heading and one inline toggle button by giving them the same `group` (e.g. "Created" and
  "Former Tenure" both grouped under one "Parcels" heading, each still independently toggleable
  underneath it via its own `kindLabel`). A rule that omits `group` behaves exactly as before —
  its `kind` is its own group of one.
- `harness/fixtures/parcel-config.json` — a worked example config against `parcel.json`: flattens
  all three parcels, shows only "Lot 800", shows its derived solid, and hides the ground-surface
  open shell — exercising literal property matching, `elevation: "flatten"`, and the `surfaces`
  source value (see below) together against real WA-shaped data.

### Fixed

- A rule's `style.color` (the filled mesh's color) was silently ignored — `createSolidMesh` always
  used its fixed color-cycling palette regardless of what a rule requested. Now honored, via an
  optional `color` parameter that falls back to the cycling palette when omitted, so every
  existing fixture's default (no rule sets `style.color`) is unaffected.

### Changed

- `_buildScene()` now classifies every feature via the rule engine, using a built-in default rule
  set (`src/utils/default-config.js`) that reproduces the plugin's original hard-coded tiering
  exactly — verified byte-identical against every existing fixture before this landed.
- The inline toggle icons and fullscreen panel's headings are now derived from whichever
  groups/kinds are actually present (`GROUP_PRESENTATION` in `topo-feature-plugin.js`), with a
  humanized fallback for any group or kind a per-block config introduces beyond the plugin's five
  built-in ones (solid/surface/parcel/face/ring).
- The synthetic source for open shells — previously the internal-looking `__openShells` — is now
  the documented, reserved `surfaces` source value (see the README's "Rendering rules" section for
  the shadowing caveat this reservation carries). **Any existing config using `__openShells` must
  be updated to `surfaces`** — it is not a backward-compatible alias, since the old name was never
  documented as stable API.
- README rewritten to document the rule model, the per-block configuration mechanism, the
  `group`/`kindLabel`/outline-styling fields, and the non-cadastral example, in place of the
  earlier WA-cadastral-only description.

### Compatibility

No existing register, fixture, or config needs to change, **except** a config that already used
the undocumented `__openShells` source name (see above) — everything else, including every
built-in default and every documented rule field from earlier in this refactor, renders exactly as
it did before.
