import { test } from 'node:test';
import assert from 'node:assert/strict';
// The local `three` devDependency (never a runtime dependency of shipped code — see README/
// package.json) is fine to use here: this test runs under Node, not the browser, and is never
// bundled into dist/. topo-geometry.js's own functions take THREE as a parameter rather than
// importing it, precisely so they work against whichever THREE instance a caller resolved —
// including, here, this test's own plain Node-side import.
import * as THREE from 'three';
import { flattenGeometryZ } from './topo-geometry.js';

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
