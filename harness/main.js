// Zero-build harness driving the actual shipped TopoFeaturePlugin class (imported straight from
// src/, not a reimplementation) against either a bundled fixture, an uploaded file, or an
// arbitrary URL — see harness/README section in the repo README for how to run this.
import TopoFeaturePlugin from '../src/topo-feature-plugin.js';

const FIXTURES = [
  { label: 'Cube', file: 'fixtures/cube.json' },
  { label: 'Cube with void (no open shells — regression check)', file: 'fixtures/cube-with-void.json' },
  { label: 'Cube with protrusion', file: 'fixtures/cube-with-protrusion.json' },
  { label: 'Tetrahedron', file: 'fixtures/tetrahedron.json' },
  { label: 'Four unit up/down', file: 'fixtures/4-unit-up-down.json' },
  { label: 'Parcel (parcels + solid + 1 open shell)', file: 'fixtures/parcel.json' },
  { label: 'Derived 3D solid (parcels + solid + 3 open shells)', file: 'fixtures/derived-3d-solid.json' },
];

const fixtureSelect = document.getElementById('fixtureSelect');
const fileInput = document.getElementById('fileInput');
const urlInput = document.getElementById('urlInput');
const urlLoadButton = document.getElementById('urlLoad');
const statusEl = document.getElementById('status');
const host = document.getElementById('host');

let plugin = null;

FIXTURES.forEach(({ label, file }) => {
  const option = document.createElement('option');
  option.value = file;
  option.textContent = label;
  fixtureSelect.appendChild(option);
});

function detectMimeType(name) {
  return name.endsWith('.geojson') ? 'application/geo+json' : 'application/json';
}

function renderDocument(content, label, mimeType = 'application/json') {
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
  plugin = new TopoFeaturePlugin(candidates, {});

  if (!plugin.matches()) {
    statusEl.textContent = `${label}: not recognised as a 3D topo-feature document — see console.`;
    console.warn('TopoFeaturePlugin did not match this document:', parsed);
    return;
  }

  statusEl.textContent = label;
  // render() surfaces its own async errors via an internal catch (see topo-feature-plugin.js) —
  // nothing further to await here.
  plugin.render(host);
}

async function loadFromUrl(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  return response.text();
}

async function loadFixture(file) {
  statusEl.textContent = `Loading ${file}…`;
  try {
    const content = await loadFromUrl(file);
    renderDocument(content, file.split('/').pop());
  } catch (e) {
    statusEl.textContent = `Failed to load ${file}: ${e.message}`;
    console.error(e);
  }
}

fixtureSelect.addEventListener('change', () => loadFixture(fixtureSelect.value));

fileInput.addEventListener('change', async () => {
  const file = fileInput.files[0];
  if (!file) return;
  const content = await file.text();
  renderDocument(content, file.name, detectMimeType(file.name));
});

urlLoadButton.addEventListener('click', async () => {
  const url = urlInput.value.trim();
  if (!url) return;
  statusEl.textContent = `Loading ${url}…`;
  try {
    const content = await loadFromUrl(url);
    renderDocument(content, url, detectMimeType(url));
  } catch (e) {
    statusEl.textContent = `Failed to load ${url}: ${e.message}`;
    console.error(e);
  }
});

loadFixture(FIXTURES[0].file);
