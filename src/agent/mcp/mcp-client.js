const { Client } = require("@modelcontextprotocol/sdk/client/index.js");
const { StdioClientTransport } = require("@modelcontextprotocol/sdk/client/stdio.js");
const path = require("path");

class AirlineMcpClient {
  constructor() {
    this._client = null;
    this._ready = null;
  }

  _ensureConnected() {
    if (!this._ready) {
      this._ready = this._connect();
    }
    return this._ready;
  }

  async _connect() {
    const serverPath = path.join(__dirname, "mcp-server.js");
    const transport = new StdioClientTransport({
      command: "node",
      args: [serverPath]
    });
    this._client = new Client({ name: "airline-mcp-client", version: "1.0.0" });
    await this._client.connect(transport);
  }

  async listTools() {
    await this._ensureConnected();
    const { tools } = await this._client.listTools();
    return tools.map((tool) => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema
    }));
  }

  async callTool(name, args) {
    await this._ensureConnected();
    const response = await this._client.callTool({ name, arguments: args });
    const text = response.content?.find((c) => c.type === "text")?.text;
    return text ? JSON.parse(text) : response;
  }
}

module.exports = new AirlineMcpClient();
