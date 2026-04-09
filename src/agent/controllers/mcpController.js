const mcpServer = require("../mcp/server");

exports.listTools = async (req, res, next) => {
  try {
    const tools = await mcpServer.listTools();
    res.status(200).json({ tools });
  } catch (error) {
    next(error);
  }
};

exports.callTool = async (req, res, next) => {
  try {
    const { tool, args } = req.body;

    if (!tool) {
      return res.status(400).json({
        status: "FAIL",
        message: "Tool name is required"
      });
    }

    const result = await mcpServer.callTool(tool, args || {});
    res.status(200).json({
      tool,
      result
    });
  } catch (error) {
    next(error);
  }
};
