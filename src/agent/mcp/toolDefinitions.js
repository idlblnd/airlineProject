module.exports = [
  {
    name: "queryFlight",
    description:
      "Search for available flights. Use when the user wants to find, search, or look up flights. " +
      "Only returns flights that have available seats (capacity > 0). Limited to 3 calls per day.",
    inputSchema: {
      type: "object",
      properties: {
        airportFrom: { type: "string", description: "Origin airport IATA code, e.g. IST" },
        airportTo:   { type: "string", description: "Destination airport IATA code, e.g. ADB" },
        dateFrom:    { type: "string", description: "Travel date in YYYY-MM-DD format" },
        dateTo:      { type: "string", description: "Optional end date for range search in YYYY-MM-DD format" },
        capacity:    { type: "integer", description: "Number of passengers (seats needed)" },
        page:        { type: "integer", description: "Page number, default 1" },
        size:        { type: "integer", description: "Results per page, default 10" }
      },
      required: ["airportFrom", "airportTo", "dateFrom", "capacity"]
    }
  },
  {
    name: "bookFlight",
    description:
      "Purchase a ticket for a passenger. Use ONLY when the user explicitly wants to book or buy a ticket. " +
      "This reduces the flight capacity by 1 and creates a ticket. " +
      "IMPORTANT: This does NOT check the passenger in and does NOT assign a seat. " +
      "The passenger must call checkIn separately after booking to get a seat number.",
    inputSchema: {
      type: "object",
      properties: {
        flightNumber: { type: "string", description: "Flight number, e.g. TK101" },
        date:         { type: "string", description: "Flight date in YYYY-MM-DD format" },
        fullName:     { type: "string", description: "Full name of the passenger" }
      },
      required: ["flightNumber", "date", "fullName"]
    }
  },
  {
    name: "checkIn",
    description:
      "Check in a passenger who already has a purchased ticket. Use ONLY when the user explicitly wants to check in. " +
      "Assigns an incremental seat number (1, 2, 3...) to the passenger. " +
      "IMPORTANT: The passenger MUST have bought a ticket first via bookFlight. " +
      "Do NOT call this automatically after bookFlight unless the user specifically asks for both. " +
      "After check-in, the passenger appears in the passenger list.",
    inputSchema: {
      type: "object",
      properties: {
        flightNumber: { type: "string", description: "Flight number, e.g. TK101" },
        date:         { type: "string", description: "Flight date in YYYY-MM-DD format" },
        fullName:     { type: "string", description: "Full name of the passenger (must match the name used when booking)" }
      },
      required: ["flightNumber", "date", "fullName"]
    }
  }
];
