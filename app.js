const express = require("express");
const cors = require("cors"); // 🔥 EKLENDİ
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./swagger");

const v1Routes = require("./src/routes/v1");
const errorHandler = require("./src/middleware/errorHandler");
const notFoundHandler = require("./src/middleware/notFoundHandler");

const authRoutes = require("./src/routes/v1/authRoutes");

// 🔥 GATEWAY
const { gateway, queryFlightLimiter } = require("./src/middleware/gateway");

const app = express();

/**
 * 🔥 CORS (EN ÜSTTE OLMALI)
 */
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

/**
 * 🔥 BODY PARSER
 */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/**
 * 🔥 GLOBAL GATEWAY
 */
app.use((req, res, next) => {
  console.log("Gateway hit:", req.method, req.url);
  next();
});
app.use(gateway);

/**
 * 🔥 HEALTH CHECK
 */
app.get("/", (req, res) => {
  res.status(200).json({
    status: "SUCCESS",
    message: "Airline API is running"
  });
});

/**
 * 🔥 SWAGGER
 */
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

/**
 * 🔥 AUTH (NO LIMIT)
 */
app.use("/api/v1/auth", authRoutes);

/**
 * 🔥 RATE LIMIT (SADECE QUERY)
 */
app.use("/api/v1/flights/query", queryFlightLimiter);

/**
 * 🔥 MAIN ROUTES
 */
app.use("/api/v1", v1Routes);

/**
 * 🔥 ERROR HANDLERS
 */
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;