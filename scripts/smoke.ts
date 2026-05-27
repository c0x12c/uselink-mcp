#!/usr/bin/env tsx
import { createServer } from "../src/server.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";

async function main(): Promise<void> {
  const server = createServer();
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();

  await server.connect(serverTransport);

  const client = new Client({ name: "smoke", version: "0.0.0" }, { capabilities: {} });
  await client.connect(clientTransport);

  const { tools } = await client.listTools();
  console.log(`uselink-mcp smoke: ${tools.length} tools registered`);
  for (const tool of tools) {
    console.log(`  - ${tool.name}`);
  }

  await client.close();
  process.exit(0);
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
