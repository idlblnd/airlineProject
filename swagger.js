const swaggerJsDoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Airline Management API",
      version: "1.0.0",
      description:
        "Production-ready Airline API with JWT authentication, rate limiting and layered architecture"
    },
    servers: [
      {
        url: "http://localhost:3000",
        description: "API Gateway"
      }
    ],

    // 🔥 GLOBAL AUTH (çok önemli)
    security: [
      {
        bearerAuth: []
      }
    ],

    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT"
        }
      },

      schemas: {
        Flight: {
          type: "object",
          properties: {
            flightNumber: { type: "string" },
            airportFrom: { type: "string" },
            airportTo: { type: "string" },
            dateFrom: { type: "string", format: "date" },
            dateTo: { type: "string", format: "date" },
            duration: { type: "integer" },
            capacity: { type: "integer" }
          }
        },

        Ticket: {
          type: "object",
          properties: {
            ticketNumber: { type: "string" },
            flightNumber: { type: "string" },
            fullName: { type: "string" },
            seatNumber: { type: "integer" }
          }
        },

        ApiResponse: {
          type: "object",
          properties: {
            status: { type: "string", example: "SUCCESS" },
            message: { type: "string" }
          }
        },

        // 🔥 EKLENDİ (query response için)
        FlightListResponse: {
          type: "object",
          properties: {
            status: { type: "string", example: "SUCCESS" },
            flights: {
              type: "array",
              items: {
                $ref: "#/components/schemas/Flight"
              }
            }
          }
        },

        // 🔥 RATE LIMIT RESPONSE
        RateLimitError: {
          type: "object",
          properties: {
            status: { type: "string", example: "ERROR" },
            message: {
              type: "string",
              example: "You can only query flights 3 times per day"
            }
          }
        }
      },

      // 🔥 GLOBAL RESPONSE TANIMLARI
      responses: {
        UnauthorizedError: {
          description: "Unauthorized - JWT required",
          content: {
            "application/json": {
              example: {
                status: "ERROR",
                message: "Unauthorized"
              }
            }
          }
        },

        RateLimitExceeded: {
          description: "Too many requests",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/RateLimitError"
              }
            }
          }
        }
      }
    }
  },

  apis: ["./src/routes/v1/*.js"]
};

module.exports = swaggerJsDoc(options);