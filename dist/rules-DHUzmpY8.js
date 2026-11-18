function y(e, r = {}) {
  if (typeof e != "string") return e;
  const t = e.indexOf(":");
  if (t === -1) return e;
  const n = e.slice(0, t), s = r[n];
  return typeof s != "string" ? e : s + e.slice(t + 1);
}
function h(e, r, t = {}) {
  if (e == null) return !1;
  const n = (Array.isArray(e) ? e : [e]).map((s) => y(s, t));
  return r.some((s) => n.includes(y(s, t)));
}
function k(e) {
  return Array.isArray(e == null ? void 0 : e.features) ? e.features : [e];
}
function A(e, r) {
  const t = e == null ? void 0 : e[r];
  return Array.isArray(t) ? t.flatMap(k) : [];
}
function c(e, r) {
  return r.split(".").reduce((t, n) => t == null ? void 0 : t[n], e);
}
function a(e) {
  if (!(e == null || e === ""))
    return typeof e == "object" ? typeof e.label == "string" ? e.label : void 0 : String(e);
}
function V(e, r = {}) {
  const t = r.properties || [];
  for (const s of t) {
    const l = a(c(e, s));
    if (l !== void 0) return l;
  }
  return a(c(e, r.fallback || "id")) ?? String(e.id);
}
function x(e, r, t) {
  if (!r.match) return !0;
  const n = c(e, r.match.property);
  return h(n, r.match.values || [], t);
}
function F(e, r, t = (e == null ? void 0 : e["@context"]) || {}) {
  const n = (r == null ? void 0 : r.rules) || [], s = [...new Set(n.map((i) => i.source))], l = [];
  return s.forEach((i) => {
    const b = n.filter((o) => o.source === i);
    A(e, i).forEach((o) => {
      var f, p;
      const u = b.find((d) => x(o, d, t));
      u && l.push({
        feature: o,
        source: i,
        kind: u.kind,
        // `group` lets several rules with distinct `kind`s (e.g. one per parcelState value) share
        // one panel heading / one inline toggle button, while still being individually toggleable
        // by their own `kind` underneath it. Defaults to the rule's own `kind` — a rule that never
        // sets `group` is its own group of one, identical to every kind's behaviour before `group`
        // existed.
        group: u.group || u.kind,
        // Human-friendly label for this specific kind's sub-heading in the panel (e.g. "Former
        // Tenure" for a `kind` of "parcel-former-tenure"). Left undefined when unset — the
        // renderer falls back to its own built-in labels or a humanized kind slug.
        kindLabel: u.kindLabel,
        geometry: u.geometry,
        label: V(o, u.label),
        style: { ...(f = r == null ? void 0 : r.defaults) == null ? void 0 : f.style, ...u.style },
        initiallyVisible: u.initiallyVisible ?? !0,
        elevation: u.elevation || ((p = r == null ? void 0 : r.defaults) == null ? void 0 : p.elevation) || "preserve"
      });
    });
  }), l;
}
function m(e) {
  return e === "flatten" ? 0 : e && typeof e == "object" && typeof e.flattenTo == "number" ? e.flattenTo : null;
}
export {
  F as classifyFeatures,
  c as getPath,
  m as resolveFlattenZ,
  V as resolveLabel
};
