const I = /* @__PURE__ */ new Set();
let Y = !1;
function Fe(e, n, t = 2) {
  const r = n && n.length, o = r ? n[0] * t : e.length;
  I.size && I.clear();
  let i = ie(e, 0, o, t, !0);
  const s = [];
  if (!i || i.next === i.prev) return s;
  let l = 0, c = 0, f = 0;
  if (r && (i = Le(e, n, i, t)), e.length > 80 * t) {
    l = e[0], c = e[1];
    let u = l, a = c;
    for (let y = t; y < o; y += t) {
      const h = e[y], x = e[y + 1];
      h < l && (l = h), x < c && (c = x), h > u && (u = h), x > a && (a = x);
    }
    f = Math.max(u - l, a - c), f = f !== 0 ? 32767 / f : 0;
  }
  return R(i, s, l, c, f), s;
}
function ie(e, n, t, r, o) {
  let i = null;
  if (o === Te(e, n, t, r) > 0)
    for (let s = n; s < t; s += r) i = ne(s / r | 0, e[s], e[s + 1], i);
  else
    for (let s = t - r; s >= n; s -= r) i = ne(s / r | 0, e[s], e[s + 1], i);
  return i && L(i, i.next) && (P(i), i = i.next), i;
}
function A(e, n = e) {
  const t = n === e;
  let r = e, o;
  do
    o = !1, r !== r.next && (I.size === 0 || !I.has(r)) && (L(r, r.next) || d(r.prev, r, r.next) === 0) ? ((t || r === n) && (n = r.prev), Y = !0, P(r), r = r.prev, o = !0) : (t || r !== n) && (r = r.next, o = !t);
  while (o || r !== n);
  return n;
}
function R(e, n, t, r, o) {
  o && Ce(e, t, r, o);
  let i = e, s = !1;
  for (; e.prev !== e.next; ) {
    const l = e.prev, c = e.next;
    if (d(l, e, c) < 0 && (o ? _e(e, t, r, o) : Oe(e))) {
      n.push(l.i, e.i, c.i), P(e), e = c, i = c;
      continue;
    }
    if (e = c, e === i) {
      if (Y = !1, e = A(e), Y) {
        i = e;
        continue;
      }
      if (!s) {
        e = Me(e, n), i = e, s = !0;
        continue;
      }
      Ie(e, n, t, r, o);
      break;
    }
  }
}
function Oe(e) {
  const n = e.prev, t = e, r = e.next, o = n.x, i = t.x, s = r.x, l = n.y, c = t.y, f = r.y, u = Math.min(o, i, s), a = Math.min(l, c, f), y = Math.max(o, i, s), h = Math.max(l, c, f);
  let x = r.next;
  for (; x !== n; ) {
    if (x.x >= u && x.x <= y && x.y >= a && x.y <= h && !(o === x.x && l === x.y) && G(o, l, i, c, s, f, x.x, x.y) && d(x.prev, x, x.next) >= 0) return !1;
    x = x.next;
  }
  return !0;
}
function _e(e, n, t, r) {
  const o = e.prev, i = e, s = e.next, l = o.x, c = i.x, f = s.x, u = o.y, a = i.y, y = s.y, h = Math.min(l, c, f), x = Math.min(u, a, y), m = Math.max(l, c, f), T = Math.max(u, a, y), Se = $(h, x, n, t, r), Ae = $(m, T, n, t, r);
  let p = e.prevZ;
  for (; p && p.z >= Se; ) {
    if (p.x >= h && p.x <= m && p.y >= x && p.y <= T && p !== s && !(l === p.x && u === p.y) && G(l, u, c, a, f, y, p.x, p.y) && d(p.prev, p, p.next) >= 0) return !1;
    p = p.prevZ;
  }
  let w = e.nextZ;
  for (; w && w.z <= Ae; ) {
    if (w.x >= h && w.x <= m && w.y >= x && w.y <= T && w !== s && !(l === w.x && u === w.y) && G(l, u, c, a, f, y, w.x, w.y) && d(w.prev, w, w.next) >= 0) return !1;
    w = w.nextZ;
  }
  return !0;
}
function Me(e, n) {
  let t = e, r = !1;
  do {
    const o = t.prev, i = t.next.next;
    ce(o, t, t.next, i, !1) && B(o, i) && B(i, o) && (n.push(o.i, t.i, i.i), P(t), P(t.next), t = e = i, r = !0), t = t.next;
  } while (t !== e);
  return r ? A(t) : t;
}
function Ie(e, n, t, r, o) {
  let i = e;
  do {
    let s = i.next.next;
    for (; s !== i.prev; ) {
      if (i.i !== s.i && Ze(i, s)) {
        let l = fe(i, s);
        i = A(i, i.next), l = A(l, l.next), R(i, n, t, r, o), R(l, n, t, r, o);
        return;
      }
      s = s.next;
    }
    i = i.next;
  } while (i !== e);
}
let X = !1;
function Le(e, n, t, r) {
  const o = [];
  for (let i = 0, s = n.length; i < s; i++) {
    const l = n[i] * r, c = i < s - 1 ? n[i + 1] * r : e.length, f = (
      /** @type {Node} */
      ie(e, l, c, r, !1)
    );
    f === f.next && I.add(f), o.push(Ve(f));
  }
  o.sort(Be), ke(e.length / r, n.length), le(t, t), X = !0;
  for (let i = 0; i < o.length; i++)
    t = Pe(o[i], t);
  return X = !1, A(t);
}
function Be(e, n) {
  return e.x - n.x || e.y - n.y || (e.next.y - e.y) / (e.next.x - e.x) - (n.next.y - n.y) / (n.next.x - n.x);
}
function Pe(e, n) {
  const t = be(e, n);
  if (!t)
    return n;
  const r = fe(t, e), o = r.next;
  return le(t, o.next), A(r, r.next), A(t, t.next);
}
const se = 16;
let g = new Float64Array(0), C = 0;
const j = [], K = [];
function ke(e, n) {
  const t = Math.ceil((e + 2 * n) / se) + n + 2;
  g.length < t * 4 && (g = new Float64Array(t * 4)), C = 0;
}
function le(e, n) {
  let t = e;
  do {
    const r = C++;
    j[r] = t;
    let o = 1 / 0, i = 1 / 0, s = -1 / 0, l = -1 / 0, c = 0;
    do {
      const u = t.next;
      t.z = r, t.x < o && (o = t.x), t.x > s && (s = t.x), t.y < i && (i = t.y), t.y > l && (l = t.y), u.x < o && (o = u.x), u.x > s && (s = u.x), u.y < i && (i = u.y), u.y > l && (l = u.y), t = u;
    } while (++c < se && t !== n);
    K[r] = t;
    const f = r * 4;
    g[f] = o, g[f + 1] = i, g[f + 2] = s, g[f + 3] = l;
  } while (t !== n);
}
function Ne(e, n) {
  const t = e.z * 4;
  n.x < g[t] && (g[t] = n.x), n.y < g[t + 1] && (g[t + 1] = n.y), n.x > g[t + 2] && (g[t + 2] = n.x), n.y > g[t + 3] && (g[t + 3] = n.y);
}
function ee(e) {
  let n = K[e];
  for (; n.prev.next !== n; ) n = n.next;
  return K[e] = n, n;
}
function te(e) {
  let n = j[e];
  for (; n.prev.next !== n; ) n = n.next;
  return j[e] = n, n;
}
function be(e, n) {
  let t = n;
  const r = e.x, o = e.y;
  let i = -1 / 0, s;
  if (L(e, t)) return t;
  for (let y = 0, h = 0; y < C; y++, h += 4) {
    if (o < g[h + 1] || o > g[h + 3] || g[h] > r || g[h + 2] <= i) continue;
    const x = ee(y);
    t = te(y);
    do {
      if (t.prev.next === t) {
        if (L(e, t.next)) return t.next;
        if (o <= t.y && o >= t.next.y && t.next.y !== t.y) {
          const m = t.x + (o - t.y) * (t.next.x - t.x) / (t.next.y - t.y);
          if (m <= r && m > i && (i = m, s = t.x < t.next.x ? t : t.next, m === r))
            return s;
        }
      }
      t = t.next;
    } while (t !== x);
  }
  if (!s) return null;
  const l = s.x, c = s.y, f = Math.min(o, c), u = Math.max(o, c);
  let a = 1 / 0;
  for (let y = 0, h = 0; y < C; y++, h += 4) {
    if (g[h + 2] < l || g[h] > r || g[h + 3] < f || g[h + 1] > u) continue;
    const x = ee(y);
    t = te(y);
    do {
      if (t.prev.next === t && r >= t.x && t.x >= l && r !== t.x && // skip dead nodes
      G(o < c ? r : i, o, l, c, o < c ? i : r, o, t.x, t.y)) {
        const m = Math.abs(o - t.y) / (r - t.x);
        (B(t, e) || t.y === o && t.next.y === o && t.next.x > r) && (m < a || m === a && (t.x > s.x || t.x === s.x && Ee(s, t))) && (s = t, a = m);
      }
      t = t.next;
    } while (t !== x);
  }
  return s;
}
function Ee(e, n) {
  return d(e.prev, e, n.prev) < 0 && d(n.next, e, e.next) < 0;
}
const v = [];
let F = [], S = new Uint32Array(0), O = new Uint32Array(0);
const _ = new Uint32Array(256);
function Ce(e, n, t, r) {
  let o = e, i = 0;
  do
    o.z = $(o.x, o.y, n, t, r), v[i++] = o, o = o.next;
  while (o !== e);
  Ge(i);
  let s = null;
  for (let l = 0; l < i; l++) {
    const c = v[l];
    c.prevZ = s, s && (s.nextZ = c), s = c;
  }
  s.nextZ = null;
}
function Ge(e) {
  if (e <= 32) {
    for (let n = 1; n < e; n++) {
      const t = v[n], r = t.z;
      let o = n - 1;
      for (; o >= 0 && v[o].z > r; )
        v[o + 1] = v[o], o--;
      v[o + 1] = t;
    }
    return;
  }
  S.length < e && (S = new Uint32Array(e), O = new Uint32Array(e), F = new Array(e));
  for (let n = 0; n < e; n++) S[n] = v[n].z;
  b(e, v, S, F, O, 0), b(e, F, O, v, S, 8), b(e, v, S, F, O, 16), b(e, F, O, v, S, 24);
}
function b(e, n, t, r, o, i) {
  _.fill(0);
  for (let l = 0; l < e; l++) _[t[l] >>> i & 255]++;
  let s = 0;
  for (let l = 0; l < 256; l++) {
    const c = _[l];
    _[l] = s, s += c;
  }
  for (let l = 0; l < e; l++) {
    const c = t[l], f = _[c >>> i & 255]++;
    r[f] = n[l], o[f] = c;
  }
}
function $(e, n, t, r, o) {
  return e = (e - t) * o | 0, n = (n - r) * o | 0, e = (e | e << 8) & 16711935, e = (e | e << 4) & 252645135, e = (e | e << 2) & 858993459, e = (e | e << 1) & 1431655765, n = (n | n << 8) & 16711935, n = (n | n << 4) & 252645135, n = (n | n << 2) & 858993459, n = (n | n << 1) & 1431655765, e | n << 1;
}
function Ve(e) {
  let n = e, t = e;
  do
    (n.x < t.x || n.x === t.x && n.y < t.y) && (t = n), n = n.next;
  while (n !== e);
  return t;
}
function G(e, n, t, r, o, i, s, l) {
  return (o - s) * (n - l) >= (e - s) * (i - l) && (e - s) * (r - l) >= (t - s) * (n - l) && (t - s) * (i - l) >= (o - s) * (r - l);
}
function Ze(e, n) {
  const t = L(e, n) && d(e.prev, e, e.next) > 0 && d(n.prev, n, n.next) > 0;
  return e.next.i !== n.i && (t || B(e, n) && B(n, e) && // // locally visible
  (d(e.prev, e, n.prev) !== 0 || d(e, n.prev, n) !== 0)) && // no opposite-facing sectors
  !ze(e, n) && (t || De(e, n));
}
function d(e, n, t) {
  return (n.y - e.y) * (t.x - n.x) - (n.x - e.x) * (t.y - n.y);
}
function L(e, n) {
  return e.x === n.x && e.y === n.y;
}
function ce(e, n, t, r, o = !0) {
  const i = d(e, n, t), s = d(e, n, r), l = d(t, r, e), c = d(t, r, n);
  return (i > 0 && s < 0 || i < 0 && s > 0) && (l > 0 && c < 0 || l < 0 && c > 0) ? !0 : o ? !!(i === 0 && E(e, t, n) || s === 0 && E(e, r, n) || l === 0 && E(t, e, r) || c === 0 && E(t, n, r)) : !1;
}
function E(e, n, t) {
  return n.x <= Math.max(e.x, t.x) && n.x >= Math.min(e.x, t.x) && n.y <= Math.max(e.y, t.y) && n.y >= Math.min(e.y, t.y);
}
function ze(e, n) {
  const t = Math.min(e.x, n.x), r = Math.max(e.x, n.x), o = Math.min(e.y, n.y), i = Math.max(e.y, n.y);
  let s = e;
  do {
    const l = s.next;
    if (s.x > r && l.x > r || s.x < t && l.x < t || s.y > i && l.y > i || s.y < o && l.y < o) {
      s = l;
      continue;
    }
    if (s.i !== e.i && l.i !== e.i && s.i !== n.i && l.i !== n.i && ce(s, l, e, n)) return !0;
    s = l;
  } while (s !== e);
  return !1;
}
function B(e, n) {
  return d(e.prev, e, e.next) < 0 ? d(e, n, e.next) >= 0 && d(e, e.prev, n) >= 0 : d(e, n, e.prev) < 0 || d(e, e.next, n) < 0;
}
function De(e, n) {
  let t = e, r = !1;
  const o = (e.x + n.x) / 2, i = (e.y + n.y) / 2;
  do {
    const s = t.next;
    t.y > i != s.y > i && o < (s.x - t.x) * (i - t.y) / (s.y - t.y) + t.x && (r = !r), t = s;
  } while (t !== e);
  return r;
}
function fe(e, n) {
  const t = J(e.i, e.x, e.y), r = J(n.i, n.x, n.y), o = e.next, i = n.prev;
  return e.next = n, n.prev = e, t.next = o, o.prev = t, r.next = t, t.prev = r, i.next = r, r.prev = i, r;
}
function ne(e, n, t, r) {
  const o = J(e, n, t);
  return r ? (o.next = r.next, o.prev = r, r.next.prev = o, r.next = o) : (o.prev = o, o.next = o), o;
}
function P(e) {
  e.next.prev = e.prev, e.prev.next = e.next, e.prevZ && (e.prevZ.nextZ = e.nextZ), e.nextZ && (e.nextZ.prevZ = e.prevZ), X && Ne(e.prev, e.next);
}
function J(e, n, t) {
  return (
    /** @type {Node} */
    /** @type {unknown} */
    {
      i: e,
      // vertex index in coordinates array
      x: n,
      y: t,
      // vertex coordinates
      prev: null,
      // previous and next vertex nodes in a polygon ring
      next: null,
      z: 0,
      // z-order curve value; doubles as owning block in the hole-bridge index during eliminateHoles
      prevZ: null,
      // previous and next nodes in z-order
      nextZ: null
    }
  );
}
function Te(e, n, t, r) {
  let o = 0;
  for (let i = n, s = t - r; i < t; i += r)
    o += (e[s] - e[i]) * (e[i + 1] + e[s + 1]), s = i;
  return o;
}
const V = 3, Ue = 0.9, W = "position", Ye = "normal", Re = "-", ue = "Face", Q = "Shell", Xe = "SubtendedAngle", xe = 16, je = 16777215, re = 12, Ke = 16776960, U = 6, ye = 0.05, $e = 30, Je = 1, Qe = 1, oe = [
  3377407,
  16746547,
  3407752,
  16724872,
  8926207,
  3407871,
  16777011,
  16724991,
  8978227,
  3377322
];
function he(e) {
  return Array.isArray(e == null ? void 0 : e.features) ? e.features : [e];
}
function We(e = []) {
  return e.filter((n) => (n == null ? void 0 : n.featureType) !== Xe);
}
function it(e) {
  const n = M(
    e.points,
    (t) => (t.place || t.geometry).coordinates.slice()
  );
  return He(Object.values(n)), {
    pointMap: n,
    edgeMap: M(We(e.edges), (t) => t.topology.references),
    ringMap: M(e.rings),
    faceMap: M(e.faces),
    shellMap: M(e.shells)
  };
}
function M(e = [], n = (t) => t) {
  const t = {};
  return e.forEach((r) => he(r).forEach((o) => {
    t[o.id] = n(o);
  })), t;
}
function He(e) {
  if (!e.length) return;
  const n = qe(e);
  e.forEach((t) => {
    t[0] -= n[0], t[1] -= n[1];
  });
}
function qe(e) {
  return e.reduce(
    (t, r) => (r.forEach((o, i) => {
      t[i] += o;
    }), t),
    Array(V).fill(0)
  ).map((t) => t / e.length);
}
function Z(e = []) {
  return e.flatMap(he);
}
function st(e) {
  const n = Z(e.faces || []).some((r) => r.topology.directed_references.length > 1), t = Z(e.solids || []).some((r) => r.topology.directed_references.length > 1);
  return n || t;
}
function k(e, n, t) {
  return e.topology.directed_references.map((r) => {
    const [o, i] = n[r.ref];
    return t[r.orientation === "+" ? o : i];
  });
}
function H(e) {
  const n = [0, 0, 0];
  for (let r = 0; r < e.length; r++) {
    const [o, i, s] = e[r], [l, c, f] = e[(r + 1) % e.length];
    n[0] += (i - c) * (s + f), n[1] += (s - f) * (o + l), n[2] += (o - l) * (i + c);
  }
  const t = Math.hypot(...n) || 1;
  return [n[0] / t, n[1] / t, n[2] / t];
}
function et(e, n) {
  const t = new n.Vector3(...e).normalize(), r = Math.abs(t.x) < Ue ? new n.Vector3(1, 0, 0) : new n.Vector3(0, 1, 0), o = new n.Vector3().crossVectors(r, t).normalize();
  return { axisU: o, axisV: new n.Vector3().crossVectors(t, o) };
}
function q(e, n, t, r) {
  const o = [], i = [];
  if (e.length < 3) return { positions: o, normals: i };
  const { axisU: s, axisV: l } = et(t, r), c = new r.Vector3(...e[0]), f = (x) => {
    const m = new r.Vector3(...x).sub(c);
    return [m.dot(s), m.dot(l)];
  }, u = [...e], a = e.flatMap(f), y = [];
  for (const x of n)
    x.length < 3 || (y.push(u.length), u.push(...x), a.push(...x.flatMap(f)));
  const h = Fe(a, y.length ? y : null);
  for (let x = 0; x < h.length; x += 3)
    o.push(...u[h[x]], ...u[h[x + 1]], ...u[h[x + 2]]), i.push(...t, ...t, ...t);
  return { positions: o, normals: i };
}
function ae(e, n, t) {
  var i;
  const r = n[e];
  if (r && ((i = r.topology) == null ? void 0 : i.type) !== Q) return { kind: ue, feature: r };
  const o = t[e];
  return o ? { kind: Q, feature: o } : null;
}
function z(e, n, t, r = /* @__PURE__ */ new Set(), o = 0) {
  var s;
  return o > xe ? [] : (((s = e == null ? void 0 : e.topology) == null ? void 0 : s.directed_references) || []).flatMap((l) => {
    const c = ae(l.ref, n, t);
    return c ? c.kind === ue ? [l] : r.has(l.ref) ? [] : z(c.feature, n, t, new Set(r).add(l.ref), o + 1) : [];
  });
}
function tt(e, n, t) {
  const r = /* @__PURE__ */ new Set(), o = (i, s) => {
    var c;
    if (s > xe) return;
    (((c = i == null ? void 0 : i.topology) == null ? void 0 : c.directed_references) || []).forEach((f) => {
      const u = ae(f.ref, n, t);
      !u || u.kind !== Q || r.has(f.ref) || (r.add(f.ref), o(u.feature, s + 1));
    });
  };
  return e.forEach((i) => o(i, 0)), r;
}
function lt(e, n) {
  const t = tt(Z(e.solids || []), n.faceMap, n.shellMap);
  return Z(e.shells || []).filter((r) => !t.has(r.id));
}
function nt(e, n, t, r) {
  const o = /* @__PURE__ */ new Set();
  return z(e, n, t).forEach((i) => {
    var s;
    (s = n[i.ref]) == null || s.topology.directed_references.forEach((l) => {
      var c;
      (c = r[l.ref]) == null || c.topology.directed_references.forEach((f) => o.add(f.ref));
    });
  }), o;
}
function N(e, n) {
  const t = new n.BufferGeometry();
  return t.setAttribute(W, new n.BufferAttribute(new Float32Array(e), V)), new n.LineSegments(t, new n.LineBasicMaterial({ color: je }));
}
function ge(e) {
  const n = [];
  for (let t = 0; t < e.length; t++) n.push(...e[t], ...e[(t + 1) % e.length]);
  return n;
}
function de(e, n, t, r, o, i, s) {
  const l = [];
  return nt(e, t, n, r).forEach((c) => {
    const f = o[c];
    f && i[f[0]] && i[f[1]] && l.push(...i[f[0]], ...i[f[1]]);
  }), N(l, s);
}
function ct(e, n, t, r, o, i, s) {
  return de(e, n, t, r, o, i, s);
}
function ft(e, n, t, r, o, i, s) {
  return de(e, n, t, r, o, i, s);
}
function ut(e, n, t, r, o) {
  const i = e.topology.directed_references.flatMap((s) => {
    const l = n[s.ref];
    return l ? ge(k(l, t, r)) : [];
  });
  return N(i, o);
}
function xt(e, n, t, r) {
  return N(ge(k(e, n, t)), r);
}
function pe(e, n, t, r, o, i) {
  var y, h;
  const s = e.topology.directed_references, l = n[(y = s[0]) == null ? void 0 : y.ref];
  if (!l) return null;
  const c = k(l, t, r);
  if (c.length < 3) return null;
  const f = ((h = e.properties) == null ? void 0 : h.normal) || H(c), u = o === Re ? [-f[0], -f[1], -f[2]] : f, a = s.slice(1).map((x) => n[x.ref]).filter((x) => x != null).map((x) => k(x, t, r)).filter((x) => x.length >= 3);
  return q(c, a, u, i);
}
function D(e, n, t) {
  const r = new t.BufferGeometry();
  return r.setAttribute(W, new t.BufferAttribute(new Float32Array(e), V)), r.setAttribute(Ye, new t.BufferAttribute(new Float32Array(n), V)), r.computeBoundingBox(), r.computeBoundingSphere(), r;
}
function we(e, n, t, r, o, i) {
  const s = [], l = [];
  let c = 0;
  for (const f of e) {
    const u = o[f.ref];
    if (!u) continue;
    const a = pe(u, n, t, r, f.orientation, i);
    a && (s.push(...a.positions), l.push(...a.normals), c++);
  }
  return { geometry: D(s, l, i), faceCount: c };
}
function yt(e, n, t, r, o, i, s) {
  return we(
    z(e, t, n),
    r,
    o,
    i,
    t,
    s
  );
}
function ht(e, n, t, r, o, i, s) {
  return we(
    z(e, t, n),
    r,
    o,
    i,
    t,
    s
  );
}
function at(e, n, t, r, o) {
  const i = pe(e, n, t, r, "+", o);
  return i ? D(i.positions, i.normals, o) : null;
}
function gt(e, n, t, r) {
  const o = k(e, n, t);
  if (o.length < 3) return null;
  const i = q(o, [], H(o), r);
  return D(i.positions, i.normals, r);
}
function rt(e, n, t) {
  const r = /* @__PURE__ */ new Map();
  let o = null;
  const i = (u, a) => {
    r.has(u) || r.set(u, /* @__PURE__ */ new Set()), r.get(u).add(a);
  };
  if (e.forEach((u) => {
    const a = n[u];
    if (!a) return;
    const [y, h] = a;
    !t[y] || !t[h] || (o == null && (o = y), i(y, h), i(h, y));
  }), o == null) return [];
  const s = [t[o]], l = /* @__PURE__ */ new Set([o]);
  let c = null, f = o;
  for (let u = 0; u < r.size + 1; u++) {
    const a = Array.from(r.get(f) || []);
    if (!a.length) break;
    const y = a.find((h) => h !== c) || a[0];
    if (y === o && s.length > 2 || l.has(y) && y !== o) break;
    s.push(t[y]), l.add(y), c = f, f = y;
  }
  return s.length > 1 && ot(s[0], s[s.length - 1]) && s.pop(), s;
}
function ot(e, n) {
  return e.length === n.length && e.every((t, r) => t === n[r]);
}
function me(e = []) {
  return e.length ? Array.isArray(e[0]) ? e : [e] : [];
}
function dt(e, n, t, r) {
  const o = me(e.topology.references).map((c) => rt(c, n, t)).filter((c) => c.length >= 3);
  if (!o.length) return null;
  const [i, ...s] = o, l = q(i, s, H(i), r);
  return l.positions.length ? D(l.positions, l.normals, r) : null;
}
function pt(e, n, t, r) {
  const o = new Set(me(e.topology.references).flat()), i = [];
  return o.forEach((s) => {
    const l = n[s];
    l && t[l[0]] && t[l[1]] && i.push(...t[l[0]], ...t[l[1]]);
  }), N(i, r);
}
function wt(e, n, t, r = 1, o) {
  var s, l, c, f;
  const i = new o.Mesh(t, new o.MeshPhongMaterial({
    color: oe[n % oe.length],
    side: o.DoubleSide,
    shininess: $e,
    transparent: r < 1,
    opacity: r,
    polygonOffset: !0,
    polygonOffsetFactor: Je,
    polygonOffsetUnits: Qe
  }));
  return i.userData.solidName = ((s = e.properties) == null ? void 0 : s.name) || ((c = (l = e.properties) == null ? void 0 : l.appellation) == null ? void 0 : c.label) || ((f = e.properties) == null ? void 0 : f.appellation) || e.id, i;
}
function ve(e, n, t) {
  const r = new t.SphereGeometry(n, re, re), o = new t.MeshBasicMaterial({ color: Ke }), i = new t.Group(), s = /* @__PURE__ */ new Set();
  return e.forEach(([l, c, f]) => {
    const u = `${l.toFixed(U)},${c.toFixed(U)},${f.toFixed(U)}`;
    if (s.has(u)) return;
    s.add(u);
    const a = new t.Mesh(r, o);
    a.position.set(l, c, f), i.add(a);
  }), i;
}
function mt(e, n) {
  const t = e.boundingSphere.radius * ye, r = e.getAttribute(W), o = [];
  for (let i = 0; i < r.count; i++) o.push([r.getX(i), r.getY(i), r.getZ(i)]);
  return ve(o, t, n);
}
function vt(e, n) {
  const t = Object.values(e), r = new n.Box3();
  t.forEach((s) => r.expandByPoint(new n.Vector3(...s)));
  const i = ((r.isEmpty() ? { radius: 1 } : r.getBoundingSphere(new n.Sphere())).radius || 1) * ye;
  return ve(t, i, n);
}
function St(e, n, t) {
  const r = Object.values(e).flatMap(
    ([o, i]) => n[o] && n[i] ? [...n[o], ...n[i]] : []
  );
  return N(r, t);
}
export {
  oe as SOLID_COLORS,
  St as buildAllEdgeLines,
  at as buildFaceGeometry,
  ut as buildFaceOutline,
  it as buildMaps,
  vt as buildPointMarkers,
  pt as buildPolygonEdgeLines,
  dt as buildPolygonGeometry,
  gt as buildRingGeometry,
  xt as buildRingOutline,
  ft as buildShellEdgeLines,
  ht as buildShellGeometry,
  ct as buildSolidEdgeLines,
  yt as buildSolidGeometry,
  wt as createSolidMesh,
  mt as createVertexMarkers,
  Z as getFeatures,
  lt as getOpenShells,
  st as needsTransparency
};
