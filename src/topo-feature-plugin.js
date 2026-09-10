import { mimeTypeMatches } from './utils/mime-type-match.js';
import { isTopoFeature3D } from './utils/detect-topo.js';

const SUPPORTED_TYPES = ['application/geo+json', 'application/json', 'application/ld+json'];

// Kept in sync with the `three` devDependency version in package.json by
// scripts/check-three-version.mjs (run as `prebuild`). Synced with
// bblocks-viewer-base-plugins' own THREE_VERSION so a shared context.depResolver call actually
// hits the same cached instance for both plugins — see bblocks-viewer's
// .claude/shared-dependency-resolver-design.md.
const THREE_VERSION = '0.184.0';

const loadThree = () => import(/* @vite-ignore */ `https://esm.sh/three@${THREE_VERSION}`);
// esm.sh's path for OrbitControls differs from npm's `three/addons/controls/OrbitControls.js`.
// Not resolver-shared: it's a subpath of the same `three` package/version, not an independent
// dependency, so the sharing machinery below isn't worth the extra registry key for it.
const loadOrbitControls = () => import(
  /* @vite-ignore */ `https://esm.sh/three@${THREE_VERSION}/examples/jsm/controls/OrbitControls.js`
);

// context.depResolver is optional infra a host may supply to let two independently-versioned
// plugins share one runtime instance of `three` instead of each fetching their own copy. Its
// absence doesn't fall back to a bundled copy — there is none — it only means "skip the sharing
// optimization," still load from the CDN.
function resolveThree(context) {
  if (context?.depResolver) {
    return context.depResolver.resolve({
      name: 'three',
      range: `^${THREE_VERSION}`,
      version: THREE_VERSION,
      load: loadThree,
    });
  }
  return loadThree();
}

const CAMERA_FOV = 60;
const CAMERA_NEAR = 0.001;
const CAMERA_FAR = 10000;
// Guards against a degenerate (zero-area) orthographic frustum when the camera sits on the
// controls target.
const MIN_FRUSTUM_HALF_HEIGHT = 1e-6;

const PROJECTION_PERSPECTIVE = 'perspective';
const PROJECTION_ORTHOGRAPHIC = 'orthographic';

// The collapsible per-type/per-instance panel activates by *size*, not by which control the user
// clicked to get more space — the host's own "expand to a bigger dialog" affordance resizes this
// plugin's container exactly like this plugin's own fullscreen button does, and both should have
// the same effect without a second, separate opt-in. The host gives this container a fixed ~300px
// height inline; anything meaningfully taller than that (its own fullscreen dialog, or this
// plugin's requestFullscreen()) crosses this threshold.
const EXPANDED_VIEW_MIN_HEIGHT = 400;

// Per-kind mesh opacity. Solids (and standalone faces/rings) additionally go semi-transparent
// only when needsTransparency() finds a hole/void that would otherwise hide interior geometry;
// surfaces and parcels are always uniformly translucent since they're most useful shown alongside
// (rather than obscuring) whatever else is in the scene.
const MESH_OPACITY_OPAQUE = 1.0;
const MESH_OPACITY_TRANSPARENT = 0.85;
const MESH_OPACITY_SURFACE = 0.55;
const MESH_OPACITY_PARCEL = 0.35;

// Presentation for the plugin's own built-in kinds (see default-config.js) — the only kinds with
// hand-drawn icons, so the only ones that ever get a compact inline toggle button; every kind
// actually rendered (including these, plus anything a per-block config's own rules introduce)
// still gets its own section in the fullscreen per-instance panel — see _refreshFullscreenPanel().
// A kind with no entry here (only possible via a per-block config's own rule, since the built-in
// default rule set never produces one) falls back to no inline icon and a humanized version of
// its own name in the panel — see humanizeKind() below.
const KIND_PRESENTATION = {
  parcel: { icon: 'parcels', inlineLabel: 'parcels', panelLabel: 'Parcels' },
  surface: { icon: 'surfaces', inlineLabel: 'surfaces', panelLabel: 'Surfaces' },
  solid: { icon: 'solids', inlineLabel: 'solids', panelLabel: 'Solids' },
  face: { panelLabel: 'Faces' },
  ring: { panelLabel: 'Rings' },
};
// Inline toggle buttons are offered in this fixed order, for whichever of these three kinds is
// actually present — matches the pre-Stage-2 fixed order exactly.
const INLINE_ICON_KIND_ORDER = ['parcel', 'surface', 'solid'];

// "former-tenure-parcel" -> "Former tenure parcel" — the panel label for any kind a per-block
// config's own rules introduce that isn't one of the plugin's built-in kinds above. No attempt at
// pluralization; a plain humanization is enough for the panel to read as something other than a
// raw rule-config slug.
function humanizeKind(kind) {
  const words = String(kind).replace(/[-_]+/g, ' ').trim();
  return words ? words.charAt(0).toUpperCase() + words.slice(1) : String(kind);
}

const BUTTON_STYLE = 'width: 26px; height: 26px; border: none; border-radius: 4px; cursor: pointer; '
  + 'display: flex; align-items: center; justify-content: center; padding: 0; '
  + 'box-shadow: 0 1px 3px rgba(0,0,0,0.4);';

function buttonColors(active) {
  return active ? 'background: #1976d2; color: #fff;' : 'background: #fff; color: #333;';
}

// No Vuetify/mdi available (this plugin is plain DOM, no host framework dependency) — small
// self-contained inline SVGs instead, sized/colored via `currentColor` so buttonColors' `color`
// above drives their fill/stroke automatically.
const ICONS = {
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
  fullscreenExit: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9V5a2 2 0 0 1 2-2h4"/><path d="M20 9V5a2 2 0 0 0-2-2h-4"/><path d="M4 15v4a2 2 0 0 0 2 2h4"/><path d="M20 15v4a2 2 0 0 1-2 2h-4"/></svg>',
};

// Renders topo-feature (https://github.com/ogcincubator/topo-feature) topology documents — a
// CityJSON-like structure of points/edges/rings/faces/shells/solids feature collections
// cross-referenced by id — as a Three.js scene, whenever those points carry a 3D coordinate (see
// isTopoFeature3D). Solids, open shells (surfaces not already drawn as part of a solid) and
// Polygon-topology parcels render together whenever any of the three is present, each its own
// color-grouped set; only when none of them is present does rendering fall back to the flatter
// single-tier chain (a standalone Face/Ring, bare edges, or bare points) — see _buildScene. Split
// out of bblocks-viewer-base-plugins' ThreeDPlugin (which still handles plain 3D GeoJSON) so this
// format, actively evolving, can iterate on its own release cycle. One instance per matched
// example/transform-output (see host `matchPlugins()`), so all of this state is naturally scoped
// per-candidate-set rather than needing to be re-derived on render.
//
// @implements {import('@ogc/bblocks-viewer-plugin-types').ViewPluginClass}
export default class TopoFeaturePlugin {
  static supportedTypes = SUPPORTED_TYPES;
  static viewName = 'Topo view';
  static icon = 'mdi-vector-polygon';

  /**
   * @param {import('@ogc/bblocks-viewer-plugin-types').ViewPluginCandidate[]} candidates
   * @param {import('@ogc/bblocks-viewer-plugin-types').ViewPluginContext} [context]
   */
  constructor(candidates, context = {}) {
    this.candidates = candidates;
    this._context = context;
    this._candidate = undefined;
    this._el = null;
    this._THREE = null;
    this._renderer = null;
    this._perspectiveCamera = null;
    this._orthographicCamera = null;
    this._camera = null; // whichever of the two is currently active — see _setProjection()
    this._projection = PROJECTION_PERSPECTIVE;
    this._viewWidth = 0;
    this._viewHeight = 0;
    this._controls = null;
    this._gridHelper = null;
    this._resizeObserver = null;
    this._fullscreenChangeHandler = null;
    this._animating = false;
    this._animFrameId = null;
    this._solidMeshes = [];
    this._solidEdges = [];
    this._solidVertices = [];
    // One record per named renderable object (a solid, an open shell, a parcel, or a standalone
    // face/ring) — {mesh, edges, vertices, kind, label, visible}. Drives both the inline per-kind
    // toggle icons and the fullscreen per-type/per-instance panel from one shared visibility
    // state. Bare edge/point "soup" tiers (no discrete named objects) aren't recorded here.
    this._renderables = [];
    // The effective rule config for the current render — the plugin's own built-in defaults
    // (default-config.js), merged with a per-block override if context.bblock declares one (see
    // resolve-config.js). Resolved fresh in _buildScene(); null until then.
    this._config = null;
    this._initialCameraPosition = null;
    this._initialCameraTarget = null;
    this._initialCameraZoom = 1;
    this._wireframe = false;
    this._showGrid = false;
    this._showEdges = true;
    this._showVertices = false;
    this._fullscreenPanelEl = null;
    this._kindToggleButtons = [];
  }

  matches() {
    return !!this._pickCandidate();
  }

  _pickCandidate() {
    if (this._candidate !== undefined) return this._candidate;
    const candidate = this.candidates.find(c => {
      if (!c.type || !c.content) return false;
      if (!SUPPORTED_TYPES.some(t => mimeTypeMatches(t, c.type))) return false;
      try {
        return isTopoFeature3D(JSON.parse(c.content));
      } catch {
        return false;
      }
    });
    this._candidate = candidate ?? null;
    return this._candidate;
  }

  render(el) {
    this._el = el;
    // Don't overwrite el's own size — the host (ViewPluginRenderer) already gives it a real
    // height (inline 300px, or 100% inside the fullscreen dialog's own definite-height chain).
    // Only add `position: relative` (needed so the absolute-positioned control bar anchors to el,
    // not some further-out ancestor), additively rather than via cssText, so el's host-set height
    // survives.
    el.style.position = 'relative';
    this._mount(el).catch(e => {
      console.error('TopoFeaturePlugin: init failed', e);
      if (this._el === el) this._showError(el, `Failed to render this topology view (${e.message}).`);
    });
  }

  // Tears down whatever got built so far (via destroy(), which is safe to call on a
  // partially-initialized instance — every field it touches is null-guarded) and replaces el's
  // content with a plain-DOM error message. Used both for _mount() failures (caught above) and
  // for errors thrown from inside the animate() render loop below, which is the harder case: it
  // runs on its own requestAnimationFrame stack, outside any promise chain the host or this
  // plugin's own render() could catch, so this plugin must catch and surface it itself.
  _showError(el, message) {
    this.destroy(el);
    const banner = document.createElement('div');
    banner.style.cssText = 'display: flex; flex-direction: column; align-items: center; justify-content: center; '
      + 'height: 100%; padding: 16px; text-align: center; color: #b00020; font: 14px/1.4 sans-serif;';

    const messageEl = document.createElement('div');
    messageEl.textContent = message;
    const hintEl = document.createElement('div');
    hintEl.style.cssText = 'margin-top: 12px;';
    hintEl.textContent = 'See the browser console for details.';

    banner.append(messageEl, hintEl);
    el.appendChild(banner);
  }

  async _mount(el) {
    const candidate = this._pickCandidate();
    if (!candidate) return;
    const data = JSON.parse(candidate.content);

    const [THREE, { OrbitControls }] = await Promise.all([
      resolveThree(this._context),
      loadOrbitControls(),
    ]);
    if (this._el !== el) return; // torn down before deps resolved
    this._THREE = THREE;

    const canvasContainer = document.createElement('div');
    canvasContainer.style.cssText = 'height: 100%; width: 100%;';
    el.appendChild(canvasContainer);

    const width = canvasContainer.clientWidth || 600;
    const height = canvasContainer.clientHeight || 400;
    this._viewWidth = width;
    this._viewHeight = height;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xadb1b1);

    // Both a perspective and an orthographic camera are built up front; only one is ever active
    // (this._camera) — _setProjection() swaps which instance that is. Every closure below that
    // needs "the camera" reads this._camera fresh rather than capturing either instance directly,
    // so a projection swap takes effect without re-wiring the render loop/resize handler.
    const perspectiveCamera = new THREE.PerspectiveCamera(CAMERA_FOV, width / height, CAMERA_NEAR, CAMERA_FAR);
    perspectiveCamera.up.set(0, 0, 1);
    this._perspectiveCamera = perspectiveCamera;

    const orthographicCamera = new THREE.OrthographicCamera(
      -(width / height), width / height, 1, -1, CAMERA_NEAR, CAMERA_FAR
    );
    orthographicCamera.up.set(0, 0, 1);
    this._orthographicCamera = orthographicCamera;

    this._camera = perspectiveCamera;
    this._projection = PROJECTION_PERSPECTIVE;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(width, height);
    canvasContainer.appendChild(renderer.domElement);
    this._renderer = renderer;

    const controls = new OrbitControls(this._camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    this._controls = controls;

    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const d1 = new THREE.DirectionalLight(0xffffff, 0.8);
    d1.position.set(100, 100, 100);
    scene.add(d1);
    const d2 = new THREE.DirectionalLight(0xffffff, 0.3);
    d2.position.set(-100, -100, -100);
    scene.add(d2);
    const d3 = new THREE.DirectionalLight(0xffffff, 0.3);
    d3.position.set(0, -100, 0);
    scene.add(d3);

    this._gridHelper = new THREE.GridHelper(100, 20, 0x444444, 0x222222);
    this._gridHelper.rotation.x = Math.PI / 2;
    this._gridHelper.visible = this._showGrid;
    scene.add(this._gridHelper);

    scene.add(new THREE.AxesHelper(1));

    await this._buildScene(scene, THREE, data);
    if (this._el !== el) return; // torn down while scene was building

    this._fitCamera(THREE);
    this._buildControls(el);

    this._resizeObserver = new ResizeObserver(() => {
      if (!this._renderer || !canvasContainer.isConnected) return;
      const w = canvasContainer.clientWidth;
      const h = canvasContainer.clientHeight;
      if (!w || !h) return;
      this._viewWidth = w;
      this._viewHeight = h;
      this._perspectiveCamera.aspect = w / h;
      this._perspectiveCamera.updateProjectionMatrix();
      this._setOrthographicHalfHeight(this._orthographicCamera.top || 1);
      renderer.setSize(w, h);
      this._applyViewMode();
    });
    this._resizeObserver.observe(canvasContainer);

    this._animating = true;
    const animate = () => {
      if (!this._animating) return;
      this._animFrameId = requestAnimationFrame(animate);
      try {
        controls.update();
        renderer.render(scene, this._camera);
      } catch (e) {
        console.error('TopoFeaturePlugin: render loop failed', e);
        this._showError(el, `An error occurred while rendering this topology view (${e.message}).`);
      }
    };
    animate();
  }

  // Renders whatever geometry the data actually contains. Solids, open shells (surfaces not
  // already drawn as part of a solid — see getOpenShells) and Polygon-topology parcels render
  // together whenever any is present, each its own color-grouped tier. Only when none of the
  // three is present does rendering fall back to the older single-tier chain — a standalone Face
  // or Ring ("simple polygon"), bare Edges, or bare Points — matching how leaner topo-feature
  // examples (not solids/parcels at all) are actually authored.
  async _buildScene(scene, THREE, data) {
    const [
      {
        buildMaps, buildSolidGeometry, buildSolidEdgeLines, buildShellGeometry, buildShellEdgeLines,
        buildFaceGeometry, buildFaceOutline, buildRingGeometry, buildRingOutline,
        buildPolygonGeometry, buildPolygonEdgeLines, buildAllEdgeLines, buildPointMarkers,
        createSolidMesh, createVertexMarkers, getFeatures, getOpenShells, needsTransparency,
      },
      { classifyFeatures },
      { buildDefaultConfig },
      { loadViewerConfig },
    ] = await Promise.all([
      import('./utils/topo-geometry.js'),
      import('./utils/rules.js'),
      import('./utils/default-config.js'),
      import('./utils/resolve-config.js'),
    ]);

    const maps = buildMaps(data);
    const openShells = getOpenShells(data, maps);
    const opaqueOrTransparent = needsTransparency(data) ? MESH_OPACITY_TRANSPARENT : MESH_OPACITY_OPAQUE;

    // The plugin's own built-in default rule set, reproducing the pre-rule-engine tiering exactly
    // (see default-config.js). `__openShells` is a synthetic source: open shells aren't a plain
    // top-level document array like `solids`/`parcels`, they're derived from the solid/shell
    // reference graph, so that derivation still happens here rather than inside the (otherwise
    // document-shape-agnostic) rule engine.
    const defaultConfig = buildDefaultConfig(
      {
        solidCount: getFeatures(data.solids || []).length,
        openShellCount: openShells.length,
        parcelCount: getFeatures(data.parcels || []).length,
        faceCount: getFeatures(data.faces || []).length,
        ringCount: getFeatures(data.rings || []).length,
      },
      {
        solid: opaqueOrTransparent,
        surface: MESH_OPACITY_SURFACE,
        parcel: MESH_OPACITY_PARCEL,
        face: opaqueOrTransparent,
        ring: MESH_OPACITY_OPAQUE,
      }
    );

    // A per-block config (declared as a bblock.json `resources` entry, see resolve-config.js) is
    // merged over these defaults if the host gave us a context.bblock that declares one; falls
    // straight back to defaultConfig — unchanged — for every existing example, the harness
    // (context.bblock is never supplied there), and any fetch/parse failure.
    this._config = await loadViewerConfig(this._context, defaultConfig);

    if (this._config.rules.length) {
      const descriptors = classifyFeatures({ ...data, __openShells: openShells }, this._config);

      // One entry per `geometry` strategy a rule can name — each wraps the matching pair of
      // build*/build*EdgeLines (or build*Outline) functions from topo-geometry.js behind a
      // uniform (feature) -> geometry|null, (feature) -> outline signature so the render loop
      // below doesn't need to know which kind it's looking at.
      const geometryStrategies = {
        solid: {
          build: f => buildSolidGeometry(f, maps.shellMap, maps.faceMap, maps.ringMap, maps.edgeMap, maps.pointMap, THREE).geometry,
          outline: f => buildSolidEdgeLines(f, maps.shellMap, maps.faceMap, maps.ringMap, maps.edgeMap, maps.pointMap, THREE),
        },
        'open-shell': {
          // Matches the pre-rule-engine `if (!faceCount) return;` guard: an open shell with zero
          // resolvable faces contributes no mesh, even though buildShellGeometry always returns a
          // (possibly empty) geometry object rather than null on its own.
          build: f => {
            const { geometry, faceCount } = buildShellGeometry(f, maps.shellMap, maps.faceMap, maps.ringMap, maps.edgeMap, maps.pointMap, THREE);
            return faceCount ? geometry : null;
          },
          outline: f => buildShellEdgeLines(f, maps.shellMap, maps.faceMap, maps.ringMap, maps.edgeMap, maps.pointMap, THREE),
        },
        polygon: {
          build: f => buildPolygonGeometry(f, maps.edgeMap, maps.pointMap, THREE),
          outline: f => buildPolygonEdgeLines(f, maps.edgeMap, maps.pointMap, THREE),
        },
        face: {
          build: f => buildFaceGeometry(f, maps.ringMap, maps.edgeMap, maps.pointMap, THREE),
          outline: f => buildFaceOutline(f, maps.ringMap, maps.edgeMap, maps.pointMap, THREE),
        },
        ring: {
          build: f => buildRingGeometry(f, maps.edgeMap, maps.pointMap, THREE),
          outline: f => buildRingOutline(f, maps.edgeMap, maps.pointMap, THREE),
        },
      };

      let colorIndex = 0;
      descriptors.forEach(descriptor => {
        const strategy = geometryStrategies[descriptor.geometry];
        if (!strategy) return;
        const geometry = strategy.build(descriptor.feature);
        if (!geometry) return;
        const outline = strategy.outline(descriptor.feature);
        const opacity = descriptor.style?.opacity ?? MESH_OPACITY_OPAQUE;
        const mesh = createSolidMesh(descriptor.feature, colorIndex++, geometry, opacity, THREE);
        const vertices = createVertexMarkers(geometry, THREE);
        mesh.material.wireframe = this._wireframe;
        scene.add(mesh, outline, vertices);
        this._solidMeshes.push(mesh);
        this._solidEdges.push(outline);
        this._solidVertices.push(vertices);
        const record = {
          mesh, edges: outline, vertices,
          kind: descriptor.kind, label: descriptor.label, visible: descriptor.initiallyVisible,
        };
        this._renderables.push(record);
        this._applyRenderableVisibility(record);
      });
      return;
    }

    const hasEdges = Object.keys(maps.edgeMap).length > 0;
    const hasPoints = Object.keys(maps.pointMap).length > 0;
    if (hasEdges) {
      // Bare edges: no fill, so the edges toggle (on by default) already shows something; vertices
      // still default off, so turn them on too or points-with-no-edges-drawn-through-them vanish.
      // No per-feature kind/label to classify here, so this stays outside the rule engine.
      this._showVertices = true;
      const edges = buildAllEdgeLines(maps.edgeMap, maps.pointMap, THREE);
      const vertices = buildPointMarkers(maps.pointMap, THREE);
      edges.visible = this._showEdges;
      vertices.visible = this._showVertices;
      scene.add(edges, vertices);
      this._solidEdges.push(edges);
      this._solidVertices.push(vertices);
    } else if (hasPoints) {
      // Bare points: nothing else to draw, so points must default to visible.
      this._showVertices = true;
      const vertices = buildPointMarkers(maps.pointMap, THREE);
      vertices.visible = true;
      scene.add(vertices);
      this._solidVertices.push(vertices);
    }
  }

  _applyRenderableVisibility(record) {
    record.mesh.visible = record.visible;
    record.edges.visible = record.visible && this._showEdges;
    record.vertices.visible = record.visible && this._showVertices;
  }

  _kindAllVisible(kind) {
    const records = this._renderables.filter(r => r.kind === kind);
    return records.length > 0 && records.every(r => r.visible);
  }

  _toggleKind(kind) {
    const next = !this._kindAllVisible(kind);
    this._renderables.filter(r => r.kind === kind).forEach(r => {
      r.visible = next;
      this._applyRenderableVisibility(r);
    });
    this._refreshFullscreenPanel();
  }

  _fitCamera(THREE) {
    const allObjects = [...this._solidMeshes, ...this._solidEdges, ...this._solidVertices];
    if (!allObjects.length) return;
    const box = new THREE.Box3();
    allObjects.forEach(o => box.expandByObject(o));
    if (box.isEmpty()) return;

    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const dist = maxDim * 2;

    const camera = this._camera;
    camera.position.set(center.x - dist * 0.7, center.y - dist * 0.7, center.z + dist * 0.7);
    camera.near = dist * 0.001;
    camera.far = dist * 100;
    camera.zoom = 1;
    camera.updateProjectionMatrix();
    this._controls.target.copy(center);
    this._syncProjection();
    this._controls.update();

    this._initialCameraPosition = camera.position.clone();
    this._initialCameraTarget = this._controls.target.clone();
    this._initialCameraZoom = camera.zoom;
  }

  // ─── Projection (perspective ⇄ orthographic) ─────────────────────────────────

  _halfHeightAtDistance(distance) {
    return distance * Math.tan(this._THREE.MathUtils.degToRad(CAMERA_FOV / 2));
  }

  _setOrthographicHalfHeight(halfHeight) {
    const safeHalfHeight = Math.max(halfHeight, MIN_FRUSTUM_HALF_HEIGHT);
    const halfWidth = safeHalfHeight * (this._viewWidth / this._viewHeight);
    const cam = this._orthographicCamera;
    cam.top = safeHalfHeight;
    cam.bottom = -safeHalfHeight;
    cam.left = -halfWidth;
    cam.right = halfWidth;
    cam.updateProjectionMatrix();
  }

  // Rebuilds the orthographic frustum from the camera's current distance to the controls target.
  // A no-op while the perspective camera is active, since _setProjection() derives the frustum at
  // switch time instead. Call after moving the camera/target (fit or reset).
  _syncProjection() {
    if (this._projection !== PROJECTION_ORTHOGRAPHIC) return;
    const distance = this._orthographicCamera.position.distanceTo(this._controls.target);
    this._setOrthographicHalfHeight(this._halfHeightAtDistance(distance));
  }

  // Switches between perspective and orthographic projection, preserving the framing: going to
  // orthographic, the frustum is sized to the perspective view volume at the target plane; coming
  // back, any accumulated orthographic zoom is converted into a camera distance that reproduces
  // the same view volume, so repeated toggling is stable rather than drifting.
  _setProjection(mode) {
    if (mode === this._projection || !this._camera) return;
    const THREE = this._THREE;
    const perspectiveCamera = this._perspectiveCamera;
    const orthographicCamera = this._orthographicCamera;
    const controls = this._controls;

    if (mode === PROJECTION_ORTHOGRAPHIC) {
      const distance = perspectiveCamera.position.distanceTo(controls.target);
      orthographicCamera.position.copy(perspectiveCamera.position);
      orthographicCamera.quaternion.copy(perspectiveCamera.quaternion);
      orthographicCamera.near = perspectiveCamera.near;
      orthographicCamera.far = perspectiveCamera.far;
      orthographicCamera.zoom = 1;
      this._camera = orthographicCamera;
      this._projection = PROJECTION_ORTHOGRAPHIC;
      this._setOrthographicHalfHeight(this._halfHeightAtDistance(distance));
    } else {
      // camera.top is the unzoomed half-height; three.js divides by camera.zoom when building the
      // projection matrix, so the visible half-height is top / zoom.
      const visibleHalfHeight = orthographicCamera.top / orthographicCamera.zoom;
      const distance = visibleHalfHeight / Math.tan(THREE.MathUtils.degToRad(CAMERA_FOV / 2));
      const offset = new THREE.Vector3().subVectors(orthographicCamera.position, controls.target);

      perspectiveCamera.quaternion.copy(orthographicCamera.quaternion);
      perspectiveCamera.near = orthographicCamera.near;
      perspectiveCamera.far = orthographicCamera.far;
      perspectiveCamera.zoom = 1;
      // A zero offset would normalise to (0,0,0) and drop the camera onto the target; leaving the
      // perspective camera where it was is the safer degenerate-case fallback.
      if (offset.lengthSq() > 0) {
        perspectiveCamera.position.copy(controls.target).addScaledVector(offset.normalize(), distance);
      }
      perspectiveCamera.updateProjectionMatrix();
      this._camera = perspectiveCamera;
      this._projection = PROJECTION_PERSPECTIVE;
    }

    controls.object = this._camera;
    controls.update();
  }

  _projectionTitle() {
    return this._projection === PROJECTION_PERSPECTIVE ? 'Switch to orthographic view' : 'Switch to perspective view';
  }

  // ─── Fullscreen ───────────────────────────────────────────────────────────────

  _isFullscreen() {
    return document.fullscreenElement === this._el;
  }

  _toggleFullscreen() {
    if (this._isFullscreen()) {
      document.exitFullscreen?.();
    } else {
      this._el?.requestFullscreen?.();
    }
  }

  // ─── Controls ─────────────────────────────────────────────────────────────────

  _buildControls(el) {
    const bar = document.createElement('div');
    bar.style.cssText = 'position: absolute; bottom: 8px; left: 8px; display: flex; '
      + 'flex-direction: column; gap: 4px; z-index: 10;';

    const addButton = (icon, title, onClick, isActive, getIcon, getTitle) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      const refresh = () => {
        btn.title = getTitle ? getTitle() : title;
        btn.innerHTML = ICONS[getIcon ? getIcon() : icon];
        btn.style.cssText = BUTTON_STYLE + buttonColors(isActive?.());
      };
      refresh();
      btn.addEventListener('click', () => { onClick(); refresh(); });
      bar.appendChild(btn);
      return { btn, refresh };
    };

    addButton('reset', 'Reset camera', () => this._resetCamera());
    addButton('grid', 'Toggle grid', () => { this._showGrid = !this._showGrid; this._gridHelper.visible = this._showGrid; }, () => this._showGrid);
    addButton('wireframe', 'Toggle wireframe', () => {
      this._wireframe = !this._wireframe;
      this._solidMeshes.forEach(m => { m.material.wireframe = this._wireframe; });
    }, () => this._wireframe);
    addButton('edges', 'Toggle edges', () => {
      this._showEdges = !this._showEdges;
      this._renderables.forEach(r => this._applyRenderableVisibility(r));
      this._solidEdges.forEach(edge => {
        if (!this._renderables.some(r => r.edges === edge)) edge.visible = this._showEdges;
      });
    }, () => this._showEdges);
    addButton('vertices', 'Toggle vertices', () => {
      this._showVertices = !this._showVertices;
      this._renderables.forEach(r => this._applyRenderableVisibility(r));
      this._solidVertices.forEach(v => {
        if (!this._renderables.some(r => r.vertices === v)) v.visible = this._showVertices;
      });
    }, () => this._showVertices);

    this._kindToggleButtons = INLINE_ICON_KIND_ORDER
      .filter(kind => this._renderables.some(r => r.kind === kind))
      .map(kind => {
        const { icon, inlineLabel } = KIND_PRESENTATION[kind];
        return addButton(icon, `Toggle ${inlineLabel}`, () => this._toggleKind(kind), () => this._kindAllVisible(kind));
      });

    addButton('projection', this._projectionTitle(),
      () => this._setProjection(this._projection === PROJECTION_PERSPECTIVE ? PROJECTION_ORTHOGRAPHIC : PROJECTION_PERSPECTIVE),
      () => this._projection === PROJECTION_ORTHOGRAPHIC,
      undefined,
      () => this._projectionTitle());

    const fullscreenButton = addButton('fullscreen', 'Fullscreen',
      () => this._toggleFullscreen(),
      () => this._isFullscreen(),
      () => this._isFullscreen() ? 'fullscreenExit' : 'fullscreen',
      () => this._isFullscreen() ? 'Exit fullscreen' : 'Fullscreen');

    el.appendChild(bar);
    this._controlsEl = bar;

    this._buildFullscreenPanel(el);
    this._applyViewMode(); // el may already be large at mount time (e.g. host opens straight into its own expanded dialog)

    // Only refreshes the fullscreen button's own icon/tooltip — see _applyViewMode() for the
    // panel/icon swap, which is driven by container size (via the ResizeObserver in _mount()) so
    // it also reacts to the host's own "expand" affordance, not just this button.
    this._fullscreenChangeHandler = () => {
      if (this._el !== el) return; // stale instance
      fullscreenButton.refresh();
      this._applyViewMode();
    };
    document.addEventListener('fullscreenchange', this._fullscreenChangeHandler);
  }

  // Swaps between the compact inline toolbar (per-kind toggle icons) and the collapsible
  // per-type/per-instance panel, based on how much space the host has actually given this
  // container — not on which specific control (this plugin's own fullscreen button, or the host's
  // own "expand" affordance) got it there. The host resizes this container the same way for both,
  // so treating them identically means a user who expands via the host's own UI gets the richer
  // panel immediately, without an extra, redundant click on this plugin's own fullscreen button.
  _applyViewMode() {
    if (!this._kindToggleButtons || !this._fullscreenPanelEl) return;
    const expanded = this._isExpandedView();
    this._kindToggleButtons.forEach(({ btn }) => { btn.style.display = expanded ? 'none' : ''; });
    this._fullscreenPanelEl.style.display = expanded ? 'block' : 'none';
  }

  _isExpandedView() {
    return !!this._el && this._el.clientHeight >= EXPANDED_VIEW_MIN_HEIGHT;
  }

  // Collapsible per-type/per-instance visibility panel, shown whenever the container is large
  // (see _applyViewMode()) — the inline toolbar's per-kind icons are a coarser "toggle every
  // instance of this type" affordance meant for the compact embedded view; this panel adds the
  // ability to override one specific instance without hiding the rest of its type.
  _buildFullscreenPanel(el) {
    const panel = document.createElement('div');
    panel.style.cssText = 'position: absolute; top: 8px; right: 8px; max-width: 260px; '
      + 'max-height: calc(100% - 16px); overflow-y: auto; background: rgba(255,255,255,0.95); '
      + 'border-radius: 6px; padding: 8px; font: 12px/1.4 sans-serif; color: #222; '
      + 'box-shadow: 0 1px 3px rgba(0,0,0,0.4); display: none; z-index: 10;';
    el.appendChild(panel);
    this._fullscreenPanelEl = panel;
    this._refreshFullscreenPanel();
  }

  _refreshFullscreenPanel() {
    const panel = this._fullscreenPanelEl;
    if (!panel) return;
    panel.innerHTML = '';

    const kinds = [...new Set(this._renderables.map(r => r.kind))];
    kinds.forEach(kind => {
      const records = this._renderables.filter(r => r.kind === kind);
      const allVisible = records.every(r => r.visible);
      const noneVisible = records.every(r => !r.visible);

      const details = document.createElement('details');
      details.open = true;
      details.style.cssText = 'margin-bottom: 6px;';

      const summary = document.createElement('summary');
      summary.style.cssText = 'cursor: pointer; display: flex; align-items: center; gap: 6px;';

      const groupCheckbox = document.createElement('input');
      groupCheckbox.type = 'checkbox';
      groupCheckbox.checked = allVisible;
      groupCheckbox.indeterminate = !allVisible && !noneVisible;
      // Prevent the checkbox click from also toggling the <details> open/closed state.
      groupCheckbox.addEventListener('click', e => e.stopPropagation());
      groupCheckbox.addEventListener('change', () => {
        records.forEach(r => { r.visible = groupCheckbox.checked; this._applyRenderableVisibility(r); });
        this._refreshFullscreenPanel();
      });

      const panelLabel = KIND_PRESENTATION[kind]?.panelLabel || humanizeKind(kind);
      summary.append(groupCheckbox, document.createTextNode(`${panelLabel} (${records.length})`));
      details.appendChild(summary);

      const list = document.createElement('div');
      list.style.cssText = 'padding-left: 20px; margin-top: 4px;';
      records.forEach(record => {
        const label = document.createElement('label');
        label.style.cssText = 'display: block; margin: 2px 0; cursor: pointer;';
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = record.visible;
        checkbox.addEventListener('change', () => {
          record.visible = checkbox.checked;
          this._applyRenderableVisibility(record);
          this._refreshFullscreenPanel();
        });
        label.append(checkbox, document.createTextNode(` ${record.label}`));
        list.appendChild(label);
      });
      details.appendChild(list);

      panel.appendChild(details);
    });
  }

  _resetCamera() {
    if (!this._initialCameraPosition || !this._camera || !this._controls) return;
    this._camera.position.copy(this._initialCameraPosition);
    this._camera.zoom = this._initialCameraZoom;
    this._camera.updateProjectionMatrix();
    this._controls.target.copy(this._initialCameraTarget);
    this._syncProjection();
    this._controls.update();
  }

  destroy(el) {
    this._animating = false;
    if (this._animFrameId) cancelAnimationFrame(this._animFrameId);
    this._animFrameId = null;
    if (this._resizeObserver) {
      this._resizeObserver.disconnect();
      this._resizeObserver = null;
    }
    if (this._fullscreenChangeHandler) {
      document.removeEventListener('fullscreenchange', this._fullscreenChangeHandler);
      this._fullscreenChangeHandler = null;
    }
    if (this._renderer) {
      this._renderer.dispose();
      this._renderer.domElement.remove();
      this._renderer = null;
    }
    this._solidMeshes.forEach(m => { m.geometry?.dispose(); m.material?.dispose(); });
    this._solidEdges.forEach(e => { e.geometry?.dispose(); e.material?.dispose(); });
    this._solidVertices.forEach(g => { g.children?.forEach(c => { c.geometry?.dispose(); c.material?.dispose(); }); });
    this._solidMeshes = [];
    this._solidEdges = [];
    this._solidVertices = [];
    this._renderables = [];
    this._config = null;
    this._kindToggleButtons = [];
    this._fullscreenPanelEl = null;
    this._perspectiveCamera = null;
    this._orthographicCamera = null;
    this._camera = null;
    this._controls = null;
    this._gridHelper = null;
    this._THREE = null;
    if (this._el === el) this._el = null;
    el.innerHTML = '';
  }
}
