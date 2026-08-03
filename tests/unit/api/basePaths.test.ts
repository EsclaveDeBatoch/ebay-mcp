import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/**
 * API base-path guard.
 *
 * Every area class prefixes its endpoints with a hand-written base-path literal,
 * while the authoritative value ships in the eBay OpenAPI spec this repo already
 * downloads and commits (`servers[0].variables.basePath.default`). Nothing tied the
 * two together, so three literals had drifted onto paths that belong to a different
 * API — or to no API at all:
 *
 * - eDelivery pointed at `/sell/logistics/v1`, a real but unrelated eBay API, so all
 *   27 eDelivery tools could only 404.
 * - Translation dropped the `_beta` suffix the still-beta API requires.
 * - Client Registration used the SDK's folder name (`client_registration`) rather
 *   than eBay's route (`registration`).
 *
 * Unit tests mocked the facade rather than the URL, so nothing caught it; the tests
 * that did assert URLs simply encoded the wrong ones. This guard inverts that: the
 * spec is the expectation, and the source literal has to match it.
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
 * Every base-path literal in `src/api`. A completeness check below fails when a new
 * one appears without being bound here, so a new API cannot ship an unverified path.
 *
 * Payment disputes live in the Fulfillment API, so `dispute.ts` shares its spec.
 */
const BASE_PATH_BINDINGS: readonly BasePathBinding[] = [
  {
    file: 'src/api/account-management/account.ts',
    constant: 'ACCOUNT_BASE_PATH',
    spec: 'specs/ebay/sell-apps/account-management/sell_account_v1_oas3.json',
  },
  {
    file: 'src/api/listing-management/shared.ts',
    constant: 'INVENTORY_BASE_PATH',
    spec: 'specs/ebay/sell-apps/listing-management/sell_inventory_v1_oas3.json',
  },
  {
    file: 'src/api/listing-metadata/metadata.ts',
    constant: 'basePath',
    spec: 'specs/ebay/sell-apps/listing-metadata/sell_metadata_v1_oas3.json',
  },
  {
    file: 'src/api/marketing-and-promotions/shared.ts',
    constant: 'MARKETING_BASE_PATH',
    spec: 'specs/ebay/sell-apps/marketing-and-promotions/sell_marketing_v1_oas3.json',
  },
  {
    file: 'src/api/order-management/fulfillment.ts',
    constant: 'basePath',
    spec: 'specs/ebay/sell-apps/order-management/sell_fulfillment_v1_oas3.json',
  },
  {
    file: 'src/api/order-management/dispute.ts',
    constant: 'basePath',
    spec: 'specs/ebay/sell-apps/order-management/sell_fulfillment_v1_oas3.json',
  },
  {
    file: 'src/api/other/compliance.ts',
    constant: 'basePath',
    spec: 'specs/ebay/sell-apps/other-apis/sell_compliance_v1_oas3.json',
  },
  {
    file: 'src/api/other/edelivery.ts',
    constant: 'basePath',
    spec: 'specs/ebay/sell-apps/other-apis/sell_edelivery_international_shipping_oas3.json',
  },
  {
    file: 'src/api/other/vero.ts',
    constant: 'basePath',
    spec: 'specs/ebay/sell-apps/other-apis/commerce_vero_v1_oas3.json',
  },
];

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
  it.each(BASE_PATH_BINDINGS)('$file $constant matches $spec', (binding) => {
    expect(readDeclaredBasePath(binding)).toBe(readSpecBasePath(binding.spec));
  });

  it('binds every base-path literal declared under src/api', () => {
    const bound = BASE_PATH_BINDINGS.map((binding) => `${binding.file}#${binding.constant}`);

    expect(new Set(bound).size).toBe(BASE_PATH_BINDINGS.length);
    expect(declaredBasePathKeys().sort()).toEqual([...bound].sort());
  });
});
