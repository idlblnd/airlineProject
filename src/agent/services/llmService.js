const agentConfig = require("../config/agentConfig");
const mcpClient = require("../mcp/client");

const isValidIsoDate = (value) => /^\d{4}-\d{2}-\d{2}$/.test(value || "");
const getLatestUserMessage = (messages) =>
  [...messages].reverse().find((message) => message.role === "user");

const inferIntent = (content = "") => {
  const normalized = content.toLowerCase();

  const mentionsCheckIn =
    normalized.includes("check in") || normalized.includes("check-in");
  const mentionsBook =
    normalized.includes("book") || normalized.includes("buy");
  const mentionsFlight =
    normalized.includes("flight") ||
    normalized.includes("flights") ||
    normalized.includes("from") ||
    normalized.includes("to");

  if (mentionsCheckIn) {
    return "checkIn";
  }

  if (mentionsBook) {
    return "bookFlight";
  }

  if (mentionsFlight) {
    return "queryFlight";
  }

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

  if (!flights.length) {
    return `I checked the gateway and could not find matching flights from ${args.airportFrom} to ${args.airportTo} on ${args.dateFrom}.`;
  }

  const intro = `There are flights available from ${args.airportFrom} to ${args.airportTo} on ${args.dateFrom} for ${args.capacity} passenger${args.capacity > 1 ? "s" : ""}.`;
  const lines = flights
    .slice(0, 5)
    .map((flight) => `- ${flight.flightNumber} with ${flight.capacity} available seats`);

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
  if (!intent || toolResults.length === 0) {
    return null;
  }

  const latestResult = toolResults[toolResults.length - 1];

  if (intent === "queryFlight" && latestResult.name === "queryFlight") {
    return formatQueryFlightAnswer(latestResult.result, latestResult.args);
  }

  if (intent === "bookFlight" && latestResult.name === "bookFlight") {
    return formatBookFlightAnswer(latestResult.result, latestResult.args);
  }

  if (intent === "checkIn" && latestResult.name === "checkIn") {
    return formatCheckInAnswer(latestResult.result, latestResult.args);
  }

  return null;
};

const buildFallbackResponse = async (messages) => {
  const latestUserMessage = getLatestUserMessage(messages);

  if (!latestUserMessage) {
    return {
      answer: "How can I help with your flight plans?",
      toolResults: []
    };
  }

  const content = latestUserMessage.content.toLowerCase();
  const originalContent = latestUserMessage.content;

  const queryMatchForward = originalContent.match(
    /\bfrom\s+([A-Za-z]{3})\s+to\s+([A-Za-z]{3}).*?\bon\s+(\d{4}-\d{2}-\d{2}).*?\bfor\s+(\d+)\b/i
  );
  const queryMatchReverse = originalContent.match(
    /\bfor\s+(\d+)\s+(?:seat|seats|passenger|passengers|people).*\bfrom\s+([A-Za-z]{3})\s+to\s+([A-Za-z]{3}).*?\bon\s+(\d{4}-\d{2}-\d{2})/i
  );
  const bookMatch = originalContent.match(
    /\b(?:book|buy).*\bflight\s+([A-Za-z0-9-]+).*\bon\s+(\d{4}-\d{2}-\d{2}).*\bfor\s+([A-Za-z][A-Za-z\s'-]+)/i
  );
  const checkInMatch = originalContent.match(
    /\bcheck(?:\s|-)?in\s+([A-Za-z][A-Za-z\s'-]+?)\s+\bfor\s+([A-Za-z0-9-]+)\s+\bon\s+(\d{4}-\d{2}-\d{2})/i
  );

  if (queryMatchForward || queryMatchReverse) {
    const args = queryMatchForward
      ? {
          airportFrom: queryMatchForward[1].toUpperCase(),
          airportTo: queryMatchForward[2].toUpperCase(),
          dateFrom: queryMatchForward[3],
          capacity: Number(queryMatchForward[4])
        }
      : {
          capacity: Number(queryMatchReverse[1]),
          airportFrom: queryMatchReverse[2].toUpperCase(),
          airportTo: queryMatchReverse[3].toUpperCase(),
          dateFrom: queryMatchReverse[4]
        };

    if (args.airportFrom === args.airportTo) {
      return {
        answer: "Departure and arrival airports cannot be the same. Please provide different airport codes.",
        toolResults: []
      };
    }

    if (!isValidIsoDate(args.dateFrom)) {
      return {
        answer: "Please provide the travel date in YYYY-MM-DD format.",
        toolResults: []
      };
    }

    const result = await mcpClient.callTool("queryFlight", args);
    const flights = result.flights || result.data?.flights || [];

    if (!flights.length) {
      return {
        answer: `I checked the gateway and could not find matching flights from ${args.airportFrom} to ${args.airportTo} on ${args.dateFrom}.`,
        toolResults: [{ name: "queryFlight", args, result }]
      };
    }

    const summary = flights
      .slice(0, 3)
      .map(
        (flight) => `${flight.flightNumber} - Duration: ${flight.duration} minutes`
      )
      .join("; ");

    return {
      answer: `I found ${flights.length} matching flight(s). Available flights: ${summary}.`,
      toolResults: [{ name: "queryFlight", args, result }]
    };
  }

  if (bookMatch) {
    const args = {
      flightNumber: bookMatch[1].toUpperCase(),
      date: bookMatch[2],
      fullName: bookMatch[3].trim()
    };

    if (!isValidIsoDate(args.date)) {
      return {
        answer: "Please provide the flight date in YYYY-MM-DD format for booking.",
        toolResults: []
      };
    }

    const result = await mcpClient.callTool("bookFlight", args);

    return {
      answer: `Ticket booked successfully for ${args.fullName}. Ticket number: ${result.ticketNumber || result.data?.ticketNumber || "created"}.`,
      toolResults: [{ name: "bookFlight", args, result }]
    };
  }

  if (checkInMatch) {
    const args = {
      fullName: checkInMatch[1].trim(),
      flightNumber: checkInMatch[2].toUpperCase(),
      date: checkInMatch[3]
    };

    if (!isValidIsoDate(args.date)) {
      return {
        answer: "Please provide the check-in date in YYYY-MM-DD format.",
        toolResults: []
      };
    }

    const result = await mcpClient.callTool("checkIn", args);

    return {
      answer: `Check-in completed for ${args.fullName}. Seat number: ${result.seatNumber || result.data?.seatNumber}.`,
      toolResults: [{ name: "checkIn", args, result }]
    };
  }

  if (content.includes("check in") || content.includes("check-in")) {
    return {
      answer:
        "I can handle check-in for you. Please share the flight number, date, and passenger full name.",
      toolResults: []
    };
  }

  if (content.includes("book") || content.includes("buy")) {
    return {
      answer:
        "I can book the ticket once you share the flight number, date, and passenger full name.",
      toolResults: []
    };
  }

  if (content.includes("flight") || content.includes("from") || content.includes("to")) {
    return {
      answer:
        "I can query flights for you. Please share the origin airport, destination airport, travel date, and passenger count.",
      toolResults: []
    };
  }

  return {
    answer:
      "I'm ready to help with flight search, booking, or check-in. Tell me what you need.",
    toolResults: []
  };
};

const buildTools = (tools) =>
  tools.map((tool) => ({
    type: "function",
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.inputSchema
    }
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
    const agentTools = allTools.filter(t => ["queryFlight", "bookFlight", "checkIn"].includes(t.name));
    const tools = latestIntent
      ? agentTools.filter((tool) => tool.name === latestIntent)
      : agentTools;
    // Only user/assistant messages — stored tool messages lack tool_call_id and break Groq
    const conversation = [
      { role: "system", content: agentConfig.systemPrompt },
      ...(intentInstruction ? [{ role: "system", content: intentInstruction }] : []),
      ...messages
        .filter((msg) => msg.role === "user" || msg.role === "assistant")
        .map((msg) => ({ role: msg.role, content: msg.content }))
    ];

    const toolResults = [];
    let iterations = 0;

    while (iterations < 10) {
      iterations++;

      const justBooked = toolResults.some(
        (r) => r.name === "bookFlight" && r.result?.status === "SUCCESS"
      );
      const justCheckedIn = toolResults.some(
        (r) => r.name === "checkIn" && r.result?.status === "SUCCESS"
      );
      const toolChoice = justBooked || justCheckedIn ? "none" : "auto";

      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${agentConfig.groqApiKey}`
        },
        body: JSON.stringify({
          model: agentConfig.groqModel,
          temperature: 0,
          messages: conversation,
          tools: buildTools(tools),
          tool_choice: toolChoice
        })
      });

      const payload = await response.json();

      if (!response.ok) {
        const message = payload.error?.message || "Groq API request failed";
        throw new Error(message);
      }

      const choice = payload.choices?.[0]?.message;

      if (!choice) {
        throw new Error("Groq did not return a message");
      }

      if (!choice.tool_calls || choice.tool_calls.length === 0) {
        const strictAnswer = buildStrictAnswer(latestIntent, toolResults);
        return {
          answer: strictAnswer || choice.content || "I could not generate a response.",
          toolResults
        };
      }

      conversation.push({
        role: "assistant",
        content: choice.content || "",
        tool_calls: choice.tool_calls
      });

      for (const toolCall of choice.tool_calls) {
        const args = JSON.parse(toolCall.function.arguments || "{}");
        const result = await mcpClient.callTool(toolCall.function.name, args);

        toolResults.push({ name: toolCall.function.name, args, result });

        conversation.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: JSON.stringify(result)
        });
      }
    }

    // Return whatever we have instead of throwing
    const summary = toolResults.map(r => r.name).join(", ");
    const strictAnswer = buildStrictAnswer(latestIntent, toolResults);
    return {
      answer:
        strictAnswer ||
        `I completed the requested actions (${summary}) but could not generate a final summary. Please try again.`,
      toolResults
    };
  }
}

module.exports = new LlmService();
