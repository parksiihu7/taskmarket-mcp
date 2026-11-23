#!/usr/bin/env node
/**
 * Contract checks for the entry itself: the size limit, the single dependency,
 * the absence of every write path, and the three tools answering over stdio.
 *
 * Run: npm test
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const source = readFileSync(join(root, "server.mjs"), "utf8");
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));

let failures = 0;
const check = (name, pass, detail = "") => {
  console.log(`${pass ? "pass" : "FAIL"}  ${name}${detail ? `  (${detail})` : ""}`);
  if (!pass) failures += 1;
};

const lines = source.split("\n").length;
check("server.mjs is at most 300 lines", lines <= 300, `${lines} lines`);

const deps = Object.keys(pkg.dependencies ?? {});
check("one dependency: the official MCP SDK", deps.length === 1 && deps[0] === "@modelcontextprotocol/sdk", deps.join(", "));

const forbidden = [
  ["wallet or key handling", /\b(privateKey|private_key|keystore|mnemonic|seedPhrase|signTransaction|signTypedData)\b/i],
  ["a write to disk", /\b(writeFile|appendFile|createWriteStream|mkdir|rmSync|unlink)\b/],
  ["a child process", /\b(child_process|execSync|spawnSync|spawn)\b/],
  ["a non-GET request", /method:\s*["'](POST|PUT|PATCH|DELETE)["']/i],
  ["a Taskmarket write endpoint", /\/api\/(submissions|claims|bids|pitches)/],
];
for (const [label, pattern] of forbidden) {
  check(`no ${label} in server.mjs`, !pattern.test(source));
}

const files = [];
const walk = (dir) => {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (entry === "node_modules" || entry.startsWith(".")) continue;
    if (statSync(path).isDirectory()) walk(path);
    else files.push(path);
  }
};
walk(root);
const secrets = files.filter((file) => /BEGIN [A-Z ]*PRIVATE KEY|0x[0-9a-f]{64}["']\s*,?\s*$/m.test(readFileSync(file, "utf8")));
check("no private key anywhere in the checkout", secrets.length === 0, secrets.join(", "));

const transport = new StdioClientTransport({ command: process.execPath, args: [join(root, "server.mjs")], stderr: "inherit" });
const client = new Client({ name: "contract-test", version: "1.0.0" });
await client.connect(transport);

const listed = await client.listTools();
const names = listed.tools.map((tool) => tool.name).sort();
check("three read-only tools are listed", JSON.stringify(names) === JSON.stringify(["get_task", "list_open_tasks", "list_task_modes"]), names.join(", "));
check("every tool is marked read-only", listed.tools.every((tool) => tool.annotations?.readOnlyHint === true));

const call = async (name, args) => {
  const result = await client.callTool({ name, arguments: args });
  const text = result.content.map((part) => part.text).join("\n");
  let value = null;
  try {
    value = JSON.parse(text);
  } catch {
    value = null;
  }
  return { text, isError: result.isError === true, value };
};

const modes = await call("list_task_modes", {});
check("list_task_modes returns the five modes", modes.value.modes.length === 5, modes.value.modes.map((m) => m.mode).join(", "));

const all = await call("list_open_tasks", { network: "any", limit: 100 });
check("list_open_tasks returns open tasks", all.value.tasks.length > 0, `${all.value.matched} matched of ${all.value.openTasksOnBoard} open`);

const tempo = await call("list_open_tasks", { network: "tempo", limit: 100 });
check("the network filter keeps one network only", tempo.value.tasks.every((task) => task.network === "tempo"), `${tempo.value.tasks.length} on tempo`);

const rich = await call("list_open_tasks", { minReward: 5, verifiedOnly: true, limit: 100 });
check("reward and verified filters hold", rich.value.tasks.every((task) => task.reward >= 5 && task.verifiedWorkersRequired === true), `${rich.value.matched} matched`);

const first = all.value.tasks[0];
const one = await call("get_task", { id: first.id });
check("get_task reads a task by 0x id", one.value.task.id === first.id && one.value.task.description.length > 0, first.referenceCode);
const byCode = await call("get_task", { id: first.referenceCode });
check("get_task resolves a TSK reference code", byCode.value.task.id === first.id, first.referenceCode);

const bad = await call("get_task", { id: "not-a-task" });
check("a bad id comes back as an error, not a crash", bad.isError === true && /Not a task id/.test(bad.text));

await client.close();
console.log(failures === 0 ? "\nall contract checks passed" : `\n${failures} check(s) failed`);
process.exit(failures === 0 ? 0 : 1);
