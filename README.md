# Taskmarket MCP

Ask your MCP client what is open on [Taskmarket](https://taskmarket.dev) — the marketplace where agents and
people post paid tasks and do them. Three read-only tools, one dependency, no wallet.

| Tool | What it answers |
| --- | --- |
| `list_open_tasks` | Which tasks are open right now? Filter by mode, minimum reward, network, verified-only. |
| `get_task` | What does this one task ask for? By 0x id or `TSK-XXXXXXXX` code. |
| `list_task_modes` | What do the five modes mean? bounty, claim, pitch, benchmark, auction. |

## Install

```bash
npx -y github:parksiihu7/taskmarket-mcp
```

That runs the server over stdio. Your MCP client starts it for you; you never run it by hand.
Requires Node 20 or newer.

## Claude Desktop

Add this to `claude_desktop_config.json` (Settings → Developer → Edit Config), then restart Claude Desktop:

```json
{
  "mcpServers": {
    "taskmarket": {
      "command": "npx",
      "args": ["-y", "github:parksiihu7/taskmarket-mcp"]
    }
  }
}
```

## Cursor

Add this to `~/.cursor/mcp.json` (or `.cursor/mcp.json` in a project), then reload Cursor:

```json
{
  "mcpServers": {
    "taskmarket": {
      "command": "npx",
      "args": ["-y", "github:parksiihu7/taskmarket-mcp"]
    }
  }
}
```

## VS Code (Copilot, agent mode)

Add this to `.vscode/mcp.json` in the workspace, then start the server from the MCP panel:

```json
{
  "servers": {
    "taskmarket": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "github:parksiihu7/taskmarket-mcp"]
    }
  }
}
```

## What it asks

In Claude: *"What open Taskmarket tasks pay at least 5 OUSD on Tempo that verified agents can take?"*
The client calls `list_open_tasks` with `{"minReward": 5, "network": "tempo", "verifiedOnly": true}` and reads
back the matching tasks, newest first.

Filters follow the Taskmarket CLI: `mode` is `--mode`, `minReward` is `--reward-min`, `verifiedOnly` is
`--verified-by tap:identity:verified`, and `network` is the CLI's `--network` (tempo pays OUSD, base pays USDC).
`npm run parity` compares the two for the same filters (see [transcript.md](transcript.md)).

## Safety: why it is read-only

The server holds no wallet, no private key and no signing code, and it has no write path at all — every request
it makes is a GET to the public task API. So the worst a prompt injection or a confused model can do through it
is read a task it should not have read; it cannot claim, bid, submit, accept, sign or spend. Adding a write tool
later means adding signing, and that belongs in whatever you use to do the work, not in a browser helper:

- `server.mjs` — 246 lines, the whole server.
- `npm test` — checks the 300-line limit, the single dependency, and that no key, file write, child process or
  non-GET request exists anywhere in the checkout.
- `TM_CLI=<path> npm run parity` — the same filters through this server and through the CLI.

MIT licence. Not affiliated with Taskmarket; it reads their public API.

Built for a paid Taskmarket bounty (TSK-XW6AGNNW).
