require("dotenv").config();
const { McpServer } = require("@modelcontextprotocol/sdk/server/mcp.js");
const { StdioServerTransport } = require("@modelcontextprotocol/sdk/server/stdio.js");
const { z } = require("zod");
const gatewayClient = require("../services/gatewayClient");

const server = new McpServer({ name: "airline-mcp-server", version: "1.0.0" });

server.registerTool(
  "queryFlight",
  {
    description:
      "Search for available flights. Use when the user wants to find, search, or look up flights. " +
      "Only returns flights that have available seats (capacity > 0). Limited to 3 calls per day.",
    inputSchema: {
      airportFrom: z.string().describe("Origin airport IATA code, e.g. IST"),
      airportTo:   z.string().describe("Destination airport IATA code, e.g. ADB"),
      dateFrom:    z.string().describe("Travel date in YYYY-MM-DD format"),
      dateTo:      z.string().optional().describe("Optional end date for range search in YYYY-MM-DD format"),
      capacity:    z.coerce.number().int().describe("Number of passengers (seats needed)"),
      page:        z.coerce.number().int().optional().describe("Page number, default 1"),
      size:        z.coerce.number().int().optional().describe("Results per page, default 10")
    }
  },
  async (args) => {
    const result = await gatewayClient.queryFlights(args);
    return { content: [{ type: "text", text: JSON.stringify(result) }] };
  }
);

server.registerTool(
  "bookFlight",
  {
    description:
      "Purchase a ticket for a passenger. Use ONLY when the user explicitly wants to book or buy a ticket. " +
      "This reduces the flight capacity by 1 and creates a ticket. " +
      "IMPORTANT: This does NOT check the passenger in and does NOT assign a seat. " +
      "The passenger must call checkIn separately after booking to get a seat number.",
    inputSchema: {
      flightNumber: z.string().describe("Flight number, e.g. TK101"),
      date:         z.string().describe("Flight date in YYYY-MM-DD format"),
      fullName:     z.string().describe("Full name of the passenger")
    }
  },
  async (args) => {
    const result = await gatewayClient.buyTicket(args);
    return { content: [{ type: "text", text: JSON.stringify(result) }] };
  }
);

server.registerTool(
  "checkIn",
  {
    description:
      "Check in a passenger who already has a purchased ticket. Use ONLY when the user explicitly wants to check in. " +
      "Assigns an incremental seat number (1, 2, 3...) to the passenger. " +
      "IMPORTANT: The passenger MUST have bought a ticket first via bookFlight. " +
      "Do NOT call this automatically after bookFlight unless the user specifically asks for both. " +
      "After check-in, the passenger appears in the passenger list.",
    inputSchema: {
      flightNumber: z.string().describe("Flight number, e.g. TK101"),
      date:         z.string().describe("Flight date in YYYY-MM-DD format"),
      fullName:     z.string().describe("Full name of the passenger (must match the name used when booking)")
    }
  },
  async (args) => {
    const result = await gatewayClient.checkIn(args);
    return { content: [{ type: "text", text: JSON.stringify(result) }] };
  }
);

async function main() {
  const transport = new StdioServerTransport();
  process.stderr.write("MCP Server running via stdio transport\n");
  await server.connect(transport);
}

main().catch((err) => {
  process.stderr.write(`MCP server fatal error: ${err.message}\n`);
  process.exit(1);
});
