import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/**
 * API base-path guard.
 *
 * Every remaining legacy area class prefixes its endpoints with a hand-written
 * base-path literal, while the authoritative value ships in the eBay OpenAPI
 * spec this repo already downloads and commits
 * (`servers[0].variables.basePath.default`). This guard ties the two together.
 * Migrated resources encode their official base path in resource modules under
 * `src/ebay/` and are out of scope for this `src/api` inventory check.
 */
const repoRoot = fileURLToPath(new URL('../../../', import.meta.url));

/** A base-path literal in `src/api`, paired with the committed spec that owns it. */
type BasePathBinding = {
  /** Repo-relative source file declaring the literal. */
  readonly file: string;
  /** Identifier assigned the literal, e.g. `basePath` or `INVENTORY_BASE_PATH`. */
  readonly constant: string;
  /** Repo-relative spec whose `basePath` is authoritative. */
  readonly spec: string;
};

/**
 * Every base-path literal remaining in `src/api`. Empty while the last legacy
 * facades have been deleted. A completeness check fails when a new literal
 * appears without being bound here.
 */
const BASE_PATH_BINDINGS: readonly BasePathBinding[] = [];

/** Minimal view of an OpenAPI document — only the server variable this guard reads. */
type SpecDocument = {
  servers?: { variables?: { basePath?: { default?: string } } }[];
};

const readRepoFile = (relativePath: string): string =>
  readFileSync(`${repoRoot}${relativePath}`, 'utf8');

/** Reads the literal assigned to `constant` in a source file. */
const readDeclaredBasePath = (binding: BasePathBinding): string | undefined => {
  const declaration = new RegExp(`\\b${binding.constant}\\s*=\\s*'([^']+)'`).exec(
    readRepoFile(binding.file),
  );
  if (declaration === null) {
    return;
  }

  return declaration.at(1);
};

/** Reads eBay's own `basePath` default out of a committed OpenAPI spec. */
const readSpecBasePath = (spec: string): string | undefined => {
  const openApiDocument = JSON.parse(readRepoFile(spec)) as SpecDocument;
  const firstServer = openApiDocument.servers?.at(0);
  if (firstServer === undefined) {
    return;
  }

  const basePathVariable = firstServer.variables?.basePath;
  if (basePathVariable === undefined) {
    return;
  }

  return basePathVariable.default;
};

/** Matches any `…basePath`/`…BASE_PATH` identifier assigned a string literal. */
const BASE_PATH_DECLARATION = /\b(\w*(?:asePath|ASE_PATH))\s*=\s*'([^']+)'/g;

/** Walks `src/api` and reports every `file#constant` base-path literal it declares. */
const declaredBasePathKeys = (): string[] =>
  readdirSync(`${repoRoot}src/api`, { recursive: true, withFileTypes: true })
    .filter((sourceDirent) => sourceDirent.isFile() && sourceDirent.name.endsWith('.ts'))
    .flatMap((sourceDirent) => {
      const sourceFile = relative(repoRoot, join(sourceDirent.parentPath, sourceDirent.name));

      return [...readRepoFile(sourceFile).matchAll(BASE_PATH_DECLARATION)].map(
        (declarationMatch) => `${sourceFile}#${declarationMatch[1]}`,
      );
    });

describe('api base paths', () => {
  if (BASE_PATH_BINDINGS.length > 0) {
    it.each(BASE_PATH_BINDINGS)('$file $constant matches $spec', (binding) => {
      expect(readDeclaredBasePath(binding)).toBe(readSpecBasePath(binding.spec));
    });
  }

  it('binds every base-path literal declared under src/api', () => {
    const bound = BASE_PATH_BINDINGS.map((binding) => `${binding.file}#${binding.constant}`);

    expect(new Set(bound).size).toBe(BASE_PATH_BINDINGS.length);
    expect(declaredBasePathKeys().sort()).toEqual([...bound].sort());
  });
});
