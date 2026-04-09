const DEFAULT_PORT = process.env.PORT || "3000";

module.exports = {
  gatewayBaseUrl:
    process.env.AIRLINE_GATEWAY_URL || `http://127.0.0.1:${DEFAULT_PORT}`,
  authUsername: process.env.AGENT_AUTH_USERNAME || "agent-demo-user",
  authPassword: process.env.AGENT_AUTH_PASSWORD || "agent-demo-password",
  openAiApiKey: process.env.OPENAI_API_KEY || "",
  openAiModel: process.env.OPENAI_MODEL || "gpt-4o-mini",
  systemPrompt: `You are an airline support AI agent.
You must use tools whenever the user asks to query flights, buy tickets, check in, or inspect passengers.
When information is missing, ask a short follow-up question instead of guessing.
Keep answers concise, friendly, and factual.`
};
