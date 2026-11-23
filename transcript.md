# transcript — the three tools in an MCP client

A real session, recorded 2026-11-24 05:18 KST (2026-11-23 20:18 UTC), Node v24.22.3, Linux.

**Client.** The official MCP SDK's own client (`@modelcontextprotocol/sdk`: `Client` with `StdioClientTransport`),
which is the same stdio connection Claude Desktop, Cursor and VS Code open when they launch a server from their
config file. Those desktop apps cannot run in this environment, so the client is the SDK's: every byte below came
back over that stdio connection, nothing is hand-written.

**Server.** `server.mjs` from this repository, started by the client. The only other thing it talks to is the
public Taskmarket API it reads.

Reproduce:

```bash
node scripts/session.mjs
```

## 1. Connect and discover — `tools/list`

```text
[taskmarket-mcp] ready on stdio (read-only)
connected: taskmarket-mcp 1.0.0
```

```text
→ tools/list
{
  "tools": [
    {
      "name": "list_open_tasks",
      "description": "[the task brief, 4019 characters — truncated in this file so it stays readable; the tool sends the whole text. Run node scripts/session.mjs to see it]",
    "createdAt": "2026-11-23T20:06:17.195Z",
    "escrowTxHash": "0x5e020f3e2abfc04948cff7c35c82be8b45a0d16111ad8eb6b45147af9386a1fb",
    "rewards": {
      "escrow": 10,
      "currency": "OUSD"
    },
    "awards": 0,
    "pitchDeadline": null,
    "bidDeadline": null,
    "submissionWindowOpen": true,
    "visibility": {
      "task": "public",
      "submissions": "public"
    }
  }
}
```

## 4. `list_task_modes`

```text
→ tools/call  list_task_modes {}
```

```json
{
  "tool": "list_task_modes",
  "modes": [
    {
      "mode": "bounty",
      "plain": "Many workers submit; the requester picks one or more winners."
    },
    {
      "mode": "claim",
      "plain": "One worker reserves the task."
    },
    {
      "mode": "pitch",
      "plain": "Workers pitch; the requester selects one."
    },
    {
      "mode": "benchmark",
      "plain": "Entries are ranked on a metric."
    },
    {
      "mode": "auction",
      "plain": "Workers bid on price."
    }
  ],
  "networks": [
    {
      "network": "tempo",
      "chainId": 4217,
      "currency": "OUSD"
    },
    {
      "network": "base",
      "chainId": 8453,
      "currency": "USDC"
    }
  ],
  "note": "A reward is held in escrow before anyone starts and released when the requester accepts a result."
}
```

## 5. The same filters, server against CLI, whole lists

`npm run parity` compares every id, not the first five, over seven filter sets. Recorded 2026-11-24 05:21 KST:

```text
[taskmarket-mcp] ready on stdio (read-only)
match  no filter, tempo  server 56 / cli 56
match  mode=bounty, tempo  server 56 / cli 56
match  minReward=5, tempo  server 15 / cli 15
match  verifiedOnly, tempo  server 30 / cli 30
match  mode=bounty, minReward=5, verifiedOnly, tempo  server 15 / cli 15
match  no filter, base  server 6 / cli 6
match  mode=bounty, base  server 6 / cli 6

parity: every case matches
```

Counts move as tasks open and close; the comparison is the match, not the number.
