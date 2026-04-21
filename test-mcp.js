require("dotenv").config();
const { Client } = require("@modelcontextprotocol/sdk/client/index.js");
const { StdioClientTransport } = require("@modelcontextprotocol/sdk/client/stdio.js");
const path = require("path");

async function main() {
  const serverPath = path.join(__dirname, "src/agent/mcp/mcp-server.js");

  const transport = new StdioClientTransport({
    command: "node",
    args: [serverPath]
  });

  const client = new Client({ name: "test-client", version: "1.0.0" });
  await client.connect(transport);

  const { tools } = await client.listTools();
  console.log(`\nReal MCP server returned ${tools.length} tool(s):\n`);
  tools.forEach((t) => {
    const params = Object.keys(t.inputSchema?.properties || {}).join(", ");
    console.log(`  [${t.name}]`);
    console.log(`    Description : ${t.description.split(".")[0]}.`);
    console.log(`    Parameters  : ${params}`);
  });

  await client.close();
  console.log("\nMCP server is working correctly!");
}

main().catch((err) => {
  console.error("Test failed:", err.message);
  process.exit(1);
});
