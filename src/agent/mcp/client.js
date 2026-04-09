const mcpServer = require("./server");

class AirlineMcpClient {
  async listTools() {
    return mcpServer.listTools();
  }

  async callTool(name, args) {
    return mcpServer.callTool(name, args);
  }
}

module.exports = new AirlineMcpClient();
