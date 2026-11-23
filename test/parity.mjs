#!/usr/bin/env node
/**
 * Parity check: the same filters through this server and through the Taskmarket
 * CLI should list the same tasks in the same order.
 *
 * The CLI is not a dependency of the server, so this runs only when you point it
 * at one:  TM_CLI=/path/to/@lucid-agents/taskmarket/dist/index.js npm run parity
 */
import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const cli = process.env.TM_CLI;
if (!cli) {
  console.log("skipped: set TM_CLI to the taskmarket CLI entry point to compare against it");
  process.exit(0);
}

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const transport = new StdioClientTransport({ command: process.execPath, args: [join(root, "server.mjs")], stderr: "inherit" });
const client = new Client({ name: "parity-check", version: "1.0.0" });
await client.connect(transport);

const cliList = (filters) => {
  const args = [cli, "--network", filters.network === "base" ? "base" : "tempo", "task", "list", "--status", "open", "--limit", "100"];
  if (filters.mode) args.push("--mode", filters.mode);
  if (filters.minReward) args.push("--reward-min", String(filters.minReward));
  if (filters.verifiedOnly) args.push("--verified-by", "tap:identity:verified");
  const out = JSON.parse(execFileSync(process.execPath, args, { encoding: "utf8", env: process.env }));
  return (out.data?.tasks ?? []).map((task) => task.id);
};

const cases = [
  { label: "no filter, tempo", network: "tempo" },
  { label: "mode=bounty, tempo", mode: "bounty", network: "tempo" },
  { label: "minReward=5, tempo", minReward: 5, network: "tempo" },
  { label: "verifiedOnly, tempo", verifiedOnly: true, network: "tempo" },
  { label: "mode=bounty, minReward=5, verifiedOnly, tempo", mode: "bounty", minReward: 5, verifiedOnly: true, network: "tempo" },
  { label: "no filter, base", network: "base" },
  { label: "mode=bounty, base", mode: "bounty", network: "base" },
];

let failures = 0;
for (const item of cases) {
  const { label, ...filters } = item;
  const mine = (
    await client.callTool({ name: "list_open_tasks", arguments: { ...filters, limit: 100 } })
  ).content[0].text;
  const ids = JSON.parse(mine).tasks.map((task) => task.id);
  const theirs = cliList(filters);
  const same = ids.length === theirs.length && ids.every((id, index) => id === theirs[index]);
  console.log(`${same ? "match" : "DIFF "}  ${label}  server ${ids.length} / cli ${theirs.length}`);
  if (!same) {
    failures += 1;
    console.log(`   only in server: ${ids.filter((id) => !theirs.includes(id)).join(", ") || "-"}`);
    console.log(`   only in cli:    ${theirs.filter((id) => !ids.includes(id)).join(", ") || "-"}`);
  }
}

await client.close();
console.log(failures === 0 ? "\nparity: every case matches" : `\nparity: ${failures} case(s) differ`);
process.exit(failures === 0 ? 0 : 1);
