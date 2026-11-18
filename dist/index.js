var ce = Object.defineProperty;
var he = (r, e, t) => e in r ? ce(r, e, { enumerable: !0, configurable: !0, writable: !0, value: t }) : r[e] = t;
var S = (r, e, t) => he(r, typeof e != "symbol" ? e + "" : e, t);
function de(r, e) {
  if (!r || !e) return !1;
  if (r === "*/*" || r === e) return !0;
  const [t, i] = r.split("/"), [s, n] = e.split("/");
  return t === s && (i === "*" || i === n);
}
const pe = ["points", "edges", "rings", "faces", "shells", "solids"];
function ue(r) {
  return Array.isArray(r == null ? void 0 : r.features) || (r == null ? void 0 : r.type) === "Feature";
}
function _e(r) {
  return Array.isArray(r == null ? void 0 : r.features) ? r.features : [r];
}
function ge(r) {
  return !r || typeof r != "object" || Array.isArray(r) ? !1 : pe.some((e) => Array.isArray(r[e]) && r[e].some(ue));
}
function fe(r) {
  return Array.isArray(r == null ? void 0 : r.points) ? r.points.some(
    (e) => _e(e).some((t) => {
      var s;
      const i = (s = (t == null ? void 0 : t.place) || (t == null ? void 0 : t.geometry)) == null ? void 0 : s.coordinates;
      return Array.isArray(i) && i.length >= 3;
    })
  ) : !1;
}
function me(r) {
  return ge(r) && fe(r);
}
const W = ["application/geo+json", "application/json", "application/ld+json"], H = "0.184.0", Z = () => import(
  /* @vite-ignore */
  `https://esm.sh/three@${H}`
), be = () => import(
  /* @vite-ignore */
  `https://esm.sh/three@${H}/examples/jsm/controls/OrbitControls.js`
);
function ye(r) {
  return r != null && r.depResolver ? r.depResolver.resolve({
    name: "three",
    range: `^${H}`,
    version: H,
    load: Z
  }) : Z();
}
const F = 60, q = 1e-3, Y = 1e4, xe = 1e-6, M = "perspective", P = "orthographic", ve = 400, j = 1, we = 0.85, Ce = 0.55, Me = 0.35, L = {
  parcel: { icon: "parcels", inlineLabel: "parcels", panelLabel: "Parcels" },
  surface: { icon: "surfaces", inlineLabel: "surfaces", panelLabel: "Surfaces" },
  solid: { icon: "solids", inlineLabel: "solids", panelLabel: "Solids" },
  face: { panelLabel: "Faces" },
  ring: { panelLabel: "Rings" }
}, Ee = ["parcel", "surface", "solid"];
function J(r) {
  const e = String(r).replace(/[-_]+/g, " ").trim();
  return e ? e.charAt(0).toUpperCase() + e.slice(1) : String(r);
}
const ke = "width: 26px; height: 26px; border: none; border-radius: 4px; cursor: pointer; display: flex; align-items: center; justify-content: center; padding: 0; box-shadow: 0 1px 3px rgba(0,0,0,0.4);";
function Te(r) {
  return r ? "background: #1976d2; color: #fff;" : "background: #fff; color: #333;";
}
const Pe = {
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
class R {
  /**
   * @param {import('@ogc/bblocks-viewer-plugin-types').ViewPluginCandidate[]} candidates
   * @param {import('@ogc/bblocks-viewer-plugin-types').ViewPluginContext} [context]
   */
  constructor(e, t = {}) {
    this.candidates = e, this._context = t, this._candidate = void 0, this._el = null, this._THREE = null, this._renderer = null, this._perspectiveCamera = null, this._orthographicCamera = null, this._camera = null, this._projection = M, this._viewWidth = 0, this._viewHeight = 0, this._controls = null, this._gridHelper = null, this._resizeObserver = null, this._fullscreenChangeHandler = null, this._animating = !1, this._animFrameId = null, this._solidMeshes = [], this._solidEdges = [], this._solidVertices = [], this._renderables = [], this._config = null, this._initialCameraPosition = null, this._initialCameraTarget = null, this._initialCameraZoom = 1, this._wireframe = !1, this._showGrid = !1, this._showEdges = !0, this._showVertices = !1, this._fullscreenPanelEl = null, this._kindToggleButtons = [];
  }
  matches() {
    return !!this._pickCandidate();
  }
  _pickCandidate() {
    if (this._candidate !== void 0) return this._candidate;
    const e = this.candidates.find((t) => {
      if (!t.type || !t.content || !W.some((i) => de(i, t.type))) return !1;
      try {
        return me(JSON.parse(t.content));
      } catch {
        return !1;
      }
    });
    return this._candidate = e ?? null, this._candidate;
  }
  render(e) {
    this._el = e, e.style.position = "relative", this._mount(e).catch((t) => {
      console.error("TopoFeaturePlugin: init failed", t), this._el === e && this._showError(e, `Failed to render this topology view (${t.message}).`);
    });
  }
  // Tears down whatever got built so far (via destroy(), which is safe to call on a
  // partially-initialized instance — every field it touches is null-guarded) and replaces el's
  // content with a plain-DOM error message. Used both for _mount() failures (caught above) and
  // for errors thrown from inside the animate() render loop below, which is the harder case: it
  // runs on its own requestAnimationFrame stack, outside any promise chain the host or this
  // plugin's own render() could catch, so this plugin must catch and surface it itself.
  _showError(e, t) {
    this.destroy(e);
    const i = document.createElement("div");
    i.style.cssText = "display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; padding: 16px; text-align: center; color: #b00020; font: 14px/1.4 sans-serif;";
    const s = document.createElement("div");
    s.textContent = t;
    const n = document.createElement("div");
    n.style.cssText = "margin-top: 12px;", n.textContent = "See the browser console for details.", i.append(s, n), e.appendChild(i);
  }
  async _mount(e) {
    const t = this._pickCandidate();
    if (!t) return;
    const i = JSON.parse(t.content), [s, { OrbitControls: n }] = await Promise.all([
      ye(this._context),
      be()
    ]);
    if (this._el !== e) return;
    this._THREE = s;
    const l = document.createElement("div");
    l.style.cssText = "height: 100%; width: 100%;", e.appendChild(l);
    const h = l.clientWidth || 600, c = l.clientHeight || 400;
    this._viewWidth = h, this._viewHeight = c;
    const d = new s.Scene();
    d.background = new s.Color(11383217);
    const _ = new s.PerspectiveCamera(F, h / c, q, Y);
    _.up.set(0, 0, 1), this._perspectiveCamera = _;
    const p = new s.OrthographicCamera(
      -(h / c),
      h / c,
      1,
      -1,
      q,
      Y
    );
    p.up.set(0, 0, 1), this._orthographicCamera = p, this._camera = _, this._projection = M;
    const u = new s.WebGLRenderer({ antialias: !0 });
    u.setPixelRatio(window.devicePixelRatio), u.setSize(h, c), l.appendChild(u.domElement), this._renderer = u;
    const x = new n(this._camera, u.domElement);
    x.enableDamping = !0, x.dampingFactor = 0.05, this._controls = x, d.add(new s.AmbientLight(16777215, 0.5));
    const f = new s.DirectionalLight(16777215, 0.8);
    f.position.set(100, 100, 100), d.add(f);
    const v = new s.DirectionalLight(16777215, 0.3);
    v.position.set(-100, -100, -100), d.add(v);
    const m = new s.DirectionalLight(16777215, 0.3);
    if (m.position.set(0, -100, 0), d.add(m), this._gridHelper = new s.GridHelper(100, 20, 4473924, 2236962), this._gridHelper.rotation.x = Math.PI / 2, this._gridHelper.visible = this._showGrid, d.add(this._gridHelper), d.add(new s.AxesHelper(1)), await this._buildScene(d, s, i), this._el !== e) return;
    this._fitCamera(s), this._buildControls(e), this._resizeObserver = new ResizeObserver(() => {
      if (!this._renderer || !l.isConnected) return;
      const g = l.clientWidth, b = l.clientHeight;
      !g || !b || (this._viewWidth = g, this._viewHeight = b, this._perspectiveCamera.aspect = g / b, this._perspectiveCamera.updateProjectionMatrix(), this._setOrthographicHalfHeight(this._orthographicCamera.top || 1), u.setSize(g, b), this._applyViewMode());
    }), this._resizeObserver.observe(l), this._animating = !0;
    const w = () => {
      if (this._animating) {
        this._animFrameId = requestAnimationFrame(w);
        try {
          x.update(), u.render(d, this._camera);
        } catch (g) {
          console.error("TopoFeaturePlugin: render loop failed", g), this._showError(e, `An error occurred while rendering this topology view (${g.message}).`);
        }
      }
    };
    w();
  }
  // Renders whatever geometry the data actually contains. Solids, open shells (surfaces not
  // already drawn as part of a solid — see getOpenShells) and Polygon-topology parcels render
  // together whenever any is present, each its own color-grouped tier. Only when none of the
  // three is present does rendering fall back to the older single-tier chain — a standalone Face
  // or Ring ("simple polygon"), bare Edges, or bare Points — matching how leaner topo-feature
  // examples (not solids/parcels at all) are actually authored.
  async _buildScene(e, t, i) {
    const [
      {
        buildMaps: s,
        buildSolidGeometry: n,
        buildSolidEdgeLines: l,
        buildShellGeometry: h,
        buildShellEdgeLines: c,
        buildFaceGeometry: d,
        buildFaceOutline: _,
        buildRingGeometry: p,
        buildRingOutline: u,
        buildPolygonGeometry: x,
        buildPolygonEdgeLines: f,
        buildAllEdgeLines: v,
        buildPointMarkers: m,
        createSolidMesh: w,
        createVertexMarkers: g,
        getFeatures: b,
        getOpenShells: K,
        needsTransparency: Q,
        flattenGeometryZ: z,
        styleOutline: X
      },
      { classifyFeatures: ee, resolveFlattenZ: te },
      { buildDefaultConfig: ie },
      { loadViewerConfig: se }
    ] = await Promise.all([
      import("./topo-geometry-DvGpLqlC.js"),
      import("./rules-DHUzmpY8.js"),
      import("./default-config-hI9wMdku.js"),
      import("./resolve-config-Gdw1GGxr.js")
    ]), o = s(i), I = K(i, o), N = Q(i) ? we : j, ne = ie(
      {
        solidCount: b(i.solids || []).length,
        openShellCount: I.length,
        parcelCount: b(i.parcels || []).length,
        faceCount: b(i.faces || []).length,
        ringCount: b(i.rings || []).length
      },
      {
        solid: N,
        surface: Ce,
        parcel: Me,
        face: N,
        ring: j
      }
    );
    if (this._config = await se(this._context, ne), this._config.rules.length) {
      const y = ee({ ...i, surfaces: I }, this._config), E = {
        solid: {
          build: (a) => n(a, o.shellMap, o.faceMap, o.ringMap, o.edgeMap, o.pointMap, t).geometry,
          outline: (a) => l(a, o.shellMap, o.faceMap, o.ringMap, o.edgeMap, o.pointMap, t)
        },
        "open-shell": {
          // Matches the pre-rule-engine `if (!faceCount) return;` guard: an open shell with zero
          // resolvable faces contributes no mesh, even though buildShellGeometry always returns a
          // (possibly empty) geometry object rather than null on its own.
          build: (a) => {
            const { geometry: k, faceCount: C } = h(a, o.shellMap, o.faceMap, o.ringMap, o.edgeMap, o.pointMap, t);
            return C ? k : null;
          },
          outline: (a) => c(a, o.shellMap, o.faceMap, o.ringMap, o.edgeMap, o.pointMap, t)
        },
        polygon: {
          build: (a) => x(a, o.edgeMap, o.pointMap, t),
          outline: (a) => f(a, o.edgeMap, o.pointMap, t)
        },
        face: {
          build: (a) => d(a, o.ringMap, o.edgeMap, o.pointMap, t),
          outline: (a) => _(a, o.ringMap, o.edgeMap, o.pointMap, t)
        },
        ring: {
          build: (a) => p(a, o.edgeMap, o.pointMap, t),
          outline: (a) => u(a, o.edgeMap, o.pointMap, t)
        }
      };
      let le = 0;
      y.forEach((a) => {
        var G, D, U, $;
        const k = E[a.geometry];
        if (!k) return;
        const C = k.build(a.feature);
        if (!C) return;
        const T = k.outline(a.feature), O = te(a.elevation);
        O !== null && (z(C, O), z(T.geometry, O)), X(T, { color: (G = a.style) == null ? void 0 : G.lineColor, dashed: ((D = a.style) == null ? void 0 : D.lineStyle) === "dashed" }, t);
        const ae = ((U = a.style) == null ? void 0 : U.opacity) ?? j, V = w(a.feature, le++, C, ae, (($ = a.style) == null ? void 0 : $.color) ?? null, t), A = g(C, t);
        V.material.wireframe = this._wireframe, e.add(V, T, A), this._solidMeshes.push(V), this._solidEdges.push(T), this._solidVertices.push(A);
        const B = {
          mesh: V,
          edges: T,
          vertices: A,
          kind: a.kind,
          group: a.group,
          kindLabel: a.kindLabel,
          label: a.label,
          visible: a.initiallyVisible
        };
        this._renderables.push(B), this._applyRenderableVisibility(B);
      });
      return;
    }
    const re = Object.keys(o.edgeMap).length > 0, oe = Object.keys(o.pointMap).length > 0;
    if (re) {
      this._showVertices = !0;
      const y = v(o.edgeMap, o.pointMap, t), E = m(o.pointMap, t);
      y.visible = this._showEdges, E.visible = this._showVertices, e.add(y, E), this._solidEdges.push(y), this._solidVertices.push(E);
    } else if (oe) {
      this._showVertices = !0;
      const y = m(o.pointMap, t);
      y.visible = !0, e.add(y), this._solidVertices.push(y);
    }
  }
  _applyRenderableVisibility(e) {
    e.mesh.visible = e.visible, e.edges.visible = e.visible && this._showEdges, e.vertices.visible = e.visible && this._showVertices;
  }
  _groupAllVisible(e) {
    const t = this._renderables.filter((i) => i.group === e);
    return t.length > 0 && t.every((i) => i.visible);
  }
  _toggleGroup(e) {
    const t = !this._groupAllVisible(e);
    this._renderables.filter((i) => i.group === e).forEach((i) => {
      i.visible = t, this._applyRenderableVisibility(i);
    }), this._refreshFullscreenPanel();
  }
  _fitCamera(e) {
    const t = [...this._solidMeshes, ...this._solidEdges, ...this._solidVertices];
    if (!t.length) return;
    const i = new e.Box3();
    if (t.forEach((d) => i.expandByObject(d)), i.isEmpty()) return;
    const s = i.getCenter(new e.Vector3()), n = i.getSize(new e.Vector3()), h = Math.max(n.x, n.y, n.z) * 2, c = this._camera;
    c.position.set(s.x - h * 0.7, s.y - h * 0.7, s.z + h * 0.7), c.near = h * 1e-3, c.far = h * 100, c.zoom = 1, c.updateProjectionMatrix(), this._controls.target.copy(s), this._syncProjection(), this._controls.update(), this._initialCameraPosition = c.position.clone(), this._initialCameraTarget = this._controls.target.clone(), this._initialCameraZoom = c.zoom;
  }
  // ─── Projection (perspective ⇄ orthographic) ─────────────────────────────────
  _halfHeightAtDistance(e) {
    return e * Math.tan(this._THREE.MathUtils.degToRad(F / 2));
  }
  _setOrthographicHalfHeight(e) {
    const t = Math.max(e, xe), i = t * (this._viewWidth / this._viewHeight), s = this._orthographicCamera;
    s.top = t, s.bottom = -t, s.left = -i, s.right = i, s.updateProjectionMatrix();
  }
  // Rebuilds the orthographic frustum from the camera's current distance to the controls target.
  // A no-op while the perspective camera is active, since _setProjection() derives the frustum at
  // switch time instead. Call after moving the camera/target (fit or reset).
  _syncProjection() {
    if (this._projection !== P) return;
    const e = this._orthographicCamera.position.distanceTo(this._controls.target);
    this._setOrthographicHalfHeight(this._halfHeightAtDistance(e));
  }
  // Switches between perspective and orthographic projection, preserving the framing: going to
  // orthographic, the frustum is sized to the perspective view volume at the target plane; coming
  // back, any accumulated orthographic zoom is converted into a camera distance that reproduces
  // the same view volume, so repeated toggling is stable rather than drifting.
  _setProjection(e) {
    if (e === this._projection || !this._camera) return;
    const t = this._THREE, i = this._perspectiveCamera, s = this._orthographicCamera, n = this._controls;
    if (e === P) {
      const l = i.position.distanceTo(n.target);
      s.position.copy(i.position), s.quaternion.copy(i.quaternion), s.near = i.near, s.far = i.far, s.zoom = 1, this._camera = s, this._projection = P, this._setOrthographicHalfHeight(this._halfHeightAtDistance(l));
    } else {
      const h = s.top / s.zoom / Math.tan(t.MathUtils.degToRad(F / 2)), c = new t.Vector3().subVectors(s.position, n.target);
      i.quaternion.copy(s.quaternion), i.near = s.near, i.far = s.far, i.zoom = 1, c.lengthSq() > 0 && i.position.copy(n.target).addScaledVector(c.normalize(), h), i.updateProjectionMatrix(), this._camera = i, this._projection = M;
    }
    n.object = this._camera, n.update();
  }
  _projectionTitle() {
    return this._projection === M ? "Switch to orthographic view" : "Switch to perspective view";
  }
  // ─── Fullscreen ───────────────────────────────────────────────────────────────
  _isFullscreen() {
    return document.fullscreenElement === this._el;
  }
  _toggleFullscreen() {
    var e, t, i;
    this._isFullscreen() ? (e = document.exitFullscreen) == null || e.call(document) : (i = (t = this._el) == null ? void 0 : t.requestFullscreen) == null || i.call(t);
  }
  // ─── Controls ─────────────────────────────────────────────────────────────────
  _buildControls(e) {
    const t = document.createElement("div");
    t.style.cssText = "position: absolute; bottom: 8px; left: 8px; display: flex; flex-direction: column; gap: 4px; z-index: 10;";
    const i = (n, l, h, c, d, _) => {
      const p = document.createElement("button");
      p.type = "button";
      const u = () => {
        p.title = _ ? _() : l, p.innerHTML = Pe[d ? d() : n], p.style.cssText = ke + Te(c == null ? void 0 : c());
      };
      return u(), p.addEventListener("click", () => {
        h(), u();
      }), t.appendChild(p), { btn: p, refresh: u };
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
    }, () => this._showVertices), this._kindToggleButtons = Ee.filter((n) => this._renderables.some((l) => l.group === n)).map((n) => {
      const { icon: l, inlineLabel: h } = L[n];
      return i(l, `Toggle ${h}`, () => this._toggleGroup(n), () => this._groupAllVisible(n));
    }), i(
      "projection",
      this._projectionTitle(),
      () => this._setProjection(this._projection === M ? P : M),
      () => this._projection === P,
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
    e.appendChild(t), this._controlsEl = t, this._buildFullscreenPanel(e), this._applyViewMode(), this._fullscreenChangeHandler = () => {
      this._el === e && (s.refresh(), this._applyViewMode());
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
    const e = this._isExpandedView();
    this._kindToggleButtons.forEach(({ btn: t }) => {
      t.style.display = e ? "none" : "";
    }), this._fullscreenPanelEl.style.display = e ? "block" : "none";
  }
  _isExpandedView() {
    return !!this._el && this._el.clientHeight >= ve;
  }
  // Collapsible per-type/per-instance visibility panel, shown whenever the container is large
  // (see _applyViewMode()) — the inline toolbar's per-kind icons are a coarser "toggle every
  // instance of this type" affordance meant for the compact embedded view; this panel adds the
  // ability to override one specific instance without hiding the rest of its type.
  _buildFullscreenPanel(e) {
    const t = document.createElement("div");
    t.style.cssText = "position: absolute; top: 8px; right: 8px; max-width: 260px; max-height: calc(100% - 16px); overflow-y: auto; background: rgba(255,255,255,0.95); border-radius: 6px; padding: 8px; font: 12px/1.4 sans-serif; color: #222; box-shadow: 0 1px 3px rgba(0,0,0,0.4); display: none; z-index: 10;", e.appendChild(t), this._fullscreenPanelEl = t, this._refreshFullscreenPanel();
  }
  // A checkbox reflecting/controlling the visibility of every renderable in `records` together —
  // checked when all are visible, unchecked when none are, indeterminate for a mix. Shared between
  // the panel's group-level heading and (when a group has more than one kind) each kind's own
  // sub-heading underneath it.
  _buildSelectAllCheckbox(e) {
    const t = e.every((n) => n.visible), i = e.every((n) => !n.visible), s = document.createElement("input");
    return s.type = "checkbox", s.checked = t, s.indeterminate = !t && !i, s.addEventListener("click", (n) => n.stopPropagation()), s.addEventListener("change", () => {
      e.forEach((n) => {
        n.visible = s.checked, this._applyRenderableVisibility(n);
      }), this._refreshFullscreenPanel();
    }), s;
  }
  // One labeled checkbox per record in `records`, appended directly into `container`.
  _appendFeatureCheckboxes(e, t) {
    t.forEach((i) => {
      const s = document.createElement("label");
      s.style.cssText = "display: block; margin: 2px 0; cursor: pointer;";
      const n = document.createElement("input");
      n.type = "checkbox", n.checked = i.visible, n.addEventListener("change", () => {
        i.visible = n.checked, this._applyRenderableVisibility(i), this._refreshFullscreenPanel();
      }), s.append(n, document.createTextNode(` ${i.label}`)), e.appendChild(s);
    });
  }
  // Groups renderables by `group` (one collapsible section + one select-all checkbox each, e.g.
  // "Parcels"); within a group that contains more than one distinct `kind` (e.g. a per-block
  // config's own "Created"/"Former Tenure" parcel rules sharing one "parcel" group), each kind
  // gets its own labeled sub-list with its own select-all checkbox nested underneath. A group
  // with only one kind (every built-in group, by default) renders exactly as it did before groups
  // existed — the per-feature checkboxes sit directly under the group heading, no redundant
  // single-item sub-heading.
  _refreshFullscreenPanel() {
    const e = this._fullscreenPanelEl;
    if (!e) return;
    e.innerHTML = "", [...new Set(this._renderables.map((i) => i.group))].forEach((i) => {
      var _;
      const s = this._renderables.filter((p) => p.group === i), n = [...new Set(s.map((p) => p.kind))], l = document.createElement("details");
      l.open = !0, l.style.cssText = "margin-bottom: 6px;";
      const h = document.createElement("summary");
      h.style.cssText = "cursor: pointer; display: flex; align-items: center; gap: 6px;";
      const c = ((_ = L[i]) == null ? void 0 : _.panelLabel) || J(i);
      h.append(this._buildSelectAllCheckbox(s), document.createTextNode(`${c} (${s.length})`)), l.appendChild(h);
      const d = document.createElement("div");
      d.style.cssText = "padding-left: 20px; margin-top: 4px;", n.length > 1 ? n.forEach((p) => {
        var w;
        const u = s.filter((g) => g.kind === p), x = u[0].kindLabel || ((w = L[p]) == null ? void 0 : w.panelLabel) || J(p), f = document.createElement("div");
        f.style.cssText = "margin-bottom: 6px;";
        const v = document.createElement("label");
        v.style.cssText = "display: flex; align-items: center; gap: 6px; font-weight: 600; cursor: pointer;", v.append(this._buildSelectAllCheckbox(u), document.createTextNode(`${x} (${u.length})`)), f.appendChild(v);
        const m = document.createElement("div");
        m.style.cssText = "padding-left: 20px; margin-top: 2px;", this._appendFeatureCheckboxes(m, u), f.appendChild(m), d.appendChild(f);
      }) : this._appendFeatureCheckboxes(d, s), l.appendChild(d), e.appendChild(l);
    });
  }
  _resetCamera() {
    !this._initialCameraPosition || !this._camera || !this._controls || (this._camera.position.copy(this._initialCameraPosition), this._camera.zoom = this._initialCameraZoom, this._camera.updateProjectionMatrix(), this._controls.target.copy(this._initialCameraTarget), this._syncProjection(), this._controls.update());
  }
  destroy(e) {
    this._animating = !1, this._animFrameId && cancelAnimationFrame(this._animFrameId), this._animFrameId = null, this._resizeObserver && (this._resizeObserver.disconnect(), this._resizeObserver = null), this._fullscreenChangeHandler && (document.removeEventListener("fullscreenchange", this._fullscreenChangeHandler), this._fullscreenChangeHandler = null), this._renderer && (this._renderer.dispose(), this._renderer.domElement.remove(), this._renderer = null), this._solidMeshes.forEach((t) => {
      var i, s;
      (i = t.geometry) == null || i.dispose(), (s = t.material) == null || s.dispose();
    }), this._solidEdges.forEach((t) => {
      var i, s;
      (i = t.geometry) == null || i.dispose(), (s = t.material) == null || s.dispose();
    }), this._solidVertices.forEach((t) => {
      var i;
      (i = t.children) == null || i.forEach((s) => {
        var n, l;
        (n = s.geometry) == null || n.dispose(), (l = s.material) == null || l.dispose();
      });
    }), this._solidMeshes = [], this._solidEdges = [], this._solidVertices = [], this._renderables = [], this._config = null, this._kindToggleButtons = [], this._fullscreenPanelEl = null, this._perspectiveCamera = null, this._orthographicCamera = null, this._camera = null, this._controls = null, this._gridHelper = null, this._THREE = null, this._el === e && (this._el = null), e.innerHTML = "";
  }
}
S(R, "supportedTypes", W), S(R, "viewName", "Topo view"), S(R, "icon", "mdi-vector-polygon");
export {
  R as TopoFeaturePlugin
};
