const gatewayClient = require("../services/gatewayClient");
const toolDefinitions = require("./toolDefinitions");

class AirlineMcpServer {
  async listTools() {
    return toolDefinitions;
  }

  async callTool(toolName, args) {
    switch (toolName) {
      case "queryFlight":
        return gatewayClient.queryFlights(args);
      case "bookFlight":
        return gatewayClient.buyTicket(args);
      case "checkIn":
        return gatewayClient.checkIn(args);
      case "listPassengers":
        return gatewayClient.listPassengers(args);
      default:
        throw new Error(`Unknown MCP tool: ${toolName}`);
    }
  }
}

module.exports = new AirlineMcpServer();
