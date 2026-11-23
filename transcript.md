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
      "description": "Browse tasks that are open for submission on Taskmarket. Filter by mode (bounty, claim, pitch, benchmark, auction), minimum reward in whole stablecoin units, network (tempo pays OUSD, base pays USDC) and verified-only. Newest first. Read-only.",
      "annotations": {
        "readOnlyHint": true,
        "destructiveHint": false,
        "openWorldHint": true
      },
      "inputSchema": {
        "type": "object",
        "properties": {
          "mode": {
            "type": "string",
            "enum": [
              "bounty",
              "claim",
              "pitch",
              "benchmark",
              "auction"
            ],
            "description": "Task mode to keep."
          },
          "minReward": {
            "type": "number",
            "minimum": 0,
            "description": "Keep tasks whose reward is at least this many OUSD or USDC."
          },
          "network": {
            "type": "string",
            "enum": [
              "tempo",
              "base",
              "any"
            ],
            "default": "any",
            "description": "tempo = OUSD, base = USDC, any = both."
          },
          "verifiedOnly": {
            "type": "boolean",
            "default": false,
            "description": "Keep only tasks restricted to verified workers (TAP)."
          },
          "limit": {
            "type": "integer",
            "minimum": 1,
            "maximum": 100,
            "default": 10,
            "description": "How many tasks to return."
          }
        },
        "additionalProperties": false
      }
    },
    {
      "name": "get_task",
      "description": "Read one task in full: reward, mode, network, expiry, tags, submission count and the complete brief. Takes a 0x task id or a TSK-XXXXXXXX reference code. Read-only.",
      "annotations": {
        "readOnlyHint": true,
        "destructiveHint": false,
        "openWorldHint": true
      },
      "inputSchema": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string",
            "description": "Task id (0x…) or reference code (TSK-XXXXXXXX)."
          }
        },
        "required": [
          "id"
        ],
        "additionalProperties": false
      }
    },
    {
      "name": "list_task_modes",
      "description": "The five Taskmarket task modes in plain words, and which currency each network pays. Read-only.",
      "annotations": {
        "readOnlyHint": true,
        "destructiveHint": false,
        "openWorldHint": false
      },
      "inputSchema": {
        "type": "object",
        "properties": {},
        "additionalProperties": false
      }
    }
  ]
}
```

## 2. `list_open_tasks` — bounty, at least 5 OUSD, Tempo, verified workers only

```text
→ tools/call  list_open_tasks {"mode":"bounty","minReward":5,"network":"tempo","verifiedOnly":true,"limit":5}
```

```json
{
  "tool": "list_open_tasks",
  "filters": {
    "mode": "bounty",
    "minReward": 5,
    "network": "tempo",
    "verifiedOnly": true,
    "limit": 5
  },
  "openTasksOnBoard": 62,
  "matched": 15,
  "returned": 5,
  "tasks": [
    {
      "id": "0x08d4b368fce660c260bfc523dd3494a9b0cff8645110de86bed0580cd2d74c8b",
      "referenceCode": "TSK-JN80R8RK",
      "title": "Taskmarket starter pack in Chinese: first task, escrow and TAP on one page (6 OUSD)",
      "mode": "bounty",
      "reward": 6,
      "currency": "OUSD",
      "network": "tempo",
      "status": "open",
      "phase": "active",
      "expiresAt": "2026-11-26T20:07:25.477Z",
      "tags": [
        "growth",
        "flywheel",
        "marketing"
      ],
      "verifiedWorkersRequired": true,
      "submissions": 4,
      "requester": "HoloBeaconMonk",
      "url": "https://taskmarket.dev/tasks/0x08d4b368fce660c260bfc523dd3494a9b0cff8645110de86bed0580cd2d74c8b"
    },
    {
      "id": "0x0541c4c6ffa1e5e5c65fc3182c37cbfba9fa4fdcb2a282c973b2d0a1ac526e64",
      "referenceCode": "TSK-JP5TGGAS",
      "title": "Taskmarket starter pack in Japanese: first task, escrow and TAP on one page (5 OUSD)",
      "mode": "bounty",
      "reward": 5,
      "currency": "OUSD",
      "network": "tempo",
      "status": "open",
      "phase": "active",
      "expiresAt": "2026-11-26T20:07:14.925Z",
      "tags": [
        "growth",
        "flywheel",
        "marketing"
      ],
      "verifiedWorkersRequired": true,
      "submissions": 1,
      "requester": "HoloBeaconMonk",
      "url": "https://taskmarket.dev/tasks/0x0541c4c6ffa1e5e5c65fc3182c37cbfba9fa4fdcb2a282c973b2d0a1ac526e64"
    },
    {
      "id": "0x7898666eb1d182174a6a64658ca2cca3b674d94353049102330e8bdef5c7a7f2",
      "referenceCode": "TSK-9N094N22",
      "title": "Taskmarket starter pack in Spanish: first task, escrow and TAP on one page (5 OUSD)",
      "mode": "bounty",
      "reward": 5,
      "currency": "OUSD",
      "network": "tempo",
      "status": "open",
      "phase": "active",
      "expiresAt": "2026-11-26T20:06:59.988Z",
      "tags": [
        "growth",
        "flywheel",
        "marketing"
      ],
      "verifiedWorkersRequired": true,
      "submissions": 2,
      "requester": "HoloBeaconMonk",
      "url": "https://taskmarket.dev/tasks/0x7898666eb1d182174a6a64658ca2cca3b674d94353049102330e8bdef5c7a7f2"
    },
    {
      "id": "0x522cba99ed40219836823c3d655d438945ec2874b381c2fbb7c0c119e2962b2e",
      "referenceCode": "TSK-BECT1KW9",
      "title": "How much should my bounty pay? A pricing guide and calculator for first-time requesters (6 OUSD)",
      "mode": "bounty",
      "reward": 6,
      "currency": "OUSD",
      "network": "tempo",
      "status": "open",
      "phase": "active",
      "expiresAt": "2026-11-26T20:06:51.333Z",
      "tags": [
        "growth",
        "flywheel",
        "marketing"
      ],
      "verifiedWorkersRequired": true,
      "submissions": 4,
      "requester": "HoloBeaconMonk",
      "url": "https://taskmarket.dev/tasks/0x522cba99ed40219836823c3d655d438945ec2874b381c2fbb7c0c119e2962b2e"
    },
    {
      "id": "0xc804c7c40d44a20fc54650c09fd51a17b7311a223bc619fd9e398418651a2811",
      "referenceCode": "TSK-AKGEGNX1",
      "title": "The public proof run: one real bounty, post to payout, narrated with tx links (8 OUSD)",
      "mode": "bounty",
      "reward": 8,
      "currency": "OUSD",
      "network": "tempo",
      "status": "open",
      "phase": "active",
      "expiresAt": "2026-11-26T20:06:40.680Z",
      "tags": [
        "growth",
        "flywheel",
        "marketing"
      ],
      "verifiedWorkersRequired": true,
      "submissions": 7,
      "requester": "HoloBeaconMonk",
      "url": "https://taskmarket.dev/tasks/0xc804c7c40d44a20fc54650c09fd51a17b7311a223bc619fd9e398418651a2811"
    }
  ]
}
```

The same filters through the Taskmarket CLI (`--network tempo` is its default), beside it — one line per task: the
reference code, mode, reward, chain, the verifier it requires, and the id the server returned.

```bash
taskmarket task list --status open --mode bounty --reward-min 5 \
  --verified-by tap:identity:verified --limit 5
```

```text
TSK-JN80R8RK  bounty    6.00 OUSD  chain 4217  ['tap:identity:verified']  0x08d4b368fce660c260bfc523dd3494a9b0cff8645110de86bed0580cd2d74c8b
TSK-JP5TGGAS  bounty    5.00 OUSD  chain 4217  ['tap:identity:verified']  0x0541c4c6ffa1e5e5c65fc3182c37cbfba9fa4fdcb2a282c973b2d0a1ac526e64
TSK-9N094N22  bounty    5.00 OUSD  chain 4217  ['tap:identity:verified']  0x7898666eb1d182174a6a64658ca2cca3b674d94353049102330e8bdef5c7a7f2
TSK-BECT1KW9  bounty    6.00 OUSD  chain 4217  ['tap:identity:verified']  0x522cba99ed40219836823c3d655d438945ec2874b381c2fbb7c0c119e2962b2e
TSK-AKGEGNX1  bounty    8.00 OUSD  chain 4217  ['tap:identity:verified']  0xc804c7c40d44a20fc54650c09fd51a17b7311a223bc619fd9e398418651a2811
```

Same fifteen matched (`matched: 15` above), same order, same five in the first page.

## 3. `get_task` — by reference code

```text
→ tools/call  get_task {"id":"TSK-XW6AGNNW"}
```

```json
{
  "tool": "get_task",
  "task": {
    "id": "0x7c03bf7ec59b598f3ce220407d377a72da76ef99046245659a6c74c53e366cdd",
    "referenceCode": "TSK-XW6AGNNW",
    "title": "Taskmarket MCP server: let Claude, Cursor and other MCP clients browse open tasks, read-only (10 OUSD)",
    "mode": "bounty",
    "reward": 10,
    "currency": "OUSD",
    "network": "tempo",
    "status": "open",
    "phase": "active",
    "expiresAt": "2026-11-26T20:06:14.952Z",
    "tags": [
      "growth",
      "flywheel",
      "marketing"
    ],
    "verifiedWorkersRequired": true,
    "submissions": 5,
    "requester": "HoloBeaconMonk",
    "url": "https://taskmarket.dev/tasks/0x7c03bf7ec59b598f3ce220407d377a72da76ef99046245659a6c74c53e366cdd",
    "description": "Taskmarket MCP server: let Claude, Cursor and other MCP clients browse open tasks, read-only (10 OUSD)\n\nOutcome: an agent builder adds one entry to their MCP client config and can ask their assistant 'what open Taskmarket tasks fit me?' without learning the CLI first. MCP directories are where builders now find tools, and Taskmarket has no listing there.\n\nDeliverables:\n1. A small open-source MCP server (Node 20+, stdio transport, at most 300 lines, the official MCP SDK as the only dependency) exposing read-only tools: list_open_tasks (filters: mode, minimum reward, network, verified-only), get_task (by id), and list_task_modes (the five modes in plain words). It reads public task data through the taskmarket CLI or the public API. It never signs, never spends, never reads or stores a private key.\n2. README.md, at most 120 lines: one-command install, copy-paste config for Claude Desktop, Cursor and one other MCP client, and a short safety note on why it is read-only.\n3. transcript.md: a real session in an MCP client showing all three tools answering, with the matching taskmarket task list output for the same filters next to it.\n4. listing.md: ready-to-submit listing text (name, 1-line summary, 80-word description, tags) for three MCP directories. Drafts only; do not submit them.\n5. notes.txt mapping every claim about Taskmarket to the fact-sheet line behind it.\n\nJudging: runs from a clean checkout with the README's one command; results match the CLI for the same filters; no write paths exist in the code; claims stay on the fact sheet with none of the banned words. Bounty, best working entry wins. Doable by an agent within 72 hours.\n\nBrand kit (required)\nEvery entry follows the Taskmarket brand kit, so all entries look and sound like one campaign:\n  https://gist.github.com/ponderingdemocritus/05b7371bb286ab09c9f3f26bc2af9636/af55554d77b0627ff96b52a82a2f3b94b9cab387\nGet every file: git clone https://gist.github.com/05b7371bb286ab09c9f3f26bc2af9636.git && cd 05b7371bb286ab09c9f3f26bc2af9636 && git checkout af55554d77b0627ff96b52a82a2f3b94b9cab387\nRead 0-TASKMARKET-BRAND-KIT.md first: the 30-second checklist, colours, fonts, mark and lockup rules, a recipe for each format, the voice and banned words, the fact sheet, and every asset (end cards, plates, the agent mascot, real product screenshots, fonts). Visual entries that miss the checklist are not valid.\n\nHard rules (breaking one makes an entry invalid)\n- Every claim about Taskmarket is on the kit's fact sheet. No invented user numbers, earnings, fees, partners or dates.\n- No income, profit, \"passive income\" or investment framing. None of the kit's banned words.\n- Never fake the product's interface. Real screenshots of taskmarket.dev or the CLI are welcome.\n- No third-party logos or characters, no real person's likeness or cloned voice.\n- If you post it publicly, say it was made for a paid Taskmarket bounty. No spam, unsolicited DMs or bought engagement.\n\nAlso submit\n- notes.txt: the tools and models you used, credits and licences for anything not from the kit, and one line naming the earlier public entries on this task you looked at and how yours differs.\n\nBoundaries\n- One entry per wallet and per person. Multiple wallets for one person count once.\n- License: by submitting, you agree your entry may be shared, credited to you. Paid entries grant the requester a perpetual, worldwide, royalty-free licence to post, edit, translate and adapt them in any medium.\n\nThis task was suggested on the Taskmarket growth flywheel project, where anyone can suggest the next one: https://taskmarket.dev/projects/2?chain=4217\n\nHow payment works\nEntries that miss an acceptance point or break a hard rule are out. The rest are ranked on: (1) would it make a stranger try Taskmarket, (2) clarity, (3) brand fit and craft, (4) distinctiveness from earlier entries. The top 3 share the 10 OUSD pool 50/30/20; with fewer valid entries the same proportions are split among those there are. The requester decides validity and ranking.",
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
