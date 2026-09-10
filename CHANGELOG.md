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
- A unit test suite (`npm run test`, Node's built-in test runner) — 58 tests across
  `src/utils/*.test.js`. None existed before this refactor.

### Changed

- `_buildScene()` now classifies every feature via the rule engine, using a built-in default rule
  set (`src/utils/default-config.js`) that reproduces the plugin's original hard-coded tiering
  exactly — verified byte-identical against every existing fixture before this landed.
- The inline toggle icons and fullscreen panel's kind labels are now derived from whichever kinds
  are actually present (`KIND_PRESENTATION` in `topo-feature-plugin.js`), with a humanized
  fallback for any kind a per-block config introduces beyond the plugin's five built-in ones
  (solid/surface/parcel/face/ring).
- README rewritten to document the rule model, the per-block configuration mechanism, and the
  non-cadastral example, in place of the earlier WA-cadastral-only description.

### Compatibility

No existing register, fixture, or config needs to change. A `bblock.json` with no matching
`resources` entry renders exactly as it did before this refactor.
