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

// A points/edges/rings/faces/shells/solids array entry is either a nested FeatureCollection
// wrapper (`{ features: [...] }`, e.g. topo-feature-multi-collection's examples) or a bare
// Feature itself (e.g. topo-solid's self-contained examples). Kept in sync with the identical
// helper in detect-topo.js (duplicated rather than shared — see that file's comment).
function collectionFeatures(item) {
  return Array.isArray(item?.features) ? item.features : [item];
}

export function buildMaps(data) {
  const pointMap = mapFeaturesById(data.points, pf =>
    (pf.place || pf.geometry).coordinates.slice()
  );
  centerCoordinatesAroundOrigin(Object.values(pointMap));
  return {
    pointMap,
    edgeMap: mapFeaturesById(data.edges, ef => ef.topology.references),
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

function centerCoordinatesAroundOrigin(coords) {
  if (!coords.length) return;
  const centroid = calculateCentroid(coords);
  coords.forEach(c => c.forEach((v, i) => { c[i] = v - centroid[i]; }));
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
    edges:  countFeatures(data.edges),
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
// ring has no owning Face to supply an authoritative `properties.normal` — i.e. a bare/standalone
// ring rendered on its own rather than as part of a Face.
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

function collectUniqueSolidEdgeIds(solid, shellMap, faceMap, ringMap) {
  const edgeIds = new Set();
  solid.topology.directed_references.forEach(shellRef => {
    shellMap[shellRef.ref]?.topology.directed_references.forEach(faceRef => {
      faceMap[faceRef.ref]?.topology.directed_references.forEach(ringRef => {
        ringMap[ringRef.ref]?.topology.directed_references.forEach(edgeRef => edgeIds.add(edgeRef.ref));
      });
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

export function buildSolidEdgeLines(solid, shellMap, faceMap, ringMap, edgeMap, pointMap, THREE) {
  const positions = [];
  collectUniqueSolidEdgeIds(solid, shellMap, faceMap, ringMap).forEach(id => {
    const pts = edgeMap[id];
    if (pts && pointMap[pts[0]] && pointMap[pts[1]])
      positions.push(...pointMap[pts[0]], ...pointMap[pts[1]]);
  });
  return lineSegmentsFromPositions(positions, THREE);
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
// the Face's own `properties.normal`. Shared by solid rendering (a Face reached via a Shell) and
// standalone Face rendering (a Face with no owning Solid at all) — a Face's geometry doesn't
// depend on whether a Solid happens to reference it.
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

export function buildSolidGeometry(solid, shellMap, faceMap, ringMap, edgeMap, pointMap, THREE) {
  const vertexPositions = [];
  const vertexNormals = [];
  let faceCount = 0;
  for (const shellRef of solid.topology.directed_references) {
    const shell = shellMap[shellRef.ref];
    if (!shell) continue;
    for (const faceRef of shell.topology.directed_references) {
      const face = faceMap[faceRef.ref];
      if (!face) continue;
      const tri = faceToTriangles(face, ringMap, edgeMap, pointMap, faceRef.orientation, THREE);
      if (!tri) continue;
      vertexPositions.push(...tri.positions);
      vertexNormals.push(...tri.normals);
      faceCount++;
    }
  }
  return { geometry: trianglesToGeometry(vertexPositions, vertexNormals, THREE), faceCount };
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

// Used for any filled mesh (a Solid, or a standalone Face/Ring rendered on its own) — only the
// index (for color cycling) and an optional name/id for userData are solid-specific in name only.
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
  mesh.userData.solidName = feature.properties?.name || feature.id;
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