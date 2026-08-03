# 0009 — Maintained runtime and exact dependency baseline

**Status:** Accepted · 2026-08-03

## Context

The repository currently declares Node 20, uses dependency ranges, carries an Effect/Zod 3
adapter stack selected by an earlier architecture, and has direct packages whose final
callers are scheduled for deletion. The approval audit found six high and four moderate
advisories, with no critical advisory.

The architecture migration needs one reviewed foundation so resource slices do not each
solve runtime, schema, build, or audit drift differently.

## Decision

- Require Node 22.12 or newer and run maintained Node 22 and 24 in CI.
- Pin every direct runtime and development dependency to an exact reviewed version.
- Adopt the reviewed compatible baseline: MCP SDK 1.30.x, a compatible MCP Apps package,
  Zod 4.4.x, TypeScript 6.0.x, and Vite 8.2.x.
- Defer TypeScript 7 until its programmatic API is stable enough for the generator and
  build tooling.
- Move pnpm overrides from `package.json` to `pnpm-workspace.yaml` and keep only active,
  explained security overrides.
- Remove these packages after their final callers move:
  - `effect`
  - `zod-to-json-schema`
  - `winston`
  - `update-notifier` and `@types/update-notifier`
  - `dotenv-stringify` and its custom declaration
- Keep packages only for these explicit responsibilities:
  - `express`, `cors`, and `helmet` for the HTTP transport and security policy.
  - `jose` for OAuth/JWT work.
  - `fast-xml-parser` for Trading XML.
  - `dotenv` for environment-file parsing.
  - `prompts` and `chalk` for the human TTY experience.
  - `react` and `react-dom` for MCP Apps.
  - `openapi-typescript` for official generated TypeScript.
  - `tsc-alias` until a simpler emitted-alias strategy is proven.
  - `vite-plugin-singlefile`, Vitest, Nock, and Supertest for their distinct build and test
    boundaries.
- Treat a clean compatible audit and the full CI gate as blocking for the dependency
  foundation.

## Consequences

- The dependency pull request must update package metadata, lockfile, workspace overrides,
  CI matrices, generated code, and tests together.
- Effect remains temporarily installed only while unmigrated resources still call it; it is
  not allowed in new or migrated code.
- Removing logging, update, serialization, and schema packages waits for verified final
  caller deletion rather than speculative package removal.
- Exact versions make security and upgrade review deliberate and reproducible.

This record supersedes the dependency direction in
[0003](0003-dependency-decisions.md) and the Node 20 matrix portion of
[0004](0004-ci-workflow-architecture.md).
