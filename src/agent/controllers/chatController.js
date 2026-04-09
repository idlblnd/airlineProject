const chatAgentService = require("../services/chatAgentService");
const messageBus = require("../data/messageBus");

exports.createSession = async (req, res, next) => {
  try {
    const session = await chatAgentService.createSession();
    res.status(201).json(session);
  } catch (error) {
    next(error);
  }
};

exports.getSession = async (req, res, next) => {
  try {
    const session = await chatAgentService.getSession(req.params.sessionId);

    if (!session) {
      return res.status(404).json({
        status: "FAIL",
        message: "Chat session not found"
      });
    }

    res.status(200).json(session);
  } catch (error) {
    next(error);
  }
};

exports.postMessage = async (req, res, next) => {
  try {
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        status: "FAIL",
        message: "Message is required"
      });
    }

    const result = await chatAgentService.handleUserMessage(
      req.params.sessionId,
      message.trim()
    );

    res.status(200).json(result);
  } catch (error) {
    if (error.message === "Chat session not found") {
      return res.status(404).json({
        status: "FAIL",
        message: error.message
      });
    }

    next(error);
  }
};

exports.streamSession = async (req, res, next) => {
  try {
    const session = await chatAgentService.getSession(req.params.sessionId);

    if (!session) {
      return res.status(404).json({
        status: "FAIL",
        message: "Chat session not found"
      });
    }

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders?.();

    res.write(`data: ${JSON.stringify({ type: "snapshot", session })}\n\n`);

    const unsubscribe = messageBus.subscribe(req.params.sessionId, (message) => {
      res.write(`data: ${JSON.stringify({ type: "message", message })}\n\n`);
    });

    const interval = setInterval(() => {
      res.write(": keep-alive\n\n");
    }, 15000);

    req.on("close", () => {
      clearInterval(interval);
      unsubscribe();
      res.end();
    });
  } catch (error) {
    next(error);
  }
};
