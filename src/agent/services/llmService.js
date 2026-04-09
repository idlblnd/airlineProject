const agentConfig = require("../config/agentConfig");
const mcpClient = require("../mcp/client");

const isValidIsoDate = (value) => /^\d{4}-\d{2}-\d{2}$/.test(value || "");

const mapMessagesToOpenAi = (messages) =>
  messages.map((message) => ({
    role: message.role,
    content: message.content
  }));

const buildTools = (tools) =>
  tools.map((tool) => ({
    type: "function",
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.inputSchema
    }
  }));

const buildFallbackResponse = async (messages) => {
  const latestUserMessage = [...messages].reverse().find((message) => message.role === "user");

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
  const passengerMatch = originalContent.match(
    /\bpassengers?.*\bfor\s+([A-Za-z0-9-]+)\s+\bon\s+(\d{4}-\d{2}-\d{2})/i
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
        (flight) =>
          `${flight.flightNumber} ${flight.airportFrom}-${flight.airportTo} on ${flight.dateFrom} with ${flight.capacity} seats left`
      )
      .join("; ");

    return {
      answer: `I found ${flights.length} matching flight(s). Top options: ${summary}.`,
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

  if (passengerMatch) {
    const args = {
      flightNumber: passengerMatch[1].toUpperCase(),
      date: passengerMatch[2]
    };

    if (!isValidIsoDate(args.date)) {
      return {
        answer: "Please provide the flight date in YYYY-MM-DD format.",
        toolResults: []
      };
    }

    const result = await mcpClient.callTool("listPassengers", args);
    const passengers = result.passengers || result.data?.passengers || [];

    return {
      answer: passengers.length
        ? `There are ${passengers.length} checked-in passenger(s): ${passengers
            .slice(0, 5)
            .map((passenger) => `${passenger.fullName} seat ${passenger.seatNumber}`)
            .join(", ")}.`
        : `There are no checked-in passengers yet for ${args.flightNumber} on ${args.date}.`,
      toolResults: [{ name: "listPassengers", args, result }]
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

  if (content.includes("passenger")) {
    return {
      answer:
        "I can list checked-in passengers. Please share the flight number and date in YYYY-MM-DD format.",
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
      "I’m ready to help with flight search, booking, check-in, or passenger lists. Tell me what you need.",
    toolResults: []
  };
};

class LlmService {
  async runAgent(messages) {
    if (!agentConfig.openAiApiKey) {
      return buildFallbackResponse(messages);
    }

    const tools = await mcpClient.listTools();
    const openAiMessages = [
      {
        role: "system",
        content: agentConfig.systemPrompt
      },
      ...mapMessagesToOpenAi(messages)
    ];

    const toolResults = [];
    let iterations = 0;
    let conversation = [...openAiMessages];

    while (iterations < 5) {
      iterations += 1;
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${agentConfig.openAiApiKey}`
        },
        body: JSON.stringify({
          model: agentConfig.openAiModel,
          temperature: 0.2,
          messages: conversation,
          tools: buildTools(tools),
          tool_choice: "auto"
        })
      });

      const payload = await response.json();

      if (!response.ok) {
        const message = payload.error?.message || "OpenAI request failed";
        throw new Error(message);
      }

      const choice = payload.choices?.[0]?.message;

      if (!choice) {
        throw new Error("OpenAI did not return a message");
      }

      if (!choice.tool_calls || choice.tool_calls.length === 0) {
        return {
          answer: choice.content || "I could not generate a response.",
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

        toolResults.push({
          name: toolCall.function.name,
          args,
          result
        });

        conversation.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: JSON.stringify(result)
        });
      }
    }

    throw new Error("Agent reached the maximum number of tool iterations");
  }
}

module.exports = new LlmService();
