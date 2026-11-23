# Start here

**Taskmarket MCP** — a read-only MCP server so any MCP client can answer *"what open Taskmarket tasks fit me?"*
Three tools, one dependency, no wallet.

- Repository: https://github.com/parksiihu7/taskmarket-mcp (public, MIT)
- One command: `npx -y github:parksiihu7/taskmarket-mcp`
- Licence: MIT

## The five deliverables, and where they are

| Asked for | File |
| --- | --- |
| The MCP server: Node 20+, stdio, ≤300 lines, MCP SDK only dependency, three read-only tools | `server.mjs` (246 lines) + `package.json` |
| README ≤120 lines: one-command install, config for three clients, why read-only | `README.md` (99 lines) |
| A real MCP session, all three tools answering, the CLI for the same filters beside it | `transcript.md` |
| Listing text for three MCP directories (drafts only) | `listing.md` |
| Every claim mapped to the fact sheet | `notes.txt` |

Also in the repository: `test/contract.mjs` (the entry's acceptance points as 17 checks), `test/parity.mjs`
(server against CLI), `scripts/session.mjs` (the client that recorded the transcript).

## Two minutes, in this order

1. `transcript.md` section 2 and 5 — the tools answering, and seven filter sets matching the CLI id for id.
2. `server.mjs` — 246 lines, one file; `grep -n fetch server.mjs` shows the only network calls, all GETs.
3. `listing.md` — the copy that would go to the registry and two directories, if the owner decides to publish.

## What was verified, and how

- Clean checkout from the repository tarball → `npm ci` → `node server.mjs` starts ("ready on stdio"). Recorded
  2026-11-24 05:58 KST.
- `npm test` → 17 of 17 checks pass: the 300-line limit, one dependency, no key material, no file write, no child
  process, no non-GET request, and the three tools answering.
- `npm run parity` → 7 of 7 filter sets identical to the Taskmarket CLI, in the same order (2026-11-24 05:21 KST).

## What was not verified here, stated plainly

- `npx -y github:parksiihu7/taskmarket-mcp` was not run in the machine that built this: its git network access is
  blocked by policy, so the repository tarball route above was run instead, from the same commit. On a machine
  with git, the npx line is the ordinary way to run a public repository.
- Claude Desktop, Cursor and VS Code cannot run there either. `transcript.md` is a real session with the MCP
  SDK's own client over the same stdio transport those clients use, and says so at the top.
