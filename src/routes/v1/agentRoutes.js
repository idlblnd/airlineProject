const express = require("express");
const chatController = require("../../agent/controllers/chatController");
const mcpController = require("../../agent/controllers/mcpController");
const router = express.Router();

router.get("/mcp/tools", mcpController.listTools);
router.post("/mcp/call", mcpController.callTool);
router.post("/sessions", chatController.createSession);
router.get("/sessions/:sessionId", chatController.getSession);
router.post("/sessions/:sessionId/messages", chatController.postMessage);
router.get("/sessions/:sessionId/stream", chatController.streamSession);

module.exports = router;
