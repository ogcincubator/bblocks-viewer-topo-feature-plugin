var re = Object.defineProperty;
var ne = (r, t, e) => t in r ? re(r, t, { enumerable: !0, configurable: !0, writable: !0, value: e }) : r[t] = e;
var V = (r, t, e) => ne(r, typeof t != "symbol" ? t + "" : t, e);
function oe(r, t) {
  if (!r || !t) return !1;
  if (r === "*/*" || r === t) return !0;
  const [e, i] = r.split("/"), [s, n] = t.split("/");
  return e === s && (i === "*" || i === n);
}
const le = ["points", "edges", "rings", "faces", "shells", "solids"];
function ae(r) {
  return Array.isArray(r == null ? void 0 : r.features) || (r == null ? void 0 : r.type) === "Feature";
}
function ce(r) {
  return Array.isArray(r == null ? void 0 : r.features) ? r.features : [r];
}
function he(r) {
  return !r || typeof r != "object" || Array.isArray(r) ? !1 : le.some((t) => Array.isArray(r[t]) && r[t].some(ae));
}
function de(r) {
  return Array.isArray(r == null ? void 0 : r.points) ? r.points.some(
    (t) => ce(t).some((e) => {
      var s;
      const i = (s = (e == null ? void 0 : e.place) || (e == null ? void 0 : e.geometry)) == null ? void 0 : s.coordinates;
      return Array.isArray(i) && i.length >= 3;
    })
  ) : !1;
}
function pe(r) {
  return he(r) && de(r);
}
const q = ["application/geo+json", "application/json", "application/ld+json"], H = "0.184.0", Y = () => import(
  /* @vite-ignore */
  `https://esm.sh/three@${H}`
), _e = () => import(
  /* @vite-ignore */
  `https://esm.sh/three@${H}/examples/jsm/controls/OrbitControls.js`
);
function ue(r) {
  return r != null && r.depResolver ? r.depResolver.resolve({
    name: "three",
    range: `^${H}`,
    version: H,
    load: Y
  }) : Y();
}
const A = 60, Z = 1e-3, K = 1e4, ge = 1e-6, x = "perspective", E = "orthographic", fe = 400, S = 1, J = 0.85, me = 0.55, be = 0.35, ye = [
  { kind: "parcel", icon: "parcels", label: "parcels" },
  { kind: "surface", icon: "surfaces", label: "surfaces" },
  { kind: "solid", icon: "solids", label: "solids" }
], ve = { parcel: "Parcels", surface: "Surfaces", solid: "Solids", face: "Faces", ring: "Rings" }, xe = "width: 26px; height: 26px; border: none; border-radius: 4px; cursor: pointer; display: flex; align-items: center; justify-content: center; padding: 0; box-shadow: 0 1px 3px rgba(0,0,0,0.4);";
function we(r) {
  return r ? "background: #1976d2; color: #fff;" : "background: #fff; color: #333;";
}
const Me = {
  reset: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9V4h5"/><path d="M20 9V4h-5"/><path d="M4 15v5h5"/><path d="M20 15v5h-5"/></svg>',
  grid: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="1"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/></svg>',
  wireframe: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M12 2 3 7v10l9 5 9-5V7z"/><path d="M3 7l9 5 9-5"/><path d="M12 12v10"/></svg>',
  edges: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="5" cy="19" r="2" fill="currentColor" stroke="none"/><circle cx="19" cy="5" r="2" fill="currentColor" stroke="none"/><line x1="6.5" y1="17.5" x2="17.5" y2="6.5"/></svg>',
  vertices: '<svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" stroke="none"><circle cx="5" cy="5" r="1.6"/><circle cx="12" cy="5" r="1.6"/><circle cx="19" cy="5" r="1.6"/><circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/><circle cx="5" cy="19" r="1.6"/><circle cx="12" cy="19" r="1.6"/><circle cx="19" cy="19" r="1.6"/></svg>',
  parcels: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M12 3 20 9l-3 10H7L4 9Z"/></svg>',
  surfaces: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M12 3 21 8l-9 5-9-5Z"/></svg>',
  solids: '<svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" stroke="none"><path d="M12 2 21 7v10l-9 5-9-5V7z" opacity="0.35"/><path d="M12 2 21 7 12 12 3 7z"/></svg>',
  projection: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M7 4h10l4 16H3Z"/></svg>',
  fullscreen: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3H5a2 2 0 0 0-2 2v4"/><path d="M15 3h4a2 2 0 0 1 2 2v4"/><path d="M9 21H5a2 2 0 0 1-2-2v-4"/><path d="M15 21h4a2 2 0 0 0 2-2v-4"/></svg>',
  fullscreenExit: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9V5a2 2 0 0 1 2-2h4"/><path d="M20 9V5a2 2 0 0 0-2-2h-4"/><path d="M4 15v4a2 2 0 0 0 2 2h4"/><path d="M20 15v4a2 2 0 0 1-2 2h-4"/></svg>'
};
class F {
  /**
   * @param {import('@ogc/bblocks-viewer-plugin-types').ViewPluginCandidate[]} candidates
   * @param {import('@ogc/bblocks-viewer-plugin-types').ViewPluginContext} [context]
   */
  constructor(t, e = {}) {
    this.candidates = t, this._context = e, this._candidate = void 0, this._el = null, this._THREE = null, this._renderer = null, this._perspectiveCamera = null, this._orthographicCamera = null, this._camera = null, this._projection = x, this._viewWidth = 0, this._viewHeight = 0, this._controls = null, this._gridHelper = null, this._resizeObserver = null, this._fullscreenChangeHandler = null, this._animating = !1, this._animFrameId = null, this._solidMeshes = [], this._solidEdges = [], this._solidVertices = [], this._renderables = [], this._initialCameraPosition = null, this._initialCameraTarget = null, this._initialCameraZoom = 1, this._wireframe = !1, this._showGrid = !1, this._showEdges = !0, this._showVertices = !1, this._fullscreenPanelEl = null, this._kindToggleButtons = [];
  }
  matches() {
    return !!this._pickCandidate();
  }
  _pickCandidate() {
    if (this._candidate !== void 0) return this._candidate;
    const t = this.candidates.find((e) => {
      if (!e.type || !e.content || !q.some((i) => oe(i, e.type))) return !1;
      try {
        return pe(JSON.parse(e.content));
      } catch {
        return !1;
      }
    });
    return this._candidate = t ?? null, this._candidate;
  }
  render(t) {
    this._el = t, t.style.position = "relative", this._mount(t).catch((e) => {
      console.error("TopoFeaturePlugin: init failed", e), this._el === t && this._showError(t, `Failed to render this topology view (${e.message}).`);
    });
  }
  // Tears down whatever got built so far (via destroy(), which is safe to call on a
  // partially-initialized instance — every field it touches is null-guarded) and replaces el's
  // content with a plain-DOM error message. Used both for _mount() failures (caught above) and
  // for errors thrown from inside the animate() render loop below, which is the harder case: it
  // runs on its own requestAnimationFrame stack, outside any promise chain the host or this
  // plugin's own render() could catch, so this plugin must catch and surface it itself.
  _showError(t, e) {
    this.destroy(t);
    const i = document.createElement("div");
    i.style.cssText = "display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; padding: 16px; text-align: center; color: #b00020; font: 14px/1.4 sans-serif;";
    const s = document.createElement("div");
    s.textContent = e;
    const n = document.createElement("div");
    n.style.cssText = "margin-top: 12px;", n.textContent = "See the browser console for details.", i.append(s, n), t.appendChild(i);
  }
  async _mount(t) {
    const e = this._pickCandidate();
    if (!e) return;
    const i = JSON.parse(e.content), [s, { OrbitControls: n }] = await Promise.all([
      ue(this._context),
      _e()
    ]);
    if (this._el !== t) return;
    this._THREE = s;
    const l = document.createElement("div");
    l.style.cssText = "height: 100%; width: 100%;", t.appendChild(l);
    const d = l.clientWidth || 600, h = l.clientHeight || 400;
    this._viewWidth = d, this._viewHeight = h;
    const p = new s.Scene();
    p.background = new s.Color(11383217);
    const f = new s.PerspectiveCamera(A, d / h, Z, K);
    f.up.set(0, 0, 1), this._perspectiveCamera = f;
    const c = new s.OrthographicCamera(
      -(d / h),
      d / h,
      1,
      -1,
      Z,
      K
    );
    c.up.set(0, 0, 1), this._orthographicCamera = c, this._camera = f, this._projection = x;
    const u = new s.WebGLRenderer({ antialias: !0 });
    u.setPixelRatio(window.devicePixelRatio), u.setSize(d, h), l.appendChild(u.domElement), this._renderer = u;
    const m = new n(this._camera, u.domElement);
    m.enableDamping = !0, m.dampingFactor = 0.05, this._controls = m, p.add(new s.AmbientLight(16777215, 0.5));
    const C = new s.DirectionalLight(16777215, 0.8);
    C.position.set(100, 100, 100), p.add(C);
    const k = new s.DirectionalLight(16777215, 0.3);
    k.position.set(-100, -100, -100), p.add(k);
    const w = new s.DirectionalLight(16777215, 0.3);
    if (w.position.set(0, -100, 0), p.add(w), this._gridHelper = new s.GridHelper(100, 20, 4473924, 2236962), this._gridHelper.rotation.x = Math.PI / 2, this._gridHelper.visible = this._showGrid, p.add(this._gridHelper), p.add(new s.AxesHelper(1)), await this._buildScene(p, s, i), this._el !== t) return;
    this._fitCamera(s), this._buildControls(t), this._resizeObserver = new ResizeObserver(() => {
      if (!this._renderer || !l.isConnected) return;
      const b = l.clientWidth, y = l.clientHeight;
      !b || !y || (this._viewWidth = b, this._viewHeight = y, this._perspectiveCamera.aspect = b / y, this._perspectiveCamera.updateProjectionMatrix(), this._setOrthographicHalfHeight(this._orthographicCamera.top || 1), u.setSize(b, y), this._applyViewMode());
    }), this._resizeObserver.observe(l), this._animating = !0;
    const P = () => {
      if (this._animating) {
        this._animFrameId = requestAnimationFrame(P);
        try {
          m.update(), u.render(p, this._camera);
        } catch (b) {
          console.error("TopoFeaturePlugin: render loop failed", b), this._showError(t, `An error occurred while rendering this topology view (${b.message}).`);
        }
      }
    };
    P();
  }
  // Renders whatever geometry the data actually contains. Solids, open shells (surfaces not
  // already drawn as part of a solid — see getOpenShells) and Polygon-topology parcels render
  // together whenever any is present, each its own color-grouped tier. Only when none of the
  // three is present does rendering fall back to the older single-tier chain — a standalone Face
  // or Ring ("simple polygon"), bare Edges, or bare Points — matching how leaner topo-feature
  // examples (not solids/parcels at all) are actually authored.
  async _buildScene(t, e, i) {
    const {
      buildMaps: s,
      buildSolidGeometry: n,
      buildSolidEdgeLines: l,
      buildShellGeometry: d,
      buildShellEdgeLines: h,
      buildFaceGeometry: p,
      buildFaceOutline: f,
      buildRingGeometry: c,
      buildRingOutline: u,
      buildPolygonGeometry: m,
      buildPolygonEdgeLines: C,
      buildAllEdgeLines: k,
      buildPointMarkers: w,
      createSolidMesh: P,
      createVertexMarkers: b,
      getFeatures: y,
      getOpenShells: Q,
      needsTransparency: R
    } = await import("./topo-geometry-kZm0irTw.js"), o = s(i), j = y(i.solids || []), L = Q(i, o), z = y(i.parcels || []), I = y(i.faces || []), B = y(i.rings || []), X = Object.keys(o.edgeMap).length > 0, ee = Object.keys(o.pointMap).length > 0;
    let te = 0;
    const M = (a, _, g, v, ie) => {
      var G, D, W, $, U;
      const T = P(a, te++, _, v, e), O = b(_, e);
      T.material.wireframe = this._wireframe, t.add(T, g, O), this._solidMeshes.push(T), this._solidEdges.push(g), this._solidVertices.push(O);
      const se = ((D = (G = a.properties) == null ? void 0 : G.appellation) == null ? void 0 : D.label) || ((W = a.properties) == null ? void 0 : W.appellation) || (($ = a.properties) == null ? void 0 : $.description) || ((U = a.properties) == null ? void 0 : U.name) || a.id, N = { mesh: T, edges: g, vertices: O, kind: ie, label: String(se), visible: !0 };
      this._renderables.push(N), this._applyRenderableVisibility(N);
    };
    if (j.length > 0 || L.length > 0 || z.length > 0) {
      if (j.length) {
        const a = R(i) ? J : S;
        j.forEach((_) => {
          const { geometry: g } = n(_, o.shellMap, o.faceMap, o.ringMap, o.edgeMap, o.pointMap, e), v = l(_, o.shellMap, o.faceMap, o.ringMap, o.edgeMap, o.pointMap, e);
          M(_, g, v, a, "solid");
        });
      }
      L.forEach((a) => {
        const { geometry: _, faceCount: g } = d(a, o.shellMap, o.faceMap, o.ringMap, o.edgeMap, o.pointMap, e);
        if (!g) return;
        const v = h(a, o.shellMap, o.faceMap, o.ringMap, o.edgeMap, o.pointMap, e);
        M(a, _, v, me, "surface");
      }), z.forEach((a) => {
        const _ = m(a, o.edgeMap, o.pointMap, e);
        if (!_) return;
        const g = C(a, o.edgeMap, o.pointMap, e);
        M(a, _, g, be, "parcel");
      });
      return;
    }
    if (I.length) {
      const a = R(i) ? J : S;
      I.forEach((_) => {
        const g = p(_, o.ringMap, o.edgeMap, o.pointMap, e);
        if (!g) return;
        const v = f(_, o.ringMap, o.edgeMap, o.pointMap, e);
        M(_, g, v, a, "face");
      });
    } else if (B.length)
      B.forEach((a) => {
        const _ = c(a, o.edgeMap, o.pointMap, e);
        if (!_) return;
        const g = u(a, o.edgeMap, o.pointMap, e);
        M(a, _, g, S, "ring");
      });
    else if (X) {
      this._showVertices = !0;
      const a = k(o.edgeMap, o.pointMap, e), _ = w(o.pointMap, e);
      a.visible = this._showEdges, _.visible = this._showVertices, t.add(a, _), this._solidEdges.push(a), this._solidVertices.push(_);
    } else if (ee) {
      this._showVertices = !0;
      const a = w(o.pointMap, e);
      a.visible = !0, t.add(a), this._solidVertices.push(a);
    }
  }
  _applyRenderableVisibility(t) {
    t.mesh.visible = t.visible, t.edges.visible = t.visible && this._showEdges, t.vertices.visible = t.visible && this._showVertices;
  }
  _kindAllVisible(t) {
    const e = this._renderables.filter((i) => i.kind === t);
    return e.length > 0 && e.every((i) => i.visible);
  }
  _toggleKind(t) {
    const e = !this._kindAllVisible(t);
    this._renderables.filter((i) => i.kind === t).forEach((i) => {
      i.visible = e, this._applyRenderableVisibility(i);
    }), this._refreshFullscreenPanel();
  }
  _fitCamera(t) {
    const e = [...this._solidMeshes, ...this._solidEdges, ...this._solidVertices];
    if (!e.length) return;
    const i = new t.Box3();
    if (e.forEach((p) => i.expandByObject(p)), i.isEmpty()) return;
    const s = i.getCenter(new t.Vector3()), n = i.getSize(new t.Vector3()), d = Math.max(n.x, n.y, n.z) * 2, h = this._camera;
    h.position.set(s.x - d * 0.7, s.y - d * 0.7, s.z + d * 0.7), h.near = d * 1e-3, h.far = d * 100, h.zoom = 1, h.updateProjectionMatrix(), this._controls.target.copy(s), this._syncProjection(), this._controls.update(), this._initialCameraPosition = h.position.clone(), this._initialCameraTarget = this._controls.target.clone(), this._initialCameraZoom = h.zoom;
  }
  // ─── Projection (perspective ⇄ orthographic) ─────────────────────────────────
  _halfHeightAtDistance(t) {
    return t * Math.tan(this._THREE.MathUtils.degToRad(A / 2));
  }
  _setOrthographicHalfHeight(t) {
    const e = Math.max(t, ge), i = e * (this._viewWidth / this._viewHeight), s = this._orthographicCamera;
    s.top = e, s.bottom = -e, s.left = -i, s.right = i, s.updateProjectionMatrix();
  }
  // Rebuilds the orthographic frustum from the camera's current distance to the controls target.
  // A no-op while the perspective camera is active, since _setProjection() derives the frustum at
  // switch time instead. Call after moving the camera/target (fit or reset).
  _syncProjection() {
    if (this._projection !== E) return;
    const t = this._orthographicCamera.position.distanceTo(this._controls.target);
    this._setOrthographicHalfHeight(this._halfHeightAtDistance(t));
  }
  // Switches between perspective and orthographic projection, preserving the framing: going to
  // orthographic, the frustum is sized to the perspective view volume at the target plane; coming
  // back, any accumulated orthographic zoom is converted into a camera distance that reproduces
  // the same view volume, so repeated toggling is stable rather than drifting.
  _setProjection(t) {
    if (t === this._projection || !this._camera) return;
    const e = this._THREE, i = this._perspectiveCamera, s = this._orthographicCamera, n = this._controls;
    if (t === E) {
      const l = i.position.distanceTo(n.target);
      s.position.copy(i.position), s.quaternion.copy(i.quaternion), s.near = i.near, s.far = i.far, s.zoom = 1, this._camera = s, this._projection = E, this._setOrthographicHalfHeight(this._halfHeightAtDistance(l));
    } else {
      const d = s.top / s.zoom / Math.tan(e.MathUtils.degToRad(A / 2)), h = new e.Vector3().subVectors(s.position, n.target);
      i.quaternion.copy(s.quaternion), i.near = s.near, i.far = s.far, i.zoom = 1, h.lengthSq() > 0 && i.position.copy(n.target).addScaledVector(h.normalize(), d), i.updateProjectionMatrix(), this._camera = i, this._projection = x;
    }
    n.object = this._camera, n.update();
  }
  _projectionTitle() {
    return this._projection === x ? "Switch to orthographic view" : "Switch to perspective view";
  }
  // ─── Fullscreen ───────────────────────────────────────────────────────────────
  _isFullscreen() {
    return document.fullscreenElement === this._el;
  }
  _toggleFullscreen() {
    var t, e, i;
    this._isFullscreen() ? (t = document.exitFullscreen) == null || t.call(document) : (i = (e = this._el) == null ? void 0 : e.requestFullscreen) == null || i.call(e);
  }
  // ─── Controls ─────────────────────────────────────────────────────────────────
  _buildControls(t) {
    const e = document.createElement("div");
    e.style.cssText = "position: absolute; bottom: 8px; left: 8px; display: flex; flex-direction: column; gap: 4px; z-index: 10;";
    const i = (n, l, d, h, p, f) => {
      const c = document.createElement("button");
      c.type = "button";
      const u = () => {
        c.title = f ? f() : l, c.innerHTML = Me[p ? p() : n], c.style.cssText = xe + we(h == null ? void 0 : h());
      };
      return u(), c.addEventListener("click", () => {
        d(), u();
      }), e.appendChild(c), { btn: c, refresh: u };
    };
    i("reset", "Reset camera", () => this._resetCamera()), i("grid", "Toggle grid", () => {
      this._showGrid = !this._showGrid, this._gridHelper.visible = this._showGrid;
    }, () => this._showGrid), i("wireframe", "Toggle wireframe", () => {
      this._wireframe = !this._wireframe, this._solidMeshes.forEach((n) => {
        n.material.wireframe = this._wireframe;
      });
    }, () => this._wireframe), i("edges", "Toggle edges", () => {
      this._showEdges = !this._showEdges, this._renderables.forEach((n) => this._applyRenderableVisibility(n)), this._solidEdges.forEach((n) => {
        this._renderables.some((l) => l.edges === n) || (n.visible = this._showEdges);
      });
    }, () => this._showEdges), i("vertices", "Toggle vertices", () => {
      this._showVertices = !this._showVertices, this._renderables.forEach((n) => this._applyRenderableVisibility(n)), this._solidVertices.forEach((n) => {
        this._renderables.some((l) => l.vertices === n) || (n.visible = this._showVertices);
      });
    }, () => this._showVertices), this._kindToggleButtons = ye.filter(({ kind: n }) => this._renderables.some((l) => l.kind === n)).map(
      ({ kind: n, icon: l, label: d }) => i(l, `Toggle ${d}`, () => this._toggleKind(n), () => this._kindAllVisible(n))
    ), i(
      "projection",
      this._projectionTitle(),
      () => this._setProjection(this._projection === x ? E : x),
      () => this._projection === E,
      void 0,
      () => this._projectionTitle()
    );
    const s = i(
      "fullscreen",
      "Fullscreen",
      () => this._toggleFullscreen(),
      () => this._isFullscreen(),
      () => this._isFullscreen() ? "fullscreenExit" : "fullscreen",
      () => this._isFullscreen() ? "Exit fullscreen" : "Fullscreen"
    );
    t.appendChild(e), this._controlsEl = e, this._buildFullscreenPanel(t), this._applyViewMode(), this._fullscreenChangeHandler = () => {
      this._el === t && (s.refresh(), this._applyViewMode());
    }, document.addEventListener("fullscreenchange", this._fullscreenChangeHandler);
  }
  // Swaps between the compact inline toolbar (per-kind toggle icons) and the collapsible
  // per-type/per-instance panel, based on how much space the host has actually given this
  // container — not on which specific control (this plugin's own fullscreen button, or the host's
  // own "expand" affordance) got it there. The host resizes this container the same way for both,
  // so treating them identically means a user who expands via the host's own UI gets the richer
  // panel immediately, without an extra, redundant click on this plugin's own fullscreen button.
  _applyViewMode() {
    if (!this._kindToggleButtons || !this._fullscreenPanelEl) return;
    const t = this._isExpandedView();
    this._kindToggleButtons.forEach(({ btn: e }) => {
      e.style.display = t ? "none" : "";
    }), this._fullscreenPanelEl.style.display = t ? "block" : "none";
  }
  _isExpandedView() {
    return !!this._el && this._el.clientHeight >= fe;
  }
  // Collapsible per-type/per-instance visibility panel, shown whenever the container is large
  // (see _applyViewMode()) — the inline toolbar's per-kind icons are a coarser "toggle every
  // instance of this type" affordance meant for the compact embedded view; this panel adds the
  // ability to override one specific instance without hiding the rest of its type.
  _buildFullscreenPanel(t) {
    const e = document.createElement("div");
    e.style.cssText = "position: absolute; top: 8px; right: 8px; max-width: 260px; max-height: calc(100% - 16px); overflow-y: auto; background: rgba(255,255,255,0.95); border-radius: 6px; padding: 8px; font: 12px/1.4 sans-serif; color: #222; box-shadow: 0 1px 3px rgba(0,0,0,0.4); display: none; z-index: 10;", t.appendChild(e), this._fullscreenPanelEl = e, this._refreshFullscreenPanel();
  }
  _refreshFullscreenPanel() {
    const t = this._fullscreenPanelEl;
    if (!t) return;
    t.innerHTML = "", [...new Set(this._renderables.map((i) => i.kind))].forEach((i) => {
      const s = this._renderables.filter((c) => c.kind === i), n = s.every((c) => c.visible), l = s.every((c) => !c.visible), d = document.createElement("details");
      d.open = !0, d.style.cssText = "margin-bottom: 6px;";
      const h = document.createElement("summary");
      h.style.cssText = "cursor: pointer; display: flex; align-items: center; gap: 6px;";
      const p = document.createElement("input");
      p.type = "checkbox", p.checked = n, p.indeterminate = !n && !l, p.addEventListener("click", (c) => c.stopPropagation()), p.addEventListener("change", () => {
        s.forEach((c) => {
          c.visible = p.checked, this._applyRenderableVisibility(c);
        }), this._refreshFullscreenPanel();
      }), h.append(p, document.createTextNode(`${ve[i] || i} (${s.length})`)), d.appendChild(h);
      const f = document.createElement("div");
      f.style.cssText = "padding-left: 20px; margin-top: 4px;", s.forEach((c) => {
        const u = document.createElement("label");
        u.style.cssText = "display: block; margin: 2px 0; cursor: pointer;";
        const m = document.createElement("input");
        m.type = "checkbox", m.checked = c.visible, m.addEventListener("change", () => {
          c.visible = m.checked, this._applyRenderableVisibility(c), this._refreshFullscreenPanel();
        }), u.append(m, document.createTextNode(` ${c.label}`)), f.appendChild(u);
      }), d.appendChild(f), t.appendChild(d);
    });
  }
  _resetCamera() {
    !this._initialCameraPosition || !this._camera || !this._controls || (this._camera.position.copy(this._initialCameraPosition), this._camera.zoom = this._initialCameraZoom, this._camera.updateProjectionMatrix(), this._controls.target.copy(this._initialCameraTarget), this._syncProjection(), this._controls.update());
  }
  destroy(t) {
    this._animating = !1, this._animFrameId && cancelAnimationFrame(this._animFrameId), this._animFrameId = null, this._resizeObserver && (this._resizeObserver.disconnect(), this._resizeObserver = null), this._fullscreenChangeHandler && (document.removeEventListener("fullscreenchange", this._fullscreenChangeHandler), this._fullscreenChangeHandler = null), this._renderer && (this._renderer.dispose(), this._renderer.domElement.remove(), this._renderer = null), this._solidMeshes.forEach((e) => {
      var i, s;
      (i = e.geometry) == null || i.dispose(), (s = e.material) == null || s.dispose();
    }), this._solidEdges.forEach((e) => {
      var i, s;
      (i = e.geometry) == null || i.dispose(), (s = e.material) == null || s.dispose();
    }), this._solidVertices.forEach((e) => {
      var i;
      (i = e.children) == null || i.forEach((s) => {
        var n, l;
        (n = s.geometry) == null || n.dispose(), (l = s.material) == null || l.dispose();
      });
    }), this._solidMeshes = [], this._solidEdges = [], this._solidVertices = [], this._renderables = [], this._kindToggleButtons = [], this._fullscreenPanelEl = null, this._perspectiveCamera = null, this._orthographicCamera = null, this._camera = null, this._controls = null, this._gridHelper = null, this._THREE = null, this._el === t && (this._el = null), t.innerHTML = "";
  }
}
V(F, "supportedTypes", q), V(F, "viewName", "Topo view"), V(F, "icon", "mdi-vector-polygon");
export {
  F as TopoFeaturePlugin
};
