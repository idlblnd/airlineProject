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
          description: "Local server"
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
          }
        }
      }
    },
    apis: ["./src/routes/v1/*.js"]
  };

  module.exports = swaggerJsDoc(options);