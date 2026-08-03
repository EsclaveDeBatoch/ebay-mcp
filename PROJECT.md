# PROJECT.md

Purpose and direction for **ebay-mcp**. Read [CONTEXT.md](CONTEXT.md) for the runtime
shape and [AGENTS.md](AGENTS.md) before changing code.

## Problem

AI assistants can reason about selling on eBay but cannot act on the complete Sell API
without substantial authentication, schema, transport, and tool-wiring work. eBay splits
that surface across modern REST APIs and the legacy Trading XML API.

## Purpose

Give any MCP-capable assistant a complete, typed, authenticated local interface to eBay's
selling APIs so an agent can list, fulfil, market, and analyse without bespoke integration
code.

## Users

- Developers connecting eBay operations to an MCP host.
- Sellers and operators driving eBay workflows through an assistant.
- Contributors keeping tool coverage aligned with eBay's changing specifications.

## Product boundaries

- The repository exposes 298 tools covering the current Sell surface.
- OAuth, token refresh, STDIO, HTTP, setup, diagnostics, and agent-skill installation are
  part of the product.
- The service runs locally or in a user-controlled container; it is not a hosted
  multi-tenant platform.
- The MCP tool surface is the product. The MCP Apps browser layer is a focused
  presentation surface, not a second application architecture.

## Direction

- Keep 100% operation coverage while eBay specifications change.
- Make repository navigation match eBay's official namespace, API, and resource topology.
- Replace the current Effect and schema-adapter stack with native promises and direct Zod
  4 boundary validation.
- Preserve generated eBay documents exactly through the operation boundary; presentation
  code alone may project them for the browser.
- Keep agent context lean through official namespace exposure gates and dynamic discovery.
- Ship the cleanup as independently green resource slices with no compatibility exports or
  legacy aliases.
- Keep only dependencies that own a named product, generation, or test responsibility.

The approved migration architecture is recorded in
[ADR 0007](docs/adr/current/0007-promise-zod-resource-architecture.md); the ordered target
tree is in [ARCHITECTURE.md](ARCHITECTURE.md).

## Constraints

- ESM TypeScript, pnpm, strict typechecking, and named exports.
- The current package still declares Node 20 while the approved dependency-foundation
  slice moves the minimum to Node 22.12 and tests Node 22 and 24.
- STDOUT is the MCP protocol channel in server mode; runtime logs use structured STDERR.
- Specifications and generated TypeScript are machine-owned and never hand-edited.
- Releases are tag-driven. The merged pull request's `major` or `minor` label chooses the
  release bump; an unlabelled pull request produces a patch.
