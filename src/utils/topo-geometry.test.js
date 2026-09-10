import { test } from 'node:test';
import assert from 'node:assert/strict';
// The local `three` devDependency (never a runtime dependency of shipped code — see README/
// package.json) is fine to use here: this test runs under Node, not the browser, and is never
// bundled into dist/. topo-geometry.js's own functions take THREE as a parameter rather than
// importing it, precisely so they work against whichever THREE instance a caller resolved —
// including, here, this test's own plain Node-side import.
import * as THREE from 'three';
import { flattenGeometryZ, createSolidMesh, SOLID_COLORS, styleOutline } from './topo-geometry.js';

function triangleGeometry() {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(
    new Float32Array([0, 0, 5, 1, 0, 7, 0, 1, 9]), 3
  ));
  // Deliberately wrong/unrelated to the triangle's real geometry (a Z-aligned normal is what a
  // flattened-onto-XY triangle's *correct* recomputed normal would be) — the "recomputes normals"
  // test below needs a starting value recomputation is guaranteed to actually change.
  geometry.setAttribute('normal', new THREE.BufferAttribute(
    new Float32Array([1, 0, 0, 1, 0, 0, 1, 0, 0]), 3
  ));
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  return geometry;
}

function lineGeometry() {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(
    new Float32Array([0, 0, 5, 1, 0, 7]), 3
  ));
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  return geometry;
}

test('flattenGeometryZ sets every vertex Z to the given value, leaving X/Y untouched', () => {
  const geometry = triangleGeometry();
  flattenGeometryZ(geometry, 0);
  const position = geometry.getAttribute('position');
  for (let i = 0; i < position.count; i++) assert.equal(position.getZ(i), 0);
  assert.equal(position.getX(1), 1);
  assert.equal(position.getY(2), 1);
});

test('flattenGeometryZ flattens to an arbitrary datum, not just zero', () => {
  const geometry = triangleGeometry();
  flattenGeometryZ(geometry, 12.5);
  const position = geometry.getAttribute('position');
  for (let i = 0; i < position.count; i++) assert.equal(position.getZ(i), 12.5);
});

test('flattenGeometryZ recomputes the bounding box/sphere to reflect the flattened extent', () => {
  const geometry = triangleGeometry();
  flattenGeometryZ(geometry, 0);
  assert.equal(geometry.boundingBox.min.z, 0);
  assert.equal(geometry.boundingBox.max.z, 0);
});

test('flattenGeometryZ recomputes normals when the geometry has them (a mesh)', () => {
  const geometry = triangleGeometry();
  const before = geometry.getAttribute('normal').array.slice();
  flattenGeometryZ(geometry, 0);
  const after = geometry.getAttribute('normal').array;
  // A triangle flattened onto the XY plane has a normal straight along Z, unlike the original
  // upward-tilted one baked into triangleGeometry() above — recomputation must actually run, not
  // silently leave the stale normal in place.
  assert.notDeepEqual(Array.from(after), Array.from(before));
});

test('flattenGeometryZ does not add a normal attribute to a geometry that never had one (an outline)', () => {
  const geometry = lineGeometry();
  flattenGeometryZ(geometry, 0);
  assert.equal(geometry.getAttribute('normal'), undefined);
});

test('createSolidMesh cycles through SOLID_COLORS when no color override is given', () => {
  const feature = { id: 'f1', properties: {} };
  const mesh = createSolidMesh(feature, 0, triangleGeometry(), 1, null, THREE);
  assert.equal(mesh.material.color.getHex(), SOLID_COLORS[0]);
  const mesh2 = createSolidMesh(feature, 1, triangleGeometry(), 1, null, THREE);
  assert.equal(mesh2.material.color.getHex(), SOLID_COLORS[1]);
});

test('createSolidMesh uses a rule-supplied color over the cycling palette when given', () => {
  const feature = { id: 'f1', properties: {} };
  const mesh = createSolidMesh(feature, 0, triangleGeometry(), 1, '#a1531a', THREE);
  assert.equal(mesh.material.color.getHexString(), 'a1531a');
});

function outlineFixture() {
  return new THREE.LineSegments(lineGeometry(), new THREE.LineBasicMaterial({ color: 0xffffff }));
}

test('styleOutline leaves a plain outline untouched when given no options', () => {
  const outline = outlineFixture();
  styleOutline(outline, {}, THREE);
  assert.equal(outline.material.type, 'LineBasicMaterial');
  assert.equal(outline.material.color.getHexString(), 'ffffff');
});

test('styleOutline overrides just the color for a solid line', () => {
  const outline = outlineFixture();
  styleOutline(outline, { color: '#a1531a' }, THREE);
  assert.equal(outline.material.type, 'LineBasicMaterial');
  assert.equal(outline.material.color.getHexString(), 'a1531a');
});

test('styleOutline switches to a dashed material and computes line distances', () => {
  const outline = outlineFixture();
  styleOutline(outline, { dashed: true }, THREE);
  assert.equal(outline.material.type, 'LineDashedMaterial');
  // computeLineDistances() populates a 'lineDistance' attribute LineDashedMaterial's shader reads.
  assert.notEqual(outline.geometry.getAttribute('lineDistance'), undefined);
});

test('styleOutline dashed keeps the original color when no override is given', () => {
  const outline = outlineFixture();
  styleOutline(outline, { dashed: true }, THREE);
  assert.equal(outline.material.color.getHexString(), 'ffffff');
});

test('styleOutline dashed applies a color override too', () => {
  const outline = outlineFixture();
  styleOutline(outline, { color: '#3b5bab', dashed: true }, THREE);
  assert.equal(outline.material.color.getHexString(), '3b5bab');
});
