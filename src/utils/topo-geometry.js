import earcut from 'earcut';

// No top-level `import ... from 'three'` here: `three` is loaded from a CDN at runtime (see
// topo-feature-plugin.js's resolveThree()), possibly as a shared instance via
// context.depResolver, so this module must build its meshes against the exact THREE module
// instance the caller already resolved rather than importing (and thus bundling) its own copy.

const COORDINATE_DIMENSIONS = 3;
const NORMAL_X_AXIS_THRESHOLD = 0.9;
const POSITION_ATTRIBUTE = 'position';
const NORMAL_ATTRIBUTE = 'normal';
const REVERSED_ORIENTATION = '-';
const FACE_TOPOLOGY_TYPE = 'Face';
const SHELL_TOPOLOGY_TYPE = 'Shell';
const SUBTENDED_ANGLE_FEATURE_TYPE = 'SubtendedAngle';
const MAX_SHELL_NESTING_DEPTH = 16;

const EDGE_LINE_COLOR = 0xffffff;
const VERTEX_MARKER_SEGMENTS = 12;
const VERTEX_MARKER_COLOR = 0xffff00;
const VERTEX_KEY_PRECISION = 6;
const VERTEX_RADIUS_SCALE = 0.05;
const MESH_SHININESS = 30;
const POLYGON_OFFSET_FACTOR = 1;
const POLYGON_OFFSET_UNITS = 1;

export const SOLID_COLORS = [
  0x3388ff, 0xff8833, 0x33ff88, 0xff3388, 0x8833ff,
  0x33ffff, 0xffff33, 0xff33ff, 0x88ff33, 0x3388aa,
];

// A points/edges/rings/faces/shells/solids/parcels array entry is either a nested
// FeatureCollection wrapper (`{ features: [...] }`, e.g. topo-feature-multi-collection's
// examples) or a bare Feature itself (e.g. topo-solid's self-contained examples). Kept in sync
// with the identical helper in detect-topo.js (duplicated rather than shared — see that file's
// comment).
function collectionFeatures(item) {
  return Array.isArray(item?.features) ? item.features : [item];
}

// Vector observation / subtended-angle edge collections describe survey angles, not topology —
// they share the edges array but aren't real segments between two resolvable points, so they're
// excluded from the edge map and from edge counts.
function edgeFeatureCollections(edgeCollections = []) {
  return edgeCollections.filter(fc => fc?.featureType !== SUBTENDED_ANGLE_FEATURE_TYPE);
}

export function buildMaps(data) {
  const pointMap = mapFeaturesById(data.points, pf =>
    (pf.place || pf.geometry).coordinates.slice()
  );
  centerCoordinatesAroundOrigin(Object.values(pointMap));
  return {
    pointMap,
    edgeMap: mapFeaturesById(edgeFeatureCollections(data.edges), ef => ef.topology.references),
    ringMap:  mapFeaturesById(data.rings),
    faceMap:  mapFeaturesById(data.faces),
    shellMap: mapFeaturesById(data.shells),
  };
}

function mapFeaturesById(featureCollections = [], getValue = f => f) {
  const map = {};
  featureCollections.forEach(fc => collectionFeatures(fc).forEach(f => { map[f.id] = getValue(f); }));
  return map;
}

// Moves the X/Y centroid of the model to the origin. Z is left untouched so absolute heights stay
// aligned to datum — the world-origin grid (drawn once, at z=0, independent of any model) would
// otherwise appear to float at the wrong elevation relative to a model whose mean height isn't 0.
function centerCoordinatesAroundOrigin(coords) {
  if (!coords.length) return;
  const centroid = calculateCentroid(coords);
  coords.forEach(c => { c[0] -= centroid[0]; c[1] -= centroid[1]; });
}

function calculateCentroid(coords) {
  const totals = coords.reduce(
    (sums, c) => { c.forEach((v, i) => { sums[i] += v; }); return sums; },
    Array(COORDINATE_DIMENSIONS).fill(0)
  );
  return totals.map(t => t / coords.length);
}

export function getFeatures(featureCollections = []) {
  return featureCollections.flatMap(collectionFeatures);
}

export function getTopologyFeatureCounts(data) {
  const countFeatures = (fcs = []) => fcs.reduce((n, fc) => n + collectionFeatures(fc).length, 0);
  return {
    points: countFeatures(data.points),
    edges:  countFeatures(edgeFeatureCollections(data.edges)),
    faces:  countFeatures(data.faces),
    shells: countFeatures(data.shells),
  };
}

export function needsTransparency(data) {
  const faceHasHole = getFeatures(data.faces || [])
    .some(face => face.topology.directed_references.length > 1);
  const solidHasVoid = getFeatures(data.solids || [])
    .some(solid => solid.topology.directed_references.length > 1);
  return faceHasHole || solidHasVoid;
}

function ringToCoords(ringFeature, edgeMap, pointMap) {
  return ringFeature.topology.directed_references.map(member => {
    const [startId, endId] = edgeMap[member.ref];
    return pointMap[member.orientation === '+' ? startId : endId];
  });
}

// Newell's method: a robust normal for a (possibly non-convex, near-planar) polygon, used when a
// ring/polygon has no owning Face to supply an authoritative `properties.normal` — i.e. a
// bare/standalone ring or a Polygon-topology parcel rendered on its own.
function newellNormal(coords) {
  const n = [0, 0, 0];
  for (let i = 0; i < coords.length; i++) {
    const [x1, y1, z1] = coords[i];
    const [x2, y2, z2] = coords[(i + 1) % coords.length];
    n[0] += (y1 - y2) * (z1 + z2);
    n[1] += (z1 - z2) * (x1 + x2);
    n[2] += (x1 - x2) * (y1 + y2);
  }
  const len = Math.hypot(...n) || 1;
  return [n[0] / len, n[1] / len, n[2] / len];
}

function createPlaneBasis(normal, THREE) {
  const n = new THREE.Vector3(...normal).normalize();
  const ref = Math.abs(n.x) < NORMAL_X_AXIS_THRESHOLD
    ? new THREE.Vector3(1, 0, 0)
    : new THREE.Vector3(0, 1, 0);
  const u = new THREE.Vector3().crossVectors(ref, n).normalize();
  return { axisU: u, axisV: new THREE.Vector3().crossVectors(n, u) };
}

function triangulatePolygon(outerCoords, holeCoordsList, normal, THREE) {
  const positions = [];
  const normals = [];
  if (outerCoords.length < 3) return { positions, normals };

  const { axisU, axisV } = createPlaneBasis(normal, THREE);
  const origin = new THREE.Vector3(...outerCoords[0]);
  const projectPoint = coord => {
    const rel = new THREE.Vector3(...coord).sub(origin);
    return [rel.dot(axisU), rel.dot(axisV)];
  };

  const allCoords3D = [...outerCoords];
  const flat2D = outerCoords.flatMap(projectPoint);
  const holeIndices = [];
  for (const holeCoords of holeCoordsList) {
    if (holeCoords.length < 3) continue;
    holeIndices.push(allCoords3D.length);
    allCoords3D.push(...holeCoords);
    flat2D.push(...holeCoords.flatMap(projectPoint));
  }

  const indices = earcut(flat2D, holeIndices.length ? holeIndices : null);
  for (let i = 0; i < indices.length; i += 3) {
    positions.push(...allCoords3D[indices[i]], ...allCoords3D[indices[i + 1]], ...allCoords3D[indices[i + 2]]);
    normals.push(...normal, ...normal, ...normal);
  }
  return { positions, normals };
}

// ─── Topology traversal (shells referencing shells) ───────────────────────────

// Faces and shells share one ID space, so a directed_reference carries no hint of its target's
// kind. Faces are looked up first, and `topology.type` guards the case where the same ID
// happens to appear in both maps.
function resolveBoundaryReference(ref, faceMap, shellMap) {
  const face = faceMap[ref];
  if (face && face.topology?.type !== SHELL_TOPOLOGY_TYPE) return { kind: FACE_TOPOLOGY_TYPE, feature: face };
  const shell = shellMap[ref];
  if (shell) return { kind: SHELL_TOPOLOGY_TYPE, feature: shell };
  return null;
}

// Flattens a solid or shell boundary into leaf face references, descending through any nested
// shells. Supports both the plain solid → shell → face chain and an offset-derived solid whose
// shell references other shells (e.g. upper/lower offset surfaces) alongside its own faces — a
// shell whose references are all faces flattens to those faces at depth 0, so existing datasets
// resolve exactly as before.
//
// Each leaf face reference keeps its own orientation untouched. A *shell* reference's orientation
// is deliberately not propagated down to the faces it contains: it marks the shell's role in its
// parent (a solid's interior void shell is referenced with '-') rather than requesting a normal
// flip, and the contained faces already carry correctly signed normals.
function flattenToFaceReferences(container, faceMap, shellMap, visitedShellIds = new Set(), depth = 0) {
  if (depth > MAX_SHELL_NESTING_DEPTH) return [];
  const refs = container?.topology?.directed_references || [];
  return refs.flatMap(ref => {
    const resolved = resolveBoundaryReference(ref.ref, faceMap, shellMap);
    if (!resolved) return [];
    if (resolved.kind === FACE_TOPOLOGY_TYPE) return [ref];
    // The cycle guard is per-path, so a shell legitimately referenced from two separate branches
    // is still expanded in both.
    if (visitedShellIds.has(ref.ref)) return [];
    return flattenToFaceReferences(resolved.feature, faceMap, shellMap, new Set(visitedShellIds).add(ref.ref), depth + 1);
  });
}

// Collects the IDs of every shell that bounds a solid, descending through nested shells so a
// shell referenced only indirectly is included too.
function collectSolidShellIds(solids, faceMap, shellMap) {
  const solidShellIds = new Set();
  const visit = (container, depth) => {
    if (depth > MAX_SHELL_NESTING_DEPTH) return;
    const refs = container?.topology?.directed_references || [];
    refs.forEach(ref => {
      const resolved = resolveBoundaryReference(ref.ref, faceMap, shellMap);
      if (!resolved || resolved.kind !== SHELL_TOPOLOGY_TYPE) return;
      // Membership doubles as the cycle guard: a shell already recorded has already had its own
      // references expanded.
      if (solidShellIds.has(ref.ref)) return;
      solidShellIds.add(ref.ref);
      visit(resolved.feature, depth + 1);
    });
  };
  solids.forEach(solid => visit(solid, 0));
  return solidShellIds;
}

// Returns the open shells in a dataset: those no solid uses as part of its boundary, directly or
// through a nested shell. A solid already draws the faces of its own shells, so rendering those
// shells again would duplicate geometry — only open shells describe a surface not otherwise
// visible.
export function getOpenShells(data, maps) {
  const solidShellIds = collectSolidShellIds(getFeatures(data.solids || []), maps.faceMap, maps.shellMap);
  return getFeatures(data.shells || []).filter(shell => !solidShellIds.has(shell.id));
}

function collectUniqueEdgeIds(container, faceMap, shellMap, ringMap) {
  const edgeIds = new Set();
  flattenToFaceReferences(container, faceMap, shellMap).forEach(faceRef => {
    faceMap[faceRef.ref]?.topology.directed_references.forEach(ringRef => {
      ringMap[ringRef.ref]?.topology.directed_references.forEach(edgeRef => edgeIds.add(edgeRef.ref));
    });
  });
  return edgeIds;
}

function lineSegmentsFromPositions(positions, THREE) {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(POSITION_ATTRIBUTE, new THREE.BufferAttribute(new Float32Array(positions), COORDINATE_DIMENSIONS));
  return new THREE.LineSegments(geometry, new THREE.LineBasicMaterial({ color: EDGE_LINE_COLOR }));
}

function loopToSegmentPositions(coords) {
  const positions = [];
  for (let i = 0; i < coords.length; i++) positions.push(...coords[i], ...coords[(i + 1) % coords.length]);
  return positions;
}

function buildContainerEdgeLines(container, shellMap, faceMap, ringMap, edgeMap, pointMap, THREE) {
  const positions = [];
  collectUniqueEdgeIds(container, faceMap, shellMap, ringMap).forEach(id => {
    const pts = edgeMap[id];
    if (pts && pointMap[pts[0]] && pointMap[pts[1]])
      positions.push(...pointMap[pts[0]], ...pointMap[pts[1]]);
  });
  return lineSegmentsFromPositions(positions, THREE);
}

export function buildSolidEdgeLines(solid, shellMap, faceMap, ringMap, edgeMap, pointMap, THREE) {
  return buildContainerEdgeLines(solid, shellMap, faceMap, ringMap, edgeMap, pointMap, THREE);
}

// Edge outline of a standalone (open) Shell — the same walk as buildSolidEdgeLines, starting from
// a shell instead of a solid.
export function buildShellEdgeLines(shell, shellMap, faceMap, ringMap, edgeMap, pointMap, THREE) {
  return buildContainerEdgeLines(shell, shellMap, faceMap, ringMap, edgeMap, pointMap, THREE);
}

// Outline of a single standalone Face (all its rings — outer boundary plus any holes).
export function buildFaceOutline(face, ringMap, edgeMap, pointMap, THREE) {
  const positions = face.topology.directed_references.flatMap(r => {
    const ring = ringMap[r.ref];
    return ring ? loopToSegmentPositions(ringToCoords(ring, edgeMap, pointMap)) : [];
  });
  return lineSegmentsFromPositions(positions, THREE);
}

// Outline of a single standalone Ring with no owning Face.
export function buildRingOutline(ring, edgeMap, pointMap, THREE) {
  return lineSegmentsFromPositions(loopToSegmentPositions(ringToCoords(ring, edgeMap, pointMap)), THREE);
}

// Triangulates a single Face (its outer ring, minus any hole rings after the first
// directed_reference) into positions/normals, oriented per `orientation` ('+'/'-') relative to
// the Face's own `properties.normal`. Shared by solid/shell rendering (a Face reached via a
// Shell) and standalone Face rendering (a Face with no owning Solid/Shell at all) — a Face's
// geometry doesn't depend on whether a Solid happens to reference it.
function faceToTriangles(face, ringMap, edgeMap, pointMap, orientation, THREE) {
  const ringRefs = face.topology.directed_references;
  const outerRing = ringMap[ringRefs[0]?.ref];
  if (!outerRing) return null;
  const outerCoords = ringToCoords(outerRing, edgeMap, pointMap);
  if (outerCoords.length < 3) return null;
  const rawNormal = face.properties?.normal || newellNormal(outerCoords);
  const normal = orientation === REVERSED_ORIENTATION
    ? [-rawNormal[0], -rawNormal[1], -rawNormal[2]]
    : rawNormal;
  const holeCoordsList = ringRefs.slice(1)
    .map(r => ringMap[r.ref])
    .filter(r => r != null)
    .map(r => ringToCoords(r, edgeMap, pointMap))
    .filter(c => c.length >= 3);
  return triangulatePolygon(outerCoords, holeCoordsList, normal, THREE);
}

function trianglesToGeometry(vertexPositions, vertexNormals, THREE) {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(POSITION_ATTRIBUTE, new THREE.BufferAttribute(new Float32Array(vertexPositions), COORDINATE_DIMENSIONS));
  geometry.setAttribute(NORMAL_ATTRIBUTE, new THREE.BufferAttribute(new Float32Array(vertexNormals), COORDINATE_DIMENSIONS));
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  return geometry;
}

function buildGeometryFromFaceReferences(faceReferences, ringMap, edgeMap, pointMap, faceMap, THREE) {
  const vertexPositions = [];
  const vertexNormals = [];
  let faceCount = 0;
  for (const faceRef of faceReferences) {
    const face = faceMap[faceRef.ref];
    if (!face) continue;
    const tri = faceToTriangles(face, ringMap, edgeMap, pointMap, faceRef.orientation, THREE);
    if (!tri) continue;
    vertexPositions.push(...tri.positions);
    vertexNormals.push(...tri.normals);
    faceCount++;
  }
  return { geometry: trianglesToGeometry(vertexPositions, vertexNormals, THREE), faceCount };
}

export function buildSolidGeometry(solid, shellMap, faceMap, ringMap, edgeMap, pointMap, THREE) {
  return buildGeometryFromFaceReferences(
    flattenToFaceReferences(solid, faceMap, shellMap), ringMap, edgeMap, pointMap, faceMap, THREE
  );
}

// Builds a standalone (open) Shell's geometry — the same face-flattening walk as
// buildSolidGeometry, starting from a shell instead of a solid, so a shell that itself
// references other shells (e.g. an offset-derived surface) resolves its nested faces too.
export function buildShellGeometry(shell, shellMap, faceMap, ringMap, edgeMap, pointMap, THREE) {
  return buildGeometryFromFaceReferences(
    flattenToFaceReferences(shell, faceMap, shellMap), ringMap, edgeMap, pointMap, faceMap, THREE
  );
}

// Renders a single Face on its own, independent of any owning Shell/Solid — the "simple polygon"
// case (e.g. a topo-face example with no solid wrapping it).
export function buildFaceGeometry(face, ringMap, edgeMap, pointMap, THREE) {
  const tri = faceToTriangles(face, ringMap, edgeMap, pointMap, '+', THREE);
  if (!tri) return null;
  return trianglesToGeometry(tri.positions, tri.normals, THREE);
}

// Renders a single Ring with no owning Face at all — flattest possible "simple polygon" case.
// Normal is inferred (Newell's method) since a bare Ring carries no `properties.normal`.
export function buildRingGeometry(ring, edgeMap, pointMap, THREE) {
  const coords = ringToCoords(ring, edgeMap, pointMap);
  if (coords.length < 3) return null;
  const tri = triangulatePolygon(coords, [], newellNormal(coords), THREE);
  return trianglesToGeometry(tri.positions, tri.normals, THREE);
}

// ─── Polygon-topology parcels ──────────────────────────────────────────────────
//
// A cadastral "Polygon" parcel (e.g. AggregatePolygon's leaf lots) carries its boundary as
// `topology.references`: a bare, *unordered* bag of edge ids with no orientation — unlike
// Ring/Face's `directed_references`. resolvePolygonCoords walks the edges as an adjacency graph
// to recover an ordered ring. Other parcel topology types (Solid, AggregatePolygon,
// AggregateSolid — which reference other parcels or shells rather than edges) have no
// `topology.references` of this shape, so they safely resolve to an empty ring here and are left
// to the existing solid-rendering tier instead of being force-fit through this path.

function resolvePolygonCoords(edgeRefs, edgeMap, pointMap) {
  const adjacency = new Map();
  let startPointId = null;
  const addNeighbor = (pointId, neighborId) => {
    if (!adjacency.has(pointId)) adjacency.set(pointId, new Set());
    adjacency.get(pointId).add(neighborId);
  };

  edgeRefs.forEach(edgeRef => {
    const pts = edgeMap[edgeRef];
    if (!pts) return;
    const [startId, endId] = pts;
    if (!pointMap[startId] || !pointMap[endId]) return;
    if (startPointId == null) startPointId = startId;
    addNeighbor(startId, endId);
    addNeighbor(endId, startId);
  });
  if (startPointId == null) return [];

  const coords = [pointMap[startPointId]];
  const visited = new Set([startPointId]);
  let previousId = null;
  let currentId = startPointId;

  for (let step = 0; step < adjacency.size + 1; step++) {
    const neighbors = Array.from(adjacency.get(currentId) || []);
    if (!neighbors.length) break;
    const nextId = neighbors.find(id => id !== previousId) || neighbors[0];
    if (nextId === startPointId && coords.length > 2) break;
    if (visited.has(nextId) && nextId !== startPointId) break;
    coords.push(pointMap[nextId]);
    visited.add(nextId);
    previousId = currentId;
    currentId = nextId;
  }

  if (coords.length > 1 && coordsEqual(coords[0], coords[coords.length - 1])) coords.pop();
  return coords;
}

function coordsEqual(a, b) {
  return a.length === b.length && a.every((v, i) => v === b[i]);
}

// Normalises a Polygon parcel's edge references to ring form: accepts both the flat legacy shape
// (`["edge-1", "edge-2", ...]`, a single outer boundary) and the GeoJSON Polygon shape
// (`[["edge-1", ...], ["hole-edge-1", ...]]`, an outer boundary followed by holes). Nesting is
// detected from the first entry, since the two shapes are otherwise indistinguishable.
function normalizePolygonRings(references = []) {
  if (!references.length) return [];
  return Array.isArray(references[0]) ? references : [references];
}

export function buildPolygonGeometry(polygon, edgeMap, pointMap, THREE) {
  const ringCoords = normalizePolygonRings(polygon.topology.references)
    .map(edgeRefs => resolvePolygonCoords(edgeRefs, edgeMap, pointMap))
    .filter(coords => coords.length >= 3);
  if (!ringCoords.length) return null;

  const [outerCoords, ...holeCoordsList] = ringCoords;
  const tri = triangulatePolygon(outerCoords, holeCoordsList, newellNormal(outerCoords), THREE);
  if (!tri.positions.length) return null;
  return trianglesToGeometry(tri.positions, tri.normals, THREE);
}

export function buildPolygonEdgeLines(polygon, edgeMap, pointMap, THREE) {
  const edgeIds = new Set(normalizePolygonRings(polygon.topology.references).flat());
  const positions = [];
  edgeIds.forEach(id => {
    const pts = edgeMap[id];
    if (pts && pointMap[pts[0]] && pointMap[pts[1]])
      positions.push(...pointMap[pts[0]], ...pointMap[pts[1]]);
  });
  return lineSegmentsFromPositions(positions, THREE);
}

// Used for any filled mesh (a Solid, an open Shell surface, a Polygon parcel, or a standalone
// Face/Ring rendered on its own) — only the index (for color cycling) and an optional name/id for
// userData are solid-specific in name only.
export function createSolidMesh(feature, index, geometry, opacity = 1.0, THREE) {
  const mesh = new THREE.Mesh(geometry, new THREE.MeshPhongMaterial({
    color: SOLID_COLORS[index % SOLID_COLORS.length],
    side: THREE.DoubleSide,
    shininess: MESH_SHININESS,
    transparent: opacity < 1.0,
    opacity,
    polygonOffset: true,
    polygonOffsetFactor: POLYGON_OFFSET_FACTOR,
    polygonOffsetUnits: POLYGON_OFFSET_UNITS,
  }));
  mesh.userData.solidName = feature.properties?.name
    || feature.properties?.appellation?.label
    || feature.properties?.appellation
    || feature.id;
  return mesh;
}

function markersFromCoords(coordsList, radius, THREE) {
  const markerGeo = new THREE.SphereGeometry(radius, VERTEX_MARKER_SEGMENTS, VERTEX_MARKER_SEGMENTS);
  const markerMat = new THREE.MeshBasicMaterial({ color: VERTEX_MARKER_COLOR });
  const group = new THREE.Group();
  const seen = new Set();
  coordsList.forEach(([x, y, z]) => {
    const key = `${x.toFixed(VERTEX_KEY_PRECISION)},${y.toFixed(VERTEX_KEY_PRECISION)},${z.toFixed(VERTEX_KEY_PRECISION)}`;
    if (seen.has(key)) return;
    seen.add(key);
    const marker = new THREE.Mesh(markerGeo, markerMat);
    marker.position.set(x, y, z);
    group.add(marker);
  });
  return group;
}

export function createVertexMarkers(geometry, THREE) {
  const r = geometry.boundingSphere.radius * VERTEX_RADIUS_SCALE;
  const pos = geometry.getAttribute(POSITION_ATTRIBUTE);
  const coordsList = [];
  for (let i = 0; i < pos.count; i++) coordsList.push([pos.getX(i), pos.getY(i), pos.getZ(i)]);
  return markersFromCoords(coordsList, r, THREE);
}

// Renders every point in pointMap as a marker — the "bare points" case, with no edges/rings/
// faces/solids referencing them at all. There's no mesh/geometry to derive a boundingSphere from
// here, so the marker radius is scaled off the point cloud's own bounding sphere instead.
export function buildPointMarkers(pointMap, THREE) {
  const coordsList = Object.values(pointMap);
  const box = new THREE.Box3();
  coordsList.forEach(c => box.expandByPoint(new THREE.Vector3(...c)));
  const sphere = box.isEmpty() ? { radius: 1 } : box.getBoundingSphere(new THREE.Sphere());
  const r = (sphere.radius || 1) * VERTEX_RADIUS_SCALE;
  return markersFromCoords(coordsList, r, THREE);
}

// Renders every edge in edgeMap as a line segment — the "bare edges" case, with no rings/faces/
// solids referencing them (as opposed to buildSolidEdgeLines, which draws only the edges reached
// by walking one particular solid's shell → face → ring chain).
export function buildAllEdgeLines(edgeMap, pointMap, THREE) {
  const positions = Object.values(edgeMap).flatMap(([startId, endId]) =>
    (pointMap[startId] && pointMap[endId]) ? [...pointMap[startId], ...pointMap[endId]] : []
  );
  return lineSegmentsFromPositions(positions, THREE);
}

// ─── Elevation ──────────────────────────────────────────────────────────────────
//
// Sets every vertex's Z coordinate to `z`, in place — a rule's `elevation: "flatten"` (or
// `{ flattenTo }`), applied post-build so it works uniformly across every geometry strategy
// (solid/open-shell/polygon/face/ring) without any of them needing to know about it. Operates
// directly on an already-built BufferGeometry's own attributes/methods, so — unlike every other
// function in this module — it needs no THREE parameter: nothing new is constructed. Safe to call
// on both a mesh's geometry (has a `normal` attribute, recomputed since flattening changes it) and
// an outline's geometry (no `normal` attribute — recomputing normals is skipped, not attempted).
export function flattenGeometryZ(geometry, z) {
  const position = geometry.getAttribute(POSITION_ATTRIBUTE);
  for (let i = 0; i < position.count; i++) position.setZ(i, z);
  position.needsUpdate = true;
  if (geometry.getAttribute(NORMAL_ATTRIBUTE)) geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
}
