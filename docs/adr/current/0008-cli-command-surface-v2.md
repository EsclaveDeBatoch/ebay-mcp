# 0008 — Deterministic CLI command surface

**Status:** Accepted · 2026-08-03

## Context

The package entry currently mixes STDIO startup with a small hand-routed command surface,
while setup, diagnostics, skill installation, and development scripts use different stream,
prompt, and failure conventions. Agents need a stable non-interactive surface; humans still
benefit from the existing `prompts`-based TTY experience.

A new CLI framework would not remove meaningful complexity. Node's built-in `parseArgs`
already covers the approved command grammar.

## Decision

- Keep a small router based on `node:util` `parseArgs` and retain `prompts` for the TTY
  experience. Do not add Commander.
- A bare TTY invocation opens the interactive menu. A bare non-TTY invocation starts the
  STDIO MCP server.
- Public commands are:

  | Command | Behavior |
  | --- | --- |
  | `serve` | Start the selected MCP transport without prompting. |
  | `setup` | Configure credentials and OAuth; a bare TTY form may prompt. |
  | `diagnose [--json]` | Check configuration and connectivity. |
  | `skills install` | Install agent skills through the retained CLI implementation. |
  | `help [--json]` | Describe the stable public command surface. |
  | `version [--json]` | Print package/runtime version information. |

- Explicit flags and non-TTY invocations never prompt or hang.
- Command functions accept explicit dependencies and return `CommandCompletion`. Only the
  process entry reads global streams, writes output, or assigns `process.exitCode`.
- JSON mode writes exactly one JSON document to STDOUT. Diagnostics and runtime logs write
  to STDERR.
- Exit codes are `0` for success, `1` for an operational failure, `2` for invalid usage,
  and `130` for user cancellation.
- Shipped commands live in `src/cli/`. Development glue lives in `scripts/dev/`; production
  and release glue lives in `scripts/production/`. Package scripts call installed CLIs
  directly.

## Consequences

- Humans retain a useful menu while agents get deterministic command behavior and stable
  machine output.
- Command tests can invoke functions without patching global streams or process exits.
- `npm run test`, `typecheck`, `build`, and sync remain development commands rather than
  becoming public CLI subcommands.
- The current `src/index.ts` routing remains migration inventory until the CLI slice lands.

This record supersedes [0002](0002-cli-command-surface.md). The earlier record remains the
history of the first hand-router decision.
