// Detects a topo-feature (https://github.com/ogcincubator/topo-feature) topology document: a
// CityJSON-like structure of feature collections cross-referenced by id
// (points/edges/rings/faces/shells/solids), rather than plain nested GeoJSON coordinates.
export function isTopoFeatureMultiCollection(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return false;
  const topoKeys = ['points', 'edges', 'rings', 'faces', 'shells', 'solids'];
  return topoKeys.some(k =>
    Array.isArray(data[k]) && data[k].some(fc => Array.isArray(fc?.features))
  );
}
