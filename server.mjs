#!/usr/bin/env node
/**
 * Taskmarket MCP server — read-only.
 *
 * Three tools over stdio: list_open_tasks, get_task, list_task_modes.
 * The only data source is the public Taskmarket API (GET requests). There is no
 * wallet, no private key, no signing code and no write call in this file: every
 * request below is a fetch with no method option, so it is a GET.
 *
 * Start:  node server.mjs        (MCP on stdin/stdout, logs on stderr)
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";

const BASE = process.env.TASKMARKET_API_BASE ?? "https://taskmarket.dev/api";
const SITE = "https://taskmarket.dev";
const PAGE_SIZE = 100;
const MAX_PAGES = 10;
const TIMEOUT_MS = 15000;
const ATOMIC = 1_000_000; // rewards arrive in 6-decimal stablecoin units
const MODES = ["bounty", "claim", "pitch", "benchmark", "auction"];
const CHAINS = new Map([
  [4217, { network: "tempo", currency: "OUSD" }],
  [8453, { network: "base", currency: "USDC" }],
]);

const MODE_PLAIN = {
  bounty: "Many workers submit; the requester picks one or more winners.",
  claim: "One worker reserves the task.",
  pitch: "Workers pitch; the requester selects one.",
  benchmark: "Entries are ranked on a metric.",
  auction: "Workers bid on price.",
};

const log = (...a) => console.error("[taskmarket-mcp]", ...a);

/** GET JSON from the public API. No method is passed, so every call is a read. */
async function getJson(path, params = {}) {
  const url = new URL(BASE + path);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
  }
  const res = await fetch(url, {
    headers: { accept: "application/json", "user-agent": "taskmarket-mcp/1.0" },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) {
    throw new Error(`Taskmarket API replied ${res.status} ${res.statusText} for ${url.pathname}`);
  }
  return res.json();
}

/** Every open task, following the API's cursor until it runs out. */
async function openTasks() {
  const all = [];
  let cursor;
  for (let page = 0; page < MAX_PAGES; page += 1) {
    const body = await getJson("/tasks", { status: "open", limit: PAGE_SIZE, cursor });
    all.push(...(Array.isArray(body.tasks) ? body.tasks : []));
    if (!body.hasMore || !body.nextCursor) break;
    cursor = body.nextCursor;
  }
  return all;
}

const chainOf = (task) => CHAINS.get(task.chainId) ?? { network: `chain-${task.chainId}`, currency: "stablecoin" };
const atomic = (task) => Number(task.netReward ?? task.reward ?? 0);
const isVerifiedOnly = (task) => Array.isArray(task.verifiedBy) && task.verifiedBy.includes("tap:identity:verified");
const firstLine = (task) => String(task.description ?? "").split("\n")[0].trim();

/** The one shape the tools return, so list and get speak the same language. */
function brief(task) {
  const chain = chainOf(task);
  return {
    id: task.id,
    referenceCode: task.referenceCode,
    title: firstLine(task),
    mode: task.mode,
    reward: atomic(task) / ATOMIC,
    currency: chain.currency,
    network: chain.network,
    status: task.status,
    phase: task.phase,
    expiresAt: task.expiryTime,
    tags: task.tags ?? [],
    verifiedWorkersRequired: isVerifiedOnly(task),
    submissions: task.submissionCount ?? 0,
    requester: task.requesterDisplayName ?? null,
    url: `${SITE}/tasks/${task.id}`,
  };
}

function detail(task) {
  return {
    ...brief(task),
    description: task.description,
    createdAt: task.createdAt,
    escrowTxHash: task.escrowTxHash ?? null,
    rewards: { escrow: atomic(task) / ATOMIC, currency: chainOf(task).currency },
    awards: task.awardCount ?? 0,
    pitchDeadline: task.pitchDeadline ?? null,
    bidDeadline: task.bidDeadline ?? null,
    submissionWindowOpen: task.submissionWindowOpen ?? null,
    visibility: { task: task.taskVisibility ?? null, submissions: task.submissionVisibility ?? null },
  };
}

/** Same filter set as the CLI: mode, minimum reward, network, verified-only. */
function matching(tasks, { mode, minReward, network, verifiedOnly }) {
  const floor = minReward === undefined || minReward === null ? null : Math.round(Number(minReward) * ATOMIC);
  return tasks.filter((task) => {
    if (mode && task.mode !== mode) return false;
    if (network && network !== "any" && chainOf(task).network !== network) return false;
    if (verifiedOnly === true && !isVerifiedOnly(task)) return false;
    if (floor !== null && atomic(task) < floor) return false;
    return true;
  });
}

const text = (value, isError = false) => ({
  content: [{ type: "text", text: typeof value === "string" ? value : JSON.stringify(value, null, 2) }],
  ...(isError ? { isError: true } : {}),
});

const TOOLS = [
  {
    name: "list_open_tasks",
    title: "List open Taskmarket tasks",
    description:
      "Browse tasks that are open for submission on Taskmarket. Filter by mode (bounty, claim, pitch, " +
      "benchmark, auction), minimum reward in whole stablecoin units, network (tempo pays OUSD, base pays " +
      "USDC) and verified-only. Newest first. Read-only.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      properties: {
        mode: { type: "string", enum: MODES, description: "Task mode to keep." },
        minReward: { type: "number", minimum: 0, description: "Keep tasks whose reward is at least this many OUSD or USDC." },
        network: { type: "string", enum: ["tempo", "base", "any"], default: "any", description: "tempo = OUSD, base = USDC, any = both." },
        verifiedOnly: { type: "boolean", default: false, description: "Keep only tasks restricted to verified workers (TAP)." },
        limit: { type: "integer", minimum: 1, maximum: 100, default: 10, description: "How many tasks to return." },
      },
    },
    annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: true },
  },
  {
    name: "get_task",
    title: "Get one Taskmarket task",
    description:
      "Read one task in full: reward, mode, network, expiry, tags, submission count and the complete brief. " +
      "Takes a 0x task id or a TSK-XXXXXXXX reference code. Read-only.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      required: ["id"],
      properties: {
        id: { type: "string", description: "Task id (0x…) or reference code (TSK-XXXXXXXX)." },
      },
    },
    annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: true },
  },
  {
    name: "list_task_modes",
    title: "Explain the five task modes",
    description: "The five Taskmarket task modes in plain words, and which currency each network pays. Read-only.",
    inputSchema: { type: "object", additionalProperties: false, properties: {} },
    annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
  },
];

const server = new Server(
  { name: "taskmarket-mcp", version: "1.0.0" },
  {
    capabilities: { tools: {} },
    instructions:
      "Read-only access to Taskmarket (https://taskmarket.dev), a marketplace where agents and people post " +
      "paid tasks and do them. Rewards are held in escrow and paid in OUSD on Tempo or USDC on Base. " +
      "This server can only read: it cannot claim, submit, sign or spend.",
  },
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args = {} } = request.params;
  try {
    if (name === "list_open_tasks") {
      const limit = Math.min(Math.max(Number(args.limit ?? 10) || 10, 1), 100);
      const filters = {
        mode: args.mode ?? null,
        minReward: args.minReward ?? null,
        network: args.network ?? "any",
        verifiedOnly: args.verifiedOnly === true,
      };
      const all = await openTasks();
      const kept = matching(all, filters);
      return text({
        tool: "list_open_tasks",
        filters: { ...filters, limit },
        openTasksOnBoard: all.length,
        matched: kept.length,
        returned: Math.min(kept.length, limit),
        tasks: kept.slice(0, limit).map(brief),
      });
    }

    if (name === "get_task") {
      const id = String(args.id ?? "").trim();
      if (!id) return text("get_task needs an id: a 0x task id or a TSK-XXXXXXXX reference code.", true);
      if (/^0x[0-9a-f]{64}$/i.test(id)) {
        return text({ tool: "get_task", task: detail(await getJson(`/tasks/${id}`)) });
      }
      if (/^TSK-[0-9A-Z]{8}$/i.test(id)) {
        const found = (await openTasks()).find((task) => String(task.referenceCode).toUpperCase() === id.toUpperCase());
        if (!found) {
          return text(`No open task has reference code ${id.toUpperCase()}. Reference codes resolve for listed tasks only; pass the 0x task id instead.`, true);
        }
        return text({ tool: "get_task", task: detail(found) });
      }
      return text("Not a task id: expected 0x… (64 hex characters) or a TSK-XXXXXXXX reference code.", true);
    }

    if (name === "list_task_modes") {
      return text({
        tool: "list_task_modes",
        modes: MODES.map((mode) => ({ mode, plain: MODE_PLAIN[mode] })),
        networks: [
          { network: "tempo", chainId: 4217, currency: "OUSD" },
          { network: "base", chainId: 8453, currency: "USDC" },
        ],
        note: "A reward is held in escrow before anyone starts and released when the requester accepts a result.",
      });
    }

    return text(`Unknown tool: ${name}`, true);
  } catch (error) {
    log(name, "failed:", error?.message ?? error);
    return text(`${name} failed: ${error?.message ?? error}`, true);
  }
});

await server.connect(new StdioServerTransport());
log("ready on stdio (read-only)");
