const L = /* @__PURE__ */ new Set();
let R = !1;
function _e(e, n, t = 2) {
  const r = n && n.length, o = r ? n[0] * t : e.length;
  L.size && L.clear();
  let i = se(e, 0, o, t, !0);
  const s = [];
  if (!i || i.next === i.prev) return s;
  let l = 0, c = 0, f = 0;
  if (r && (i = Pe(e, n, i, t)), e.length > 80 * t) {
    l = e[0], c = e[1];
    let u = l, a = c;
    for (let h = t; h < o; h += t) {
      const y = e[h], x = e[h + 1];
      y < l && (l = y), x < c && (c = x), y > u && (u = y), x > a && (a = x);
    }
    f = Math.max(u - l, a - c), f = f !== 0 ? 32767 / f : 0;
  }
  return X(i, s, l, c, f), s;
}
function se(e, n, t, r, o) {
  let i = null;
  if (o === Ye(e, n, t, r) > 0)
    for (let s = n; s < t; s += r) i = re(s / r | 0, e[s], e[s + 1], i);
  else
    for (let s = t - r; s >= n; s -= r) i = re(s / r | 0, e[s], e[s + 1], i);
  return i && M(i, i.next) && (P(i), i = i.next), i;
}
function A(e, n = e) {
  const t = n === e;
  let r = e, o;
  do
    o = !1, r !== r.next && (L.size === 0 || !L.has(r)) && (M(r, r.next) || d(r.prev, r, r.next) === 0) ? ((t || r === n) && (n = r.prev), R = !0, P(r), r = r.prev, o = !0) : (t || r !== n) && (r = r.next, o = !t);
  while (o || r !== n);
  return n;
}
function X(e, n, t, r, o) {
  o && Ge(e, t, r, o);
  let i = e, s = !1;
  for (; e.prev !== e.next; ) {
    const l = e.prev, c = e.next;
    if (d(l, e, c) < 0 && (o ? Le(e, t, r, o) : Ie(e))) {
      n.push(l.i, e.i, c.i), P(e), e = c, i = c;
      continue;
    }
    if (e = c, e === i) {
      if (R = !1, e = A(e), R) {
        i = e;
        continue;
      }
      if (!s) {
        e = Me(e, n), i = e, s = !0;
        continue;
      }
      Be(e, n, t, r, o);
      break;
    }
  }
}
function Ie(e) {
  const n = e.prev, t = e, r = e.next, o = n.x, i = t.x, s = r.x, l = n.y, c = t.y, f = r.y, u = Math.min(o, i, s), a = Math.min(l, c, f), h = Math.max(o, i, s), y = Math.max(l, c, f);
  let x = r.next;
  for (; x !== n; ) {
    if (x.x >= u && x.x <= h && x.y >= a && x.y <= y && !(o === x.x && l === x.y) && Z(o, l, i, c, s, f, x.x, x.y) && d(x.prev, x, x.next) >= 0) return !1;
    x = x.next;
  }
  return !0;
}
function Le(e, n, t, r) {
  const o = e.prev, i = e, s = e.next, l = o.x, c = i.x, f = s.x, u = o.y, a = i.y, h = s.y, y = Math.min(l, c, f), x = Math.min(u, a, h), w = Math.max(l, c, f), U = Math.max(u, a, h), Fe = J(y, x, n, t, r), Oe = J(w, U, n, t, r);
  let p = e.prevZ;
  for (; p && p.z >= Fe; ) {
    if (p.x >= y && p.x <= w && p.y >= x && p.y <= U && p !== s && !(l === p.x && u === p.y) && Z(l, u, c, a, f, h, p.x, p.y) && d(p.prev, p, p.next) >= 0) return !1;
    p = p.prevZ;
  }
  let m = e.nextZ;
  for (; m && m.z <= Oe; ) {
    if (m.x >= y && m.x <= w && m.y >= x && m.y <= U && m !== s && !(l === m.x && u === m.y) && Z(l, u, c, a, f, h, m.x, m.y) && d(m.prev, m, m.next) >= 0) return !1;
    m = m.nextZ;
  }
  return !0;
}
function Me(e, n) {
  let t = e, r = !1;
  do {
    const o = t.prev, i = t.next.next;
    fe(o, t, t.next, i, !1) && B(o, i) && B(i, o) && (n.push(o.i, t.i, i.i), P(t), P(t.next), t = e = i, r = !0), t = t.next;
  } while (t !== e);
  return r ? A(t) : t;
}
function Be(e, n, t, r, o) {
  let i = e;
  do {
    let s = i.next.next;
    for (; s !== i.prev; ) {
      if (i.i !== s.i && De(i, s)) {
        let l = ue(i, s);
        i = A(i, i.next), l = A(l, l.next), X(i, n, t, r, o), X(l, n, t, r, o);
        return;
      }
      s = s.next;
    }
    i = i.next;
  } while (i !== e);
}
let j = !1;
function Pe(e, n, t, r) {
  const o = [];
  for (let i = 0, s = n.length; i < s; i++) {
    const l = n[i] * r, c = i < s - 1 ? n[i + 1] * r : e.length, f = (
      /** @type {Node} */
      se(e, l, c, r, !1)
    );
    f === f.next && L.add(f), o.push(ze(f));
  }
  o.sort(Ne), Ee(e.length / r, n.length), ce(t, t), j = !0;
  for (let i = 0; i < o.length; i++)
    t = ke(o[i], t);
  return j = !1, A(t);
}
function Ne(e, n) {
  return e.x - n.x || e.y - n.y || (e.next.y - e.y) / (e.next.x - e.x) - (n.next.y - n.y) / (n.next.x - n.x);
}
function ke(e, n) {
  const t = Ce(e, n);
  if (!t)
    return n;
  const r = ue(t, e), o = r.next;
  return ce(t, o.next), A(r, r.next), A(t, t.next);
}
const le = 16;
let g = new Float64Array(0), C = 0;
const K = [], $ = [];
function Ee(e, n) {
  const t = Math.ceil((e + 2 * n) / le) + n + 2;
  g.length < t * 4 && (g = new Float64Array(t * 4)), C = 0;
}
function ce(e, n) {
  let t = e;
  do {
    const r = C++;
    K[r] = t;
    let o = 1 / 0, i = 1 / 0, s = -1 / 0, l = -1 / 0, c = 0;
    do {
      const u = t.next;
      t.z = r, t.x < o && (o = t.x), t.x > s && (s = t.x), t.y < i && (i = t.y), t.y > l && (l = t.y), u.x < o && (o = u.x), u.x > s && (s = u.x), u.y < i && (i = u.y), u.y > l && (l = u.y), t = u;
    } while (++c < le && t !== n);
    $[r] = t;
    const f = r * 4;
    g[f] = o, g[f + 1] = i, g[f + 2] = s, g[f + 3] = l;
  } while (t !== n);
}
function be(e, n) {
  const t = e.z * 4;
  n.x < g[t] && (g[t] = n.x), n.y < g[t + 1] && (g[t + 1] = n.y), n.x > g[t + 2] && (g[t + 2] = n.x), n.y > g[t + 3] && (g[t + 3] = n.y);
}
function te(e) {
  let n = $[e];
  for (; n.prev.next !== n; ) n = n.next;
  return $[e] = n, n;
}
function ne(e) {
  let n = K[e];
  for (; n.prev.next !== n; ) n = n.next;
  return K[e] = n, n;
}
function Ce(e, n) {
  let t = n;
  const r = e.x, o = e.y;
  let i = -1 / 0, s;
  if (M(e, t)) return t;
  for (let h = 0, y = 0; h < C; h++, y += 4) {
    if (o < g[y + 1] || o > g[y + 3] || g[y] > r || g[y + 2] <= i) continue;
    const x = te(h);
    t = ne(h);
    do {
      if (t.prev.next === t) {
        if (M(e, t.next)) return t.next;
        if (o <= t.y && o >= t.next.y && t.next.y !== t.y) {
          const w = t.x + (o - t.y) * (t.next.x - t.x) / (t.next.y - t.y);
          if (w <= r && w > i && (i = w, s = t.x < t.next.x ? t : t.next, w === r))
            return s;
        }
      }
      t = t.next;
    } while (t !== x);
  }
  if (!s) return null;
  const l = s.x, c = s.y, f = Math.min(o, c), u = Math.max(o, c);
  let a = 1 / 0;
  for (let h = 0, y = 0; h < C; h++, y += 4) {
    if (g[y + 2] < l || g[y] > r || g[y + 3] < f || g[y + 1] > u) continue;
    const x = te(h);
    t = ne(h);
    do {
      if (t.prev.next === t && r >= t.x && t.x >= l && r !== t.x && // skip dead nodes
      Z(o < c ? r : i, o, l, c, o < c ? i : r, o, t.x, t.y)) {
        const w = Math.abs(o - t.y) / (r - t.x);
        (B(t, e) || t.y === o && t.next.y === o && t.next.x > r) && (w < a || w === a && (t.x > s.x || t.x === s.x && Ze(s, t))) && (s = t, a = w);
      }
      t = t.next;
    } while (t !== x);
  }
  return s;
}
function Ze(e, n) {
  return d(e.prev, e, n.prev) < 0 && d(n.next, e, e.next) < 0;
}
const v = [];
let F = [], S = new Uint32Array(0), O = new Uint32Array(0);
const _ = new Uint32Array(256);
function Ge(e, n, t, r) {
  let o = e, i = 0;
  do
    o.z = J(o.x, o.y, n, t, r), v[i++] = o, o = o.next;
  while (o !== e);
  Ve(i);
  let s = null;
  for (let l = 0; l < i; l++) {
    const c = v[l];
    c.prevZ = s, s && (s.nextZ = c), s = c;
  }
  s.nextZ = null;
}
function Ve(e) {
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
  E(e, v, S, F, O, 0), E(e, F, O, v, S, 8), E(e, v, S, F, O, 16), E(e, F, O, v, S, 24);
}
function E(e, n, t, r, o, i) {
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
function J(e, n, t, r, o) {
  return e = (e - t) * o | 0, n = (n - r) * o | 0, e = (e | e << 8) & 16711935, e = (e | e << 4) & 252645135, e = (e | e << 2) & 858993459, e = (e | e << 1) & 1431655765, n = (n | n << 8) & 16711935, n = (n | n << 4) & 252645135, n = (n | n << 2) & 858993459, n = (n | n << 1) & 1431655765, e | n << 1;
}
function ze(e) {
  let n = e, t = e;
  do
    (n.x < t.x || n.x === t.x && n.y < t.y) && (t = n), n = n.next;
  while (n !== e);
  return t;
}
function Z(e, n, t, r, o, i, s, l) {
  return (o - s) * (n - l) >= (e - s) * (i - l) && (e - s) * (r - l) >= (t - s) * (n - l) && (t - s) * (i - l) >= (o - s) * (r - l);
}
function De(e, n) {
  const t = M(e, n) && d(e.prev, e, e.next) > 0 && d(n.prev, n, n.next) > 0;
  return e.next.i !== n.i && (t || B(e, n) && B(n, e) && // // locally visible
  (d(e.prev, e, n.prev) !== 0 || d(e, n.prev, n) !== 0)) && // no opposite-facing sectors
  !Te(e, n) && (t || Ue(e, n));
}
function d(e, n, t) {
  return (n.y - e.y) * (t.x - n.x) - (n.x - e.x) * (t.y - n.y);
}
function M(e, n) {
  return e.x === n.x && e.y === n.y;
}
function fe(e, n, t, r, o = !0) {
  const i = d(e, n, t), s = d(e, n, r), l = d(t, r, e), c = d(t, r, n);
  return (i > 0 && s < 0 || i < 0 && s > 0) && (l > 0 && c < 0 || l < 0 && c > 0) ? !0 : o ? !!(i === 0 && b(e, t, n) || s === 0 && b(e, r, n) || l === 0 && b(t, e, r) || c === 0 && b(t, n, r)) : !1;
}
function b(e, n, t) {
  return n.x <= Math.max(e.x, t.x) && n.x >= Math.min(e.x, t.x) && n.y <= Math.max(e.y, t.y) && n.y >= Math.min(e.y, t.y);
}
function Te(e, n) {
  const t = Math.min(e.x, n.x), r = Math.max(e.x, n.x), o = Math.min(e.y, n.y), i = Math.max(e.y, n.y);
  let s = e;
  do {
    const l = s.next;
    if (s.x > r && l.x > r || s.x < t && l.x < t || s.y > i && l.y > i || s.y < o && l.y < o) {
      s = l;
      continue;
    }
    if (s.i !== e.i && l.i !== e.i && s.i !== n.i && l.i !== n.i && fe(s, l, e, n)) return !0;
    s = l;
  } while (s !== e);
  return !1;
}
function B(e, n) {
  return d(e.prev, e, e.next) < 0 ? d(e, n, e.next) >= 0 && d(e, e.prev, n) >= 0 : d(e, n, e.prev) < 0 || d(e, e.next, n) < 0;
}
function Ue(e, n) {
  let t = e, r = !1;
  const o = (e.x + n.x) / 2, i = (e.y + n.y) / 2;
  do {
    const s = t.next;
    t.y > i != s.y > i && o < (s.x - t.x) * (i - t.y) / (s.y - t.y) + t.x && (r = !r), t = s;
  } while (t !== e);
  return r;
}
function ue(e, n) {
  const t = Q(e.i, e.x, e.y), r = Q(n.i, n.x, n.y), o = e.next, i = n.prev;
  return e.next = n, n.prev = e, t.next = o, o.prev = t, r.next = t, t.prev = r, i.next = r, r.prev = i, r;
}
function re(e, n, t, r) {
  const o = Q(e, n, t);
  return r ? (o.next = r.next, o.prev = r, r.next.prev = o, r.next = o) : (o.prev = o, o.next = o), o;
}
function P(e) {
  e.next.prev = e.prev, e.prev.next = e.next, e.prevZ && (e.prevZ.nextZ = e.nextZ), e.nextZ && (e.nextZ.prevZ = e.prevZ), j && be(e.prev, e.next);
}
function Q(e, n, t) {
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
function Ye(e, n, t, r) {
  let o = 0;
  for (let i = n, s = t - r; i < t; i += r)
    o += (e[s] - e[i]) * (e[i + 1] + e[s + 1]), s = i;
  return o;
}
const G = 3, Re = 0.9, z = "position", xe = "normal", Xe = "-", he = "Face", W = "Shell", je = "SubtendedAngle", ye = 16, Ke = 16777215, oe = 12, $e = 16776960, Y = 6, ae = 0.05, Je = 30, Qe = 1, We = 1, ie = [
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
function H(e) {
  return Array.isArray(e == null ? void 0 : e.features) ? e.features : [e];
}
function ge(e = []) {
  return e.filter((n) => (n == null ? void 0 : n.featureType) !== je);
}
function lt(e) {
  const n = I(
    e.points,
    (t) => (t.place || t.geometry).coordinates.slice()
  );
  return He(Object.values(n)), {
    pointMap: n,
    edgeMap: I(ge(e.edges), (t) => t.topology.references),
    ringMap: I(e.rings),
    faceMap: I(e.faces),
    shellMap: I(e.shells)
  };
}
function I(e = [], n = (t) => t) {
  const t = {};
  return e.forEach((r) => H(r).forEach((o) => {
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
    Array(G).fill(0)
  ).map((t) => t / e.length);
}
function V(e = []) {
  return e.flatMap(H);
}
function ct(e) {
  const n = (t = []) => t.reduce((r, o) => r + H(o).length, 0);
  return {
    points: n(e.points),
    edges: n(ge(e.edges)),
    faces: n(e.faces),
    shells: n(e.shells)
  };
}
function ft(e) {
  const n = V(e.faces || []).some((r) => r.topology.directed_references.length > 1), t = V(e.solids || []).some((r) => r.topology.directed_references.length > 1);
  return n || t;
}
function N(e, n, t) {
  return e.topology.directed_references.map((r) => {
    const [o, i] = n[r.ref];
    return t[r.orientation === "+" ? o : i];
  });
}
function q(e) {
  const n = [0, 0, 0];
  for (let r = 0; r < e.length; r++) {
    const [o, i, s] = e[r], [l, c, f] = e[(r + 1) % e.length];
    n[0] += (i - c) * (s + f), n[1] += (s - f) * (o + l), n[2] += (o - l) * (i + c);
  }
  const t = Math.hypot(...n) || 1;
  return [n[0] / t, n[1] / t, n[2] / t];
}
function et(e, n) {
  const t = new n.Vector3(...e).normalize(), r = Math.abs(t.x) < Re ? new n.Vector3(1, 0, 0) : new n.Vector3(0, 1, 0), o = new n.Vector3().crossVectors(r, t).normalize();
  return { axisU: o, axisV: new n.Vector3().crossVectors(t, o) };
}
function ee(e, n, t, r) {
  const o = [], i = [];
  if (e.length < 3) return { positions: o, normals: i };
  const { axisU: s, axisV: l } = et(t, r), c = new r.Vector3(...e[0]), f = (x) => {
    const w = new r.Vector3(...x).sub(c);
    return [w.dot(s), w.dot(l)];
  }, u = [...e], a = e.flatMap(f), h = [];
  for (const x of n)
    x.length < 3 || (h.push(u.length), u.push(...x), a.push(...x.flatMap(f)));
  const y = _e(a, h.length ? h : null);
  for (let x = 0; x < y.length; x += 3)
    o.push(...u[y[x]], ...u[y[x + 1]], ...u[y[x + 2]]), i.push(...t, ...t, ...t);
  return { positions: o, normals: i };
}
function de(e, n, t) {
  var i;
  const r = n[e];
  if (r && ((i = r.topology) == null ? void 0 : i.type) !== W) return { kind: he, feature: r };
  const o = t[e];
  return o ? { kind: W, feature: o } : null;
}
function D(e, n, t, r = /* @__PURE__ */ new Set(), o = 0) {
  var s;
  return o > ye ? [] : (((s = e == null ? void 0 : e.topology) == null ? void 0 : s.directed_references) || []).flatMap((l) => {
    const c = de(l.ref, n, t);
    return c ? c.kind === he ? [l] : r.has(l.ref) ? [] : D(c.feature, n, t, new Set(r).add(l.ref), o + 1) : [];
  });
}
function tt(e, n, t) {
  const r = /* @__PURE__ */ new Set(), o = (i, s) => {
    var c;
    if (s > ye) return;
    (((c = i == null ? void 0 : i.topology) == null ? void 0 : c.directed_references) || []).forEach((f) => {
      const u = de(f.ref, n, t);
      !u || u.kind !== W || r.has(f.ref) || (r.add(f.ref), o(u.feature, s + 1));
    });
  };
  return e.forEach((i) => o(i, 0)), r;
}
function ut(e, n) {
  const t = tt(V(e.solids || []), n.faceMap, n.shellMap);
  return V(e.shells || []).filter((r) => !t.has(r.id));
}
function nt(e, n, t, r) {
  const o = /* @__PURE__ */ new Set();
  return D(e, n, t).forEach((i) => {
    var s;
    (s = n[i.ref]) == null || s.topology.directed_references.forEach((l) => {
      var c;
      (c = r[l.ref]) == null || c.topology.directed_references.forEach((f) => o.add(f.ref));
    });
  }), o;
}
function k(e, n) {
  const t = new n.BufferGeometry();
  return t.setAttribute(z, new n.BufferAttribute(new Float32Array(e), G)), new n.LineSegments(t, new n.LineBasicMaterial({ color: Ke }));
}
function pe(e) {
  const n = [];
  for (let t = 0; t < e.length; t++) n.push(...e[t], ...e[(t + 1) % e.length]);
  return n;
}
function me(e, n, t, r, o, i, s) {
  const l = [];
  return nt(e, t, n, r).forEach((c) => {
    const f = o[c];
    f && i[f[0]] && i[f[1]] && l.push(...i[f[0]], ...i[f[1]]);
  }), k(l, s);
}
function xt(e, n, t, r, o, i, s) {
  return me(e, n, t, r, o, i, s);
}
function ht(e, n, t, r, o, i, s) {
  return me(e, n, t, r, o, i, s);
}
function yt(e, n, t, r, o) {
  const i = e.topology.directed_references.flatMap((s) => {
    const l = n[s.ref];
    return l ? pe(N(l, t, r)) : [];
  });
  return k(i, o);
}
function at(e, n, t, r) {
  return k(pe(N(e, n, t)), r);
}
function we(e, n, t, r, o, i) {
  var h, y;
  const s = e.topology.directed_references, l = n[(h = s[0]) == null ? void 0 : h.ref];
  if (!l) return null;
  const c = N(l, t, r);
  if (c.length < 3) return null;
  const f = ((y = e.properties) == null ? void 0 : y.normal) || q(c), u = o === Xe ? [-f[0], -f[1], -f[2]] : f, a = s.slice(1).map((x) => n[x.ref]).filter((x) => x != null).map((x) => N(x, t, r)).filter((x) => x.length >= 3);
  return ee(c, a, u, i);
}
function T(e, n, t) {
  const r = new t.BufferGeometry();
  return r.setAttribute(z, new t.BufferAttribute(new Float32Array(e), G)), r.setAttribute(xe, new t.BufferAttribute(new Float32Array(n), G)), r.computeBoundingBox(), r.computeBoundingSphere(), r;
}
function ve(e, n, t, r, o, i) {
  const s = [], l = [];
  let c = 0;
  for (const f of e) {
    const u = o[f.ref];
    if (!u) continue;
    const a = we(u, n, t, r, f.orientation, i);
    a && (s.push(...a.positions), l.push(...a.normals), c++);
  }
  return { geometry: T(s, l, i), faceCount: c };
}
function gt(e, n, t, r, o, i, s) {
  return ve(
    D(e, t, n),
    r,
    o,
    i,
    t,
    s
  );
}
function dt(e, n, t, r, o, i, s) {
  return ve(
    D(e, t, n),
    r,
    o,
    i,
    t,
    s
  );
}
function pt(e, n, t, r, o) {
  const i = we(e, n, t, r, "+", o);
  return i ? T(i.positions, i.normals, o) : null;
}
function mt(e, n, t, r) {
  const o = N(e, n, t);
  if (o.length < 3) return null;
  const i = ee(o, [], q(o), r);
  return T(i.positions, i.normals, r);
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
    const [h, y] = a;
    !t[h] || !t[y] || (o == null && (o = h), i(h, y), i(y, h));
  }), o == null) return [];
  const s = [t[o]], l = /* @__PURE__ */ new Set([o]);
  let c = null, f = o;
  for (let u = 0; u < r.size + 1; u++) {
    const a = Array.from(r.get(f) || []);
    if (!a.length) break;
    const h = a.find((y) => y !== c) || a[0];
    if (h === o && s.length > 2 || l.has(h) && h !== o) break;
    s.push(t[h]), l.add(h), c = f, f = h;
  }
  return s.length > 1 && ot(s[0], s[s.length - 1]) && s.pop(), s;
}
function ot(e, n) {
  return e.length === n.length && e.every((t, r) => t === n[r]);
}
function Se(e = []) {
  return e.length ? Array.isArray(e[0]) ? e : [e] : [];
}
function wt(e, n, t, r) {
  const o = Se(e.topology.references).map((c) => rt(c, n, t)).filter((c) => c.length >= 3);
  if (!o.length) return null;
  const [i, ...s] = o, l = ee(i, s, q(i), r);
  return l.positions.length ? T(l.positions, l.normals, r) : null;
}
function vt(e, n, t, r) {
  const o = new Set(Se(e.topology.references).flat()), i = [];
  return o.forEach((s) => {
    const l = n[s];
    l && t[l[0]] && t[l[1]] && i.push(...t[l[0]], ...t[l[1]]);
  }), k(i, r);
}
function St(e, n, t, r = 1, o = null, i) {
  var l, c, f, u;
  const s = new i.Mesh(t, new i.MeshPhongMaterial({
    color: o ?? ie[n % ie.length],
    side: i.DoubleSide,
    shininess: Je,
    transparent: r < 1,
    opacity: r,
    polygonOffset: !0,
    polygonOffsetFactor: Qe,
    polygonOffsetUnits: We
  }));
  return s.userData.solidName = ((l = e.properties) == null ? void 0 : l.name) || ((f = (c = e.properties) == null ? void 0 : c.appellation) == null ? void 0 : f.label) || ((u = e.properties) == null ? void 0 : u.appellation) || e.id, s;
}
function Ae(e, n, t) {
  const r = new t.SphereGeometry(n, oe, oe), o = new t.MeshBasicMaterial({ color: $e }), i = new t.Group(), s = /* @__PURE__ */ new Set();
  return e.forEach(([l, c, f]) => {
    const u = `${l.toFixed(Y)},${c.toFixed(Y)},${f.toFixed(Y)}`;
    if (s.has(u)) return;
    s.add(u);
    const a = new t.Mesh(r, o);
    a.position.set(l, c, f), i.add(a);
  }), i;
}
function At(e, n) {
  const t = e.boundingSphere.radius * ae, r = e.getAttribute(z), o = [];
  for (let i = 0; i < r.count; i++) o.push([r.getX(i), r.getY(i), r.getZ(i)]);
  return Ae(o, t, n);
}
function Ft(e, n) {
  const t = Object.values(e), r = new n.Box3();
  t.forEach((s) => r.expandByPoint(new n.Vector3(...s)));
  const i = ((r.isEmpty() ? { radius: 1 } : r.getBoundingSphere(new n.Sphere())).radius || 1) * ae;
  return Ae(t, i, n);
}
function Ot(e, n, t) {
  const r = Object.values(e).flatMap(
    ([o, i]) => n[o] && n[i] ? [...n[o], ...n[i]] : []
  );
  return k(r, t);
}
function _t(e, n) {
  const t = e.getAttribute(z);
  for (let r = 0; r < t.count; r++) t.setZ(r, n);
  t.needsUpdate = !0, e.getAttribute(xe) && e.computeVertexNormals(), e.computeBoundingBox(), e.computeBoundingSphere();
}
const it = 0.5, st = 0.3;
function It(e, { color: n, dashed: t } = {}, r) {
  t ? (e.material = new r.LineDashedMaterial({
    color: n ?? e.material.color,
    dashSize: it,
    gapSize: st
  }), e.computeLineDistances()) : n && e.material.color.set(n);
}
export {
  ie as SOLID_COLORS,
  Ot as buildAllEdgeLines,
  pt as buildFaceGeometry,
  yt as buildFaceOutline,
  lt as buildMaps,
  Ft as buildPointMarkers,
  vt as buildPolygonEdgeLines,
  wt as buildPolygonGeometry,
  mt as buildRingGeometry,
  at as buildRingOutline,
  ht as buildShellEdgeLines,
  dt as buildShellGeometry,
  xt as buildSolidEdgeLines,
  gt as buildSolidGeometry,
  St as createSolidMesh,
  At as createVertexMarkers,
  _t as flattenGeometryZ,
  V as getFeatures,
  ut as getOpenShells,
  ct as getTopologyFeatureCounts,
  ft as needsTransparency,
  It as styleOutline
};
