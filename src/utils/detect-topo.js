// Detects a topo-feature (https://github.com/ogcincubator/topo-feature) topology document: a
// CityJSON-like structure of feature collections cross-referenced by id
// (points/edges/rings/faces/shells/solids), rather than plain nested GeoJSON coordinates.
const TOPO_KEYS = ['points', 'edges', 'rings', 'faces', 'shells', 'solids'];

// A TOPO_KEYS array entry appears in two conventions found across real topo-feature registers:
// a nested FeatureCollection wrapper (`{ features: [...] }`, e.g. topo-feature-multi-collection's
// examples) or a bare Feature itself (e.g. topo-solid's self-contained examples). Both are
// "a topo-feature collection entry"; collectionFeatures() normalizes either to a flat feature
// list. Kept in sync with the identical helper in topo-geometry.js (duplicated rather than shared
// because that module is loaded lazily at render() time, while this one runs synchronously and
// cheaply during matches()).
function isCollectionEntry(item) {
  return Array.isArray(item?.features) || item?.type === 'Feature';
}

function collectionFeatures(item) {
  return Array.isArray(item?.features) ? item.features : [item];
}

export function isTopoFeatureMultiCollection(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return false;
  return TOPO_KEYS.some(k => Array.isArray(data[k]) && data[k].some(isCollectionEntry));
}

// True if any Point feature under data.points carries a 3D coordinate (place, when present,
// takes precedence over geometry — mirrors buildMaps' own point-coordinate lookup in
// topo-geometry.js, since a point's authoritative coordinates may live in either).
export function has3DPoints(data) {
  if (!Array.isArray(data?.points)) return false;
  return data.points.some(fc =>
    collectionFeatures(fc).some(f => {
      const coords = (f?.place || f?.geometry)?.coordinates;
      return Array.isArray(coords) && coords.length >= 3;
    })
  );
}

// This is a 3D viewer: it only claims topo-feature documents whose points actually carry a Z
// coordinate. A 2D-only topo-feature document (e.g. a plain cadastral parcel of points+edges) is
// left to the default GeoJSON/map view instead. Above that bar, any shape of 3D content qualifies
// — bare points, edges, a single ring/face, or a full solid — not solids exclusively.
export function isTopoFeature3D(data) {
  return isTopoFeatureMultiCollection(data) && has3DPoints(data);
}
