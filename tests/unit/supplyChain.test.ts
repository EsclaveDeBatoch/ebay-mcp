import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/**
 * Supply-chain hygiene guards.
 *
 * The project standardized on pnpm (`packageManager` in package.json) and every CI
 * workflow installs with `pnpm install --frozen-lockfile`. A stale, committed
 * `package-lock.json` used to shadow the pnpm tree and roughly doubled the Dependabot
 * alert surface — each advisory was counted once per ecosystem, and the npm lockfile
 * even pinned phantom dependencies (e.g. a root `axios`) that were not in package.json
 * at all. Removing it left pnpm-lock.yaml as the single source of truth.
 *
 * These guards fail loudly if a second lockfile or a non-pnpm package manager is
 * reintroduced, so that single-source-of-truth invariant cannot silently regress.
 */
const repoRoot = fileURLToPath(new URL('../../', import.meta.url));
const exactPackageVersionPattern = /^\d+\.\d+\.\d+(?:-[\dA-Za-z.-]+)?$/;

/** Minimal view of package.json — only the fields these guards assert on. */
type DependencyManifest = {
  readonly dependencies?: Readonly<Record<string, string>>;
  readonly devDependencies?: Readonly<Record<string, string>>;
  readonly engines?: { readonly node?: string };
  readonly packageManager?: string;
  readonly pnpm?: unknown;
};

const dependencyManifest = JSON.parse(
  readFileSync(`${repoRoot}package.json`, 'utf8'),
) as DependencyManifest;

describe('supply-chain hygiene', () => {
  it('declares pnpm as the single package manager', () => {
    expect(dependencyManifest.packageManager).toBe('pnpm@10.14.0');
    expect(existsSync(`${repoRoot}pnpm-workspace.yaml`)).toBe(true);
  });

  it('commits exactly one lockfile — pnpm-lock.yaml, never package-lock.json or yarn.lock', () => {
    expect(existsSync(`${repoRoot}pnpm-lock.yaml`)).toBe(true);
    expect(existsSync(`${repoRoot}package-lock.json`)).toBe(false);
    expect(existsSync(`${repoRoot}yarn.lock`)).toBe(false);
  });

  it('pins direct packages and the maintained Node floor exactly', () => {
    if (dependencyManifest.dependencies === undefined) {
      throw new Error('package.json must declare runtime dependencies');
    }

    if (dependencyManifest.devDependencies === undefined) {
      throw new Error('package.json must declare development dependencies');
    }

    const runtimeVersions = Object.values(dependencyManifest.dependencies);
    const developmentVersions = Object.values(dependencyManifest.devDependencies);
    const directVersions = [...runtimeVersions, ...developmentVersions];

    expect(directVersions.length).toBeGreaterThan(0);
    expect(directVersions.every((version) => exactPackageVersionPattern.test(version))).toBe(true);
    expect(dependencyManifest.engines).toEqual({ node: '>=22.12.0' });
    expect(dependencyManifest.pnpm).toBeUndefined();
  });
});
