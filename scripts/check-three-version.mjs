#!/usr/bin/env node
// Guards against the `three` devDependency version (kept only so editors/tsc can resolve real
// types against a locally-installed copy) silently drifting from the literal CDN version string
// topo-feature-plugin.js actually fetches at runtime -- see bblocks-viewer's
// .claude/shared-dependency-resolver-design.md ("Version drift"). Run as `prebuild`. Keep this
// version synced with bblocks-viewer-base-plugins' own THREE_VERSION too, so a shared
// context.depResolver call actually hits the same cached instance for both plugins.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const rootDir = new URL('..', import.meta.url);
const pkg = JSON.parse(readFileSync(new URL('package.json', rootDir), 'utf8'));
const devDependencyVersion = pkg.devDependencies?.three;

const pluginSource = readFileSync(fileURLToPath(new URL('src/topo-feature-plugin.js', rootDir)), 'utf8');
const match = pluginSource.match(/const THREE_VERSION = '([^']+)';/);
const literalVersion = match?.[1];

if (!devDependencyVersion || !literalVersion) {
  console.error(
    'check-three-version: could not read both versions '
    + `(devDependency: ${devDependencyVersion ?? '<missing>'}, literal: ${literalVersion ?? '<missing>'})`
  );
  process.exit(1);
}

if (devDependencyVersion !== literalVersion) {
  console.error(
    `check-three-version: package.json's "three" devDependency (${devDependencyVersion}) does not `
    + `match the THREE_VERSION literal in src/topo-feature-plugin.js (${literalVersion}). Keep both `
    + 'in sync -- the devDependency exists only so this exact version can be resolved locally for '
    + 'types/tooling, while THREE_VERSION is what actually gets fetched from the CDN at runtime.'
  );
  process.exit(1);
}
