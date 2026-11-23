#!/usr/bin/env node
/**
 * A real MCP client session against server.mjs, over the same stdio transport
 * Claude Desktop and Cursor use. It prints each request and each response, so
 * the transcript in transcript.md is what a client actually saw.
 *
 * Run: node scripts/session.mjs
 */
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const server = join(here, "..", "server.mjs");

const transport = new StdioClientTransport({
  command: process.execPath,
  args: [server],
  stderr: "inherit",
});
const client = new Client({ name: "transcript-client", version: "1.0.0" });
await client.connect(transport);

const show = (label, value) => console.log(`${label}\n${JSON.stringify(value, null, 2)}\n`);

const info = client.getServerVersion();
console.log(`connected: ${info.name} ${info.version}`);

const tools = await client.listTools();
show("→ tools/list", {
  tools: tools.tools.map((tool) => ({
    name: tool.name,
    description: tool.description,
    annotations: tool.annotations,
    inputSchema: tool.inputSchema,
  })),
});

const calls = [
  ["list_open_tasks", { mode: "bounty", minReward: 5, network: "tempo", verifiedOnly: true, limit: 5 }],
  ["get_task", { id: "TSK-XW6AGNNW" }],
  ["list_task_modes", {}],
];

for (const [name, args] of calls) {
  console.log(`→ tools/call  ${name} ${JSON.stringify(args)}`);
  const result = await client.callTool({ name, arguments: args });
  console.log(`← result  ${name}${result.isError ? "  (isError)" : ""}`);
  console.log(result.content.map((part) => part.text).join("\n"));
  console.log("");
}

await client.close();
