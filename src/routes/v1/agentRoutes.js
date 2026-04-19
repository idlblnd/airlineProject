const express = require("express");
const chatController = require("../../agent/controllers/chatController");
const mcpController = require("../../agent/controllers/mcpController");
const authenticate = require("../../middleware/authMiddleware");

const router = express.Router();

router.get("/mcp/tools", mcpController.listTools);
router.post("/mcp/call", mcpController.callTool);
router.post("/sessions", authenticate, chatController.createSession);
router.get("/sessions/:sessionId", authenticate, chatController.getSession);
router.post("/sessions/:sessionId/messages", authenticate, chatController.postMessage);
router.get("/sessions/:sessionId/stream", authenticate, chatController.streamSession);

module.exports = router;
