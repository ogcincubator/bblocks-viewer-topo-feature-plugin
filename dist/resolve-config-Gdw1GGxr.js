const a = Object.freeze({ rules: [], defaults: {}, kindOrder: [] });
function u(r) {
  return {
    rules: Array.isArray(r == null ? void 0 : r.rules) ? r.rules : [],
    defaults: r != null && r.defaults && typeof r.defaults == "object" && !Array.isArray(r.defaults) ? r.defaults : {},
    kindOrder: Array.isArray(r == null ? void 0 : r.kindOrder) ? r.kindOrder : []
  };
}
function l(r) {
  if (r == null) return { ...a };
  let e = r;
  if (typeof r == "string")
    try {
      e = JSON.parse(r);
    } catch {
      return { ...a };
    }
  return typeof e != "object" || Array.isArray(e) ? { ...a } : u(e);
}
function i(r, e) {
  const s = u(r), t = u(e);
  return {
    rules: t.rules.length ? t.rules : s.rules,
    kindOrder: t.kindOrder.length ? t.kindOrder : s.kindOrder,
    defaults: {
      ...s.defaults,
      ...t.defaults,
      style: { ...s.defaults.style, ...t.defaults.style }
    }
  };
}
const y = "https://github.com/ogcincubator/bblocks-viewer-topo-feature-plugin/role/viewer-config";
function O(r) {
  return (Array.isArray(r == null ? void 0 : r.resources) ? r.resources : []).find((s) => (s == null ? void 0 : s.role) === y) ?? null;
}
async function f(r, e, s = fetch) {
  const t = O(r == null ? void 0 : r.bblock);
  if (!(t != null && t.ref)) return u(e);
  try {
    const n = await s(t.ref);
    if (!n.ok) return u(e);
    const d = await n.text();
    return i(e, l(d));
  } catch {
    return u(e);
  }
}
export {
  y as VIEWER_CONFIG_RESOURCE_ROLE,
  O as findViewerConfigResource,
  f as loadViewerConfig
};
