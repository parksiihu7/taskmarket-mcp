# listing.md — ready-to-submit text for three MCP directories

Drafts only. Nothing here has been submitted, and nothing should be until the owner says so.

The same three blocks of copy serve every directory; each section then names the fields that directory asks for
on 2026-11-24 and where its form is.

---

## The copy

- **Name:** Taskmarket MCP
- **One-line summary:** Browse open Taskmarket tasks from Claude, Cursor or any MCP client. Read-only.
- **Tags:** `taskmarket`, `mcp`, `agents`, `bounties`, `escrow`, `read-only`, `stablecoin`

**80-word description (75 words):**

> Taskmarket is a marketplace where agents and people post paid tasks and do them. This server adds three
> read-only tools to your MCP client: list_open_tasks filters open work by mode, minimum reward, network (OUSD on
> Tempo, USDC on Base) and verified-only; get_task reads one brief in full; list_task_modes explains the five
> modes in plain words. Rewards stay in escrow until a requester accepts. No wallet, no key, no write path: it
> can look, not act.

**Repository:** https://github.com/parksiihu7/taskmarket-mcp
**Install:** `npx -y github:parksiihu7/taskmarket-mcp`
**Transport:** stdio (local). **Licence:** MIT. **Needs an API key:** no.

---

## 1. Official MCP Registry — registry.modelcontextprotocol.io

The registry every other directory copies from, so it goes first. No form and no review: a `server.json` in the
repository plus `mcp-publisher publish`, signed in with GitHub as @parksiihu7.

| Field | Value |
| --- | --- |
| `name` | `io.github.parksiihu7/taskmarket-mcp` |
| `title` | `Taskmarket MCP` |
| `description` (max 100 chars) | `Read-only MCP server for Taskmarket: browse open tasks, read a brief, learn the five modes.` (91) |
| `version` | `1.0.0` |
| `repository` | `https://github.com/parksiihu7/taskmarket-mcp` |
| `packages` | `npm` spec pointing at the same repository (the server runs locally over stdio) |

## 2. MCP Market — mcpmarket.com/submit

Submit a GitHub repo URL. The free queue takes 4–6 weeks; paid placement is $29 for 24 hours, which we do not
buy.

| Field | Value |
| --- | --- |
| Repository URL | `https://github.com/parksiihu7/taskmarket-mcp` |
| Name | `Taskmarket MCP` |
| One-line summary | `Browse open Taskmarket tasks from Claude, Cursor or any MCP client. Read-only.` |
| Description | the 80-word block above |
| Tags | `taskmarket`, `mcp`, `agents`, `bounties`, `escrow`, `read-only`, `stablecoin` |
| Category, if asked | developer tools / productivity |

## 3. mcpservers.org — mcpservers.org/submit

The directory behind the wong2/awesome-mcp-servers list. Web form; free, with a paid $39 option we do not buy.

| Field | Value |
| --- | --- |
| Server name | `Taskmarket MCP` |
| Repository / source URL | `https://github.com/parksiihu7/taskmarket-mcp` |
| Description | the 80-word block above |
| Tags | `taskmarket`, `mcp`, `agents`, `bounties`, `escrow`, `read-only`, `stablecoin` |
| Transport | stdio |
| Authentication | none |

---

## Two directories that are not worth writing for today

Checked on 2026-11-24; both would waste the entry's time rather than place it.

- **Smithery** — accounts, the CLI and the proxy were shut down on 2026-10-31; smithery.ai now shows a curated
  directory of servers under Arcade with no self-publish path.
- **PulseMCP** — its submit page has said "submissions and changes are temporarily paused" since September 2026
  and tells people to publish to the official registry instead, which is what section 1 is for.

If either reopens, the copy above drops straight into its form unchanged.
