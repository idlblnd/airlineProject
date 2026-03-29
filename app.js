const express = require("express");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./swagger");

const v1Routes = require("./src/routes/v1");
const errorHandler = require("./src/middleware/errorHandler");
const notFoundHandler = require("./src/middleware/notFoundHandler");

const authRoutes = require("./src/routes/v1/authRoutes");

// 🔥 YENİ EKLENENLER
const { gateway, queryFlightLimiter } = require("./src/middleware/gateway");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 🔥 GLOBAL GATEWAY (tüm requestler buradan geçer)
app.use(gateway);

app.get("/", (req, res) => {
  res.status(200).json({
    status: "SUCCESS",
    message: "Airline API is running"
  });
});

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// 🔥 AUTH (limit yok)
app.use("/api/v1/auth", authRoutes);

// 🔥 RATE LIMIT (SADECE BU ENDPOINT)
app.use("/api/v1/flights/query", queryFlightLimiter);

// 🔥 TÜM ROUTES
app.use("/api/v1", v1Routes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;