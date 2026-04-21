const agentConfig = require("../config/agentConfig");
const mcpClient = require("../mcp/mcp-client");

const IATA_RE = /^[A-Z]{3}$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const isValidIsoDate = (v) => DATE_RE.test(v || "");
const getLatestUserMessage = (messages) =>
  [...messages].reverse().find((m) => m.role === "user");

// Validate tool arguments before execution; returns an error string or null.
const validateToolArgs = (name, args) => {
  if (name === "queryFlight") {
    if (!IATA_RE.test((args.airportFrom || "").toUpperCase()))
      return "airportFrom must be a 3-letter IATA code (e.g. IST).";
    if (!IATA_RE.test((args.airportTo || "").toUpperCase()))
      return "airportTo must be a 3-letter IATA code (e.g. ADB).";
    if (!isValidIsoDate(args.dateFrom))
      return "dateFrom must be in YYYY-MM-DD format.";
    if (args.dateTo && !isValidIsoDate(args.dateTo))
      return "dateTo must be in YYYY-MM-DD format.";
    if ((args.airportFrom || "").toUpperCase() === (args.airportTo || "").toUpperCase())
      return "Departure and arrival airports cannot be the same.";
  }
  if (name === "bookFlight" || name === "checkIn") {
    if (!isValidIsoDate(args.date))
      return "date must be in YYYY-MM-DD format.";
    if (!args.fullName || !args.fullName.trim())
      return "fullName is required.";
    if (!args.flightNumber || !args.flightNumber.trim())
      return "flightNumber is required.";
  }
  return null;
};

const inferIntent = (content = "") => {
  const n = content.toLowerCase();
  if (n.includes("check in") || n.includes("check-in")) return "checkIn";
  if (n.includes("book") || n.includes("buy")) return "bookFlight";
  if (n.includes("flight") || n.includes("flights") || n.includes("from") || n.includes("to"))
    return "queryFlight";
  return null;
};

const buildIntentInstruction = (intent) => {
  switch (intent) {
    case "queryFlight":
      return "The latest user request is a flight search. Use only queryFlight. In the final answer, mention only matching flights and flight details.";
    case "bookFlight":
      return "The latest user request is a booking request. Use only bookFlight unless required information is missing.";
    case "checkIn":
      return "The latest user request is a check-in request. Use only checkIn unless required information is missing.";
    default:
      return null;
  }
};

const formatQueryFlightAnswer = (result, args = {}) => {
  const flights = result?.flights || result?.data?.flights || [];
  if (!flights.length)
    return `I checked the gateway and could not find matching flights from ${args.airportFrom} to ${args.airportTo} on ${args.dateFrom}.`;
  const intro = `There are flights available from ${args.airportFrom} to ${args.airportTo} on ${args.dateFrom} for ${args.capacity} passenger${args.capacity > 1 ? "s" : ""}.`;
  const lines = flights.slice(0, 5).map((f) => `- ${f.flightNumber} with ${f.capacity} available seats`);
  return `${intro} The available flights are:\n${lines.join("\n")}`;
};

const formatBookFlightAnswer = (result, args = {}) => {
  const ticketNumber = result?.ticketNumber || result?.data?.ticketNumber || "created";
  return `Ticket booked successfully for ${args.fullName}. Ticket number: ${ticketNumber}.`;
};

const formatCheckInAnswer = (result, args = {}) => {
  const seatNumber = result?.seatNumber || result?.data?.seatNumber;
  return `Check-in completed for ${args.fullName}. Seat number: ${seatNumber}.`;
};

const buildStrictAnswer = (intent, toolResults) => {
  if (!intent || toolResults.length === 0) return null;
  const last = toolResults[toolResults.length - 1];
  if (intent === "queryFlight" && last.name === "queryFlight")
    return formatQueryFlightAnswer(last.result, last.args);
  if (intent === "bookFlight" && last.name === "bookFlight")
    return formatBookFlightAnswer(last.result, last.args);
  if (intent === "checkIn" && last.name === "checkIn")
    return formatCheckInAnswer(last.result, last.args);
  return null;
};

const buildFallbackResponse = async (messages) => {
  const latestUserMessage = getLatestUserMessage(messages);
  if (!latestUserMessage)
    return { answer: "How can I help with your flight plans?", toolResults: [] };

  const content = latestUserMessage.content.toLowerCase();
  const original = latestUserMessage.content;

  const queryFwd = original.match(
    /\bfrom\s+([A-Za-z]{3})\s+to\s+([A-Za-z]{3}).*?\bon\s+(\d{4}-\d{2}-\d{2}).*?\bfor\s+(\d+)\b/i
  );
  const queryRev = original.match(
    /\bfor\s+(\d+)\s+(?:seat|seats|passenger|passengers|people).*\bfrom\s+([A-Za-z]{3})\s+to\s+([A-Za-z]{3}).*?\bon\s+(\d{4}-\d{2}-\d{2})/i
  );
  const bookMatch = original.match(
    /\b(?:book|buy).*\bflight\s+([A-Za-z0-9-]+).*\bon\s+(\d{4}-\d{2}-\d{2}).*\bfor\s+([A-Za-z][A-Za-z\s'-]+)/i
  );
  const checkInMatch = original.match(
    /\bcheck(?:\s|-)?in\s+([A-Za-z][A-Za-z\s'-]+?)\s+\bfor\s+([A-Za-z0-9-]+)\s+\bon\s+(\d{4}-\d{2}-\d{2})/i
  );

  if (queryFwd || queryRev) {
    const args = queryFwd
      ? { airportFrom: queryFwd[1].toUpperCase(), airportTo: queryFwd[2].toUpperCase(), dateFrom: queryFwd[3], capacity: Number(queryFwd[4]) }
      : { capacity: Number(queryRev[1]), airportFrom: queryRev[2].toUpperCase(), airportTo: queryRev[3].toUpperCase(), dateFrom: queryRev[4] };

    const validationError = validateToolArgs("queryFlight", args);
    if (validationError) return { answer: validationError, toolResults: [] };

    const result = await mcpClient.callTool("queryFlight", args);
    const flights = result.flights || result.data?.flights || [];
    if (!flights.length)
      return { answer: `I checked the gateway and could not find matching flights from ${args.airportFrom} to ${args.airportTo} on ${args.dateFrom}.`, toolResults: [{ name: "queryFlight", args, result }] };
    const summary = flights.slice(0, 3).map((f) => `${f.flightNumber} - Duration: ${f.duration} minutes`).join("; ");
    return { answer: `I found ${flights.length} matching flight(s). Available flights: ${summary}.`, toolResults: [{ name: "queryFlight", args, result }] };
  }

  if (bookMatch) {
    const args = { flightNumber: bookMatch[1].toUpperCase(), date: bookMatch[2], fullName: bookMatch[3].trim() };
    const validationError = validateToolArgs("bookFlight", args);
    if (validationError) return { answer: validationError, toolResults: [] };
    const result = await mcpClient.callTool("bookFlight", args);
    return { answer: `Ticket booked successfully for ${args.fullName}. Ticket number: ${result.ticketNumber || result.data?.ticketNumber || "created"}.`, toolResults: [{ name: "bookFlight", args, result }] };
  }

  if (checkInMatch) {
    const args = { fullName: checkInMatch[1].trim(), flightNumber: checkInMatch[2].toUpperCase(), date: checkInMatch[3] };
    const validationError = validateToolArgs("checkIn", args);
    if (validationError) return { answer: validationError, toolResults: [] };
    const result = await mcpClient.callTool("checkIn", args);
    return { answer: `Check-in completed for ${args.fullName}. Seat number: ${result.seatNumber || result.data?.seatNumber}.`, toolResults: [{ name: "checkIn", args, result }] };
  }

  if (content.includes("check in") || content.includes("check-in"))
    return { answer: "I can handle check-in for you. Please share the flight number, date, and passenger full name.", toolResults: [] };
  if (content.includes("book") || content.includes("buy"))
    return { answer: "I can book the ticket once you share the flight number, date, and passenger full name.", toolResults: [] };
  if (content.includes("flight") || content.includes("from") || content.includes("to"))
    return { answer: "I can query flights for you. Please share the origin airport, destination airport, travel date, and passenger count.", toolResults: [] };

  return { answer: "I'm ready to help with flight search, booking, or check-in. Tell me what you need.", toolResults: [] };
};

const buildTools = (tools) =>
  tools.map((tool) => ({
    type: "function",
    function: { name: tool.name, description: tool.description, parameters: tool.inputSchema }
  }));

class LlmService {
  async runAgent(messages) {
    if (!agentConfig.groqApiKey) {
      return buildFallbackResponse(messages);
    }

    const latestUserMessage = getLatestUserMessage(messages);
    const latestUserContent = latestUserMessage?.content || "";
    const latestIntent = inferIntent(latestUserContent);
    const intentInstruction = buildIntentInstruction(latestIntent);

    const allTools = await mcpClient.listTools();
    const agentTools = allTools.filter((t) => ["queryFlight", "bookFlight", "checkIn"].includes(t.name));
    const tools = latestIntent
      ? agentTools.filter((t) => t.name === latestIntent)
      : agentTools;

    // Only user/assistant messages — stored tool messages lack tool_call_id and break Groq
    const conversation = [
      { role: "system", content: agentConfig.systemPrompt },
      ...(intentInstruction ? [{ role: "system", content: intentInstruction }] : []),
      ...messages
        .filter((m) => m.role === "user" || m.role === "assistant")
        .map((m) => ({ role: m.role, content: m.content }))
    ];

    const toolResults = [];
    let iterations = 0;

    // Agentic loop: LLM calls a tool → get result → reason → call another if needed → final answer
    while (iterations < 10) {
      iterations++;

      const justBooked = toolResults.some((r) => r.name === "bookFlight" && r.result?.status === "SUCCESS");
      const justCheckedIn = toolResults.some((r) => r.name === "checkIn" && r.result?.status === "SUCCESS");
      const toolChoice = justBooked || justCheckedIn ? "none" : "auto";

      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${agentConfig.groqApiKey}` },
        body: JSON.stringify({
          model: agentConfig.groqModel,
          temperature: 0,
          messages: conversation,
          tools: buildTools(tools),
          tool_choice: toolChoice
        })
      });

      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error?.message || "Groq API request failed");

      const choice = payload.choices?.[0]?.message;
      if (!choice) throw new Error("Groq did not return a message");

      // No tool calls → final answer
      if (!choice.tool_calls || choice.tool_calls.length === 0) {
        const strictAnswer = buildStrictAnswer(latestIntent, toolResults);
        return { answer: strictAnswer || choice.content || "I could not generate a response.", toolResults };
      }

      // Append assistant message with tool calls to conversation
      conversation.push({ role: "assistant", content: choice.content || "", tool_calls: choice.tool_calls });

      // Execute each requested tool via the real MCP client
      for (const toolCall of choice.tool_calls) {
        const toolName = toolCall.function.name;
        const args = JSON.parse(toolCall.function.arguments || "{}");

        // Validate args before execution
        const validationError = validateToolArgs(toolName, args);
        if (validationError) {
          conversation.push({ role: "tool", tool_call_id: toolCall.id, content: JSON.stringify({ error: validationError }) });
          continue;
        }

        // Warn if bookFlight is called without a prior queryFlight in this session
        if (toolName === "bookFlight" && !toolResults.some((r) => r.name === "queryFlight")) {
          const warning = "Warning: bookFlight was called without a prior flight search in this session. It is recommended to query available flights first.";
          conversation.push({ role: "tool", tool_call_id: toolCall.id, content: JSON.stringify({ warning, proceed: true }) });
          // Still continue to execute the booking
        }

        const result = await mcpClient.callTool(toolName, args);
        toolResults.push({ name: toolName, args, result });

        // Append tool result so LLM can continue reasoning
        conversation.push({ role: "tool", tool_call_id: toolCall.id, content: JSON.stringify(result) });
      }
    }

    const strictAnswer = buildStrictAnswer(latestIntent, toolResults);
    const summary = toolResults.map((r) => r.name).join(", ");
    return {
      answer: strictAnswer || `I completed the requested actions (${summary}) but could not generate a final summary. Please try again.`,
      toolResults
    };
  }
}

module.exports = new LlmService();
