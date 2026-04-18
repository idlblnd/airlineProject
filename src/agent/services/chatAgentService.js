const chatStore = require("../data/chatStore");
const llmService = require("./llmService");

class ChatAgentService {
  async createSession() {
    const session = await chatStore.createSession();

    await chatStore.addMessage(session.id, {
      role: "assistant",
      content:
        "Hello. I can query flights, book tickets, and check passengers in."
    });

    return chatStore.getSession(session.id);
  }

  async getSession(sessionId) {
    return chatStore.getSession(sessionId);
  }

  async handleUserMessage(sessionId, content) {
    const session = await chatStore.getSession(sessionId);

    if (!session) {
      throw new Error("Chat session not found");
    }

    const userMessage = await chatStore.addMessage(sessionId, {
      role: "user",
      content
    });

    const agentResult = await llmService.runAgent([
      ...(session.messages || []),
      userMessage
    ]);

    for (const toolResult of agentResult.toolResults) {
      await chatStore.addMessage(sessionId, {
        role: "tool",
        content: JSON.stringify(toolResult.result, null, 2),
        metadata: {
          toolName: toolResult.name,
          args: toolResult.args
        }
      });
    }

    const assistantMessage = await chatStore.addMessage(sessionId, {
      role: "assistant",
      content: agentResult.answer
    });

    const updatedSession = await chatStore.getSession(sessionId);

    return {
      session: updatedSession,
      assistantMessage
    };
  }
}

module.exports = new ChatAgentService();
