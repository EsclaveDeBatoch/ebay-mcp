/**
 * Builds the three interactive MCP Apps views into self-contained HTML files
 * under `build/ui/`.
 *
 * Why a script rather than a single `vite.config.ts`: `vite-plugin-singlefile`
 * inlines all dynamic imports, which Rollup only permits with a single input.
 * The three archetypes are therefore built one at a time (each its own
 * single-page build) into a shared output directory. Existing HTML documents are
 * removed first without deleting the server modules emitted into the same directory.
 * The result is exactly what `src/mcp/uiBridge.ts` expects:
 * `build/ui/{table,card,chart}.html`, each with its JS and CSS inlined so the
 * server can serve it verbatim as a `ui://` resource with no sibling requests.
 *
 * Run via `npm run build:ui` (also chained into `npm run build`).
 */

import { mkdirSync, readdirSync, rmSync } from 'node:fs';
import { dirname, extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build, type InlineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { uiArchetypes } from '@/ui/archetypes.js';
import type { ViewArchetype } from '@/ui/viewModels.js';
import { serverLogger } from '@/utils/logger.js';

const scriptsDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptsDir, '../..');
const uiDir = resolve(repoRoot, 'ui');
const outDir = resolve(repoRoot, 'build', 'ui');

/** Vite config for a single archetype's single-page, fully-inlined build. */
function configFor(archetype: ViewArchetype): InlineConfig {
  return {
    root: uiDir,
    configFile: false,
    logLevel: 'warn',
    plugins: [viteSingleFile()],
    esbuild: { jsx: 'automatic', jsxImportSource: 'react' },
    resolve: {
      alias: {
        '@': resolve(repoRoot, 'src'),
      },
    },
    build: {
      outDir,
      emptyOutDir: false,
      rollupOptions: { input: resolve(uiDir, uiArchetypes[archetype].htmlFile) },
    },
  };
}

mkdirSync(outDir, { recursive: true });
for (const uiOutputFile of readdirSync(outDir, { withFileTypes: true })) {
  if (uiOutputFile.isFile() && extname(uiOutputFile.name) === '.html') {
    rmSync(resolve(outDir, uiOutputFile.name));
  }
}

const archetypes = Object.keys(uiArchetypes) as ViewArchetype[];
for (const archetype of archetypes) {
  await build(configFor(archetype));
  serverLogger.info(`Built UI view "${uiArchetypes[archetype].htmlFile}"`);
}
