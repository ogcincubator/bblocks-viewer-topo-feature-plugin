// Zero-build harness driving the actual shipped TopoFeaturePlugin class (imported straight from
// src/, not a reimplementation) against either a bundled fixture, an uploaded file, or an
// arbitrary URL — see harness/README section in the repo README for how to run this.
import TopoFeaturePlugin from '../src/topo-feature-plugin.js';
import { VIEWER_CONFIG_RESOURCE_ROLE } from '../src/utils/resolve-config.js';

const FIXTURES = [
  { label: 'Cube', file: 'fixtures/cube.json' },
  { label: 'Cube with void (no open shells — regression check)', file: 'fixtures/cube-with-void.json' },
  { label: 'Cube with protrusion', file: 'fixtures/cube-with-protrusion.json' },
  { label: 'Tetrahedron', file: 'fixtures/tetrahedron.json' },
  { label: 'Four unit up/down', file: 'fixtures/4-unit-up-down.json' },
  { label: 'Parcel (parcels + solid + 1 open shell)', file: 'fixtures/parcel.json', config: 'fixtures/parcel-config.json' },
  { label: 'Derived 3D solid (parcels + solid + 3 open shells)', file: 'fixtures/derived-3d-solid.json' },
  {
    // Non-cadastral: pipes classified by assetCondition, no `parcels` array, no WA vocabulary —
    // see the README's "Non-cadastral example" section and domain-independence.test.js. Its
    // `config` is auto-applied on selection (see loadFixture below), demonstrating literal, CURIE,
    // and full-URI value matching plus elevation:"flatten" together in one visual example.
    label: 'Utility network (non-cadastral rule-config demo)',
    file: 'fixtures/utility-network.json',
    config: 'fixtures/utility-network-config.json',
  },
];

const fixtureSelect = document.getElementById('fixtureSelect');
const fileInput = document.getElementById('fileInput');
const urlInput = document.getElementById('urlInput');
const urlLoadButton = document.getElementById('urlLoad');
const configFileInput = document.getElementById('configFileInput');
const configUrlInput = document.getElementById('configUrlInput');
const configUrlLoadButton = document.getElementById('configUrlLoad');
const configClearButton = document.getElementById('configClear');
const statusEl = document.getElementById('status');
const host = document.getElementById('host');

let plugin = null;
let currentDocument = null; // { content, label, mimeType } — whatever's loaded right now
let configRef = null; // URL (real or blob:) the plugin will fetch() as its config resource, or null
let configLabel = 'none (built-in defaults)';

FIXTURES.forEach(({ label, file }) => {
  const option = document.createElement('option');
  option.value = file;
  option.textContent = label;
  fixtureSelect.appendChild(option);
});

function detectMimeType(name) {
  return name.endsWith('.geojson') ? 'application/geo+json' : 'application/json';
}

// Stands in for what a real bblocks-viewer host passes as context.bblock. resolve-config.js looks
// for a `resources` entry with this exact role and fetch()es its `ref` — identically whether that
// ref is a real published register's absolute URL or, as here, a blob: URL for a locally-picked
// file. See the README's "Per-block configuration" section.
function buildContext() {
  if (!configRef) return {};
  return { bblock: { resources: [{ role: VIEWER_CONFIG_RESOURCE_ROLE, ref: configRef, format: 'application/json' }] } };
}

function renderCurrentDocument() {
  if (!currentDocument) return;
  const { content, label, mimeType } = currentDocument;
  if (plugin) {
    plugin.destroy(host);
    plugin = null;
  }
  host.innerHTML = '';

  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch (e) {
    statusEl.textContent = `${label}: not valid JSON — ${e.message}`;
    return;
  }

  const candidates = [{ type: mimeType, content, url: null, label }];
  plugin = new TopoFeaturePlugin(candidates, buildContext());

  if (!plugin.matches()) {
    statusEl.textContent = `${label}: not recognised as a 3D topo-feature document — see console.`;
    console.warn('TopoFeaturePlugin did not match this document:', parsed);
    return;
  }

  statusEl.textContent = `${label} — config: ${configLabel}`;
  // render() surfaces its own async errors via an internal catch (see topo-feature-plugin.js) —
  // nothing further to await here.
  plugin.render(host);
}

function setDocument(content, label, mimeType = 'application/json') {
  currentDocument = { content, label, mimeType };
  renderCurrentDocument();
}

// Resets config state without triggering a render — callers that are about to call setDocument()
// (which does render) use this instead of clearConfig() to avoid a wasted intermediate render
// against the *previous* document.
function resetConfigState() {
  configRef = null;
  configLabel = 'none (built-in defaults)';
  configFileInput.value = '';
  configUrlInput.value = '';
}

function clearConfig() {
  resetConfigState();
  renderCurrentDocument();
}

async function loadFromUrl(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  return response.text();
}

async function loadFixture(file, config) {
  statusEl.textContent = `Loading ${file}…`;
  try {
    const content = await loadFromUrl(file);
    resetConfigState();
    if (config) {
      configRef = config;
      configLabel = config.split('/').pop();
    }
    setDocument(content, file.split('/').pop());
  } catch (e) {
    statusEl.textContent = `Failed to load ${file}: ${e.message}`;
    console.error(e);
  }
}

fixtureSelect.addEventListener('change', () => {
  const fixture = FIXTURES.find(f => f.file === fixtureSelect.value);
  loadFixture(fixture.file, fixture.config);
});

fileInput.addEventListener('change', async () => {
  const file = fileInput.files[0];
  if (!file) return;
  const content = await file.text();
  resetConfigState();
  setDocument(content, file.name, detectMimeType(file.name));
});

urlLoadButton.addEventListener('click', async () => {
  const url = urlInput.value.trim();
  if (!url) return;
  statusEl.textContent = `Loading ${url}…`;
  try {
    const content = await loadFromUrl(url);
    resetConfigState();
    setDocument(content, url, detectMimeType(url));
  } catch (e) {
    statusEl.textContent = `Failed to load ${url}: ${e.message}`;
    console.error(e);
  }
});

configFileInput.addEventListener('change', () => {
  const file = configFileInput.files[0];
  if (!file) return;
  // A blob: URL is genuinely fetch()-able — resolve-config.js's fetch(resource.ref) call works
  // against it exactly as it would against a real register's absolute URL.
  configRef = URL.createObjectURL(file);
  configLabel = file.name;
  renderCurrentDocument();
});

configUrlLoadButton.addEventListener('click', () => {
  const url = configUrlInput.value.trim();
  if (!url) return;
  configRef = url;
  configLabel = url;
  renderCurrentDocument();
});

configClearButton.addEventListener('click', clearConfig);

loadFixture(FIXTURES[0].file);
