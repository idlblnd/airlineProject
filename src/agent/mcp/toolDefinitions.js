module.exports = [
  {
    name: "queryFlight",
    description:
      "Search flights by origin airport, destination airport, travel date range, and passenger count.",
    inputSchema: {
      type: "object",
      properties: {
        airportFrom: { type: "string", description: "Origin airport code like IST" },
        airportTo: { type: "string", description: "Destination airport code like ADB" },
        dateFrom: { type: "string", description: "Departure date in YYYY-MM-DD format" },
        dateTo: { type: "string", description: "Optional return or latest date in YYYY-MM-DD format" },
        capacity: { type: "integer", description: "Requested passenger count" },
        page: { type: "integer", description: "Optional page number", default: 1 },
        size: { type: "integer", description: "Optional page size", default: 10 }
      },
      required: ["airportFrom", "airportTo", "dateFrom", "capacity"]
    }
  },
  {
    name: "bookFlight",
    description:
      "Buy a flight ticket for a passenger. Requires authentication handled by the gateway client.",
    inputSchema: {
      type: "object",
      properties: {
        flightNumber: { type: "string", description: "Flight number like TK101" },
        date: { type: "string", description: "Flight date in YYYY-MM-DD format" },
        fullName: { type: "string", description: "Passenger full name" }
      },
      required: ["flightNumber", "date", "fullName"]
    }
  },
  {
    name: "checkIn",
    description:
      "Check in a passenger and get the assigned seat number.",
    inputSchema: {
      type: "object",
      properties: {
        flightNumber: { type: "string", description: "Flight number like TK101" },
        date: { type: "string", description: "Flight date in YYYY-MM-DD format" },
        fullName: { type: "string", description: "Passenger full name" }
      },
      required: ["flightNumber", "date", "fullName"]
    }
  },
  {
    name: "listPassengers",
    description:
      "Get the checked-in passenger list for a flight. Requires authentication handled by the gateway client.",
    inputSchema: {
      type: "object",
      properties: {
        flightNumber: { type: "string", description: "Flight number like TK101" },
        date: { type: "string", description: "Flight date in YYYY-MM-DD format" },
        page: { type: "integer", description: "Optional page number", default: 1 },
        size: { type: "integer", description: "Optional page size", default: 10 }
      },
      required: ["flightNumber", "date"]
    }
  }
];
