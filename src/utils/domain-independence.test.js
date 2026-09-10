// Stage 4 acceptance test: proves the viewer is genuinely domain-independent, not just
// WA-cadastral-with-the-serial-numbers-filed-off. harness/fixtures/utility-network.json is an
// underground-utility-pipe document — Solids classified by `assetCondition`, no `parcels` array at
// all, no cadastral vocabulary anywhere — paired with
// harness/fixtures/utility-network-config.json, a rule config in exactly the shape a bblock.json
// `resources` entry would deliver via resolve-config.js. Every module this test exercises
// (rules.js, default-config.js, resolve-config.js, topo-geometry.js) is the same code the WA
// examples render through; nothing here is a stand-in or simplified path.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as THREE from 'three'; // local devDependency; see topo-geometry.test.js's comment on this
import { isTopoFeature3D } from './detect-topo.js';
import {
  buildMaps, getFeatures, getOpenShells, needsTransparency,
  buildSolidGeometry, buildSolidEdgeLines, flattenGeometryZ,
} from './topo-geometry.js';
import { classifyFeatures, resolveFlattenZ } from './rules.js';
import { buildDefaultConfig } from './default-config.js';
import { loadViewerConfig, VIEWER_CONFIG_RESOURCE_ROLE } from './resolve-config.js';

const FIXTURE_PATH = new URL('../../harness/fixtures/utility-network.json', import.meta.url);
const CONFIG_PATH = new URL('../../harness/fixtures/utility-network-config.json', import.meta.url);
const data = JSON.parse(readFileSync(FIXTURE_PATH, 'utf8'));
const configText = readFileSync(CONFIG_PATH, 'utf8');

test('the fixture is detected as a 3D topo-feature document, with no parcels array at all', () => {
  assert.equal(isTopoFeature3D(data), true);
  assert.equal('parcels' in data, false);
});

// Resolves the effective config exactly as _buildScene does: the plugin's own built-in defaults,
// with the fixture's own config merged over them via the real Stage 2 delivery path (a
// context.bblock resource + fetch — faked here only at the network boundary, not the logic).
async function resolveEffectiveConfig() {
  const maps = buildMaps(data);
  const openShells = getOpenShells(data, maps);
  const defaultConfig = buildDefaultConfig(
    {
      solidCount: getFeatures(data.solids || []).length, openShellCount: openShells.length,
      parcelCount: 0, faceCount: 0, ringCount: 0,
    },
    { solid: needsTransparency(data) ? 0.85 : 1, surface: 0.55, parcel: 0.35, face: 1, ring: 1 }
  );
  const context = {
    bblock: { resources: [{ role: VIEWER_CONFIG_RESOURCE_ROLE, ref: 'https://example.org/utility-network-config.json' }] },
  };
  const fetchImpl = async () => ({ ok: true, text: async () => configText });
  const config = await loadViewerConfig(context, defaultConfig, fetchImpl);
  return { maps, openShells, config };
}

test('classifyFeatures distinguishes all four pipes by literal, CURIE, and full-URI values', async () => {
  const { maps, openShells, config } = await resolveEffectiveConfig();
  const descriptors = classifyFeatures({ ...data, __openShells: openShells }, config);
  const byId = Object.fromEntries(descriptors.map(d => [d.feature.id, d]));

  assert.equal(descriptors.length, 4, 'every pipe should be classified — none left unmatched');

  // Literal match: "decommissioned"
  assert.equal(byId['pipe-a:solid'].initiallyVisible, false);
  assert.equal(byId['pipe-a:solid'].style.color, '#8a8f89');
  assert.equal(byId['pipe-a:solid'].label, 'Pipe A');

  // CURIE match: "util:hazardous", expanded against the fixture's own @context
  assert.equal(byId['pipe-b:solid'].initiallyVisible, true);
  assert.equal(byId['pipe-b:solid'].style.color, '#c23b22');

  // Full-URI match: "http://example.org/utility-status#planned" — also requests flattening
  assert.equal(byId['pipe-c:solid'].style.color, '#3b5bab');
  assert.equal(resolveFlattenZ(byId['pipe-c:solid'].elevation), 0);

  // No condition matches any specific rule -> falls through to the config's own catch-all
  assert.equal(byId['pipe-d:solid'].style.color, '#3388ff');

  void maps; // built for the geometry test below; unused directly in this classification-only check
});

test('real geometry builds correctly for every pipe, and the flatten rule actually flattens it', async () => {
  const { maps, openShells, config } = await resolveEffectiveConfig();
  const descriptors = classifyFeatures({ ...data, __openShells: openShells }, config);
  const byId = Object.fromEntries(descriptors.map(d => [d.feature.id, d]));

  for (const descriptor of descriptors) {
    const { geometry, faceCount } = buildSolidGeometry(
      descriptor.feature, maps.shellMap, maps.faceMap, maps.ringMap, maps.edgeMap, maps.pointMap, THREE
    );
    assert.equal(faceCount, 6, `${descriptor.feature.id} is a 6-faced box`);
    const position = geometry.getAttribute('position');
    assert.equal(position.count, 36, '6 faces x 2 triangles x 3 vertices, non-indexed');

    const flattenZ = resolveFlattenZ(descriptor.elevation);
    if (flattenZ !== null) {
      const outline = buildSolidEdgeLines(descriptor.feature, maps.shellMap, maps.faceMap, maps.ringMap, maps.edgeMap, maps.pointMap, THREE);
      flattenGeometryZ(geometry, flattenZ);
      flattenGeometryZ(outline.geometry, flattenZ);
      for (let i = 0; i < position.count; i++) assert.equal(position.getZ(i), flattenZ);
    }
  }

  // Confirm pipe-c genuinely had non-zero Z before flattening — otherwise the assertion above
  // would trivially pass without the flatten logic having done anything.
  const { geometry: pipeCGeometry } = buildSolidGeometry(
    byId['pipe-c:solid'].feature, maps.shellMap, maps.faceMap, maps.ringMap, maps.edgeMap, maps.pointMap, THREE
  );
  const zValues = [];
  const pos = pipeCGeometry.getAttribute('position');
  for (let i = 0; i < pos.count; i++) zValues.push(pos.getZ(i));
  assert.ok(zValues.some(z => z !== 0), 'pipe-c must have real, non-zero elevation before flattening for this test to mean anything');
});
