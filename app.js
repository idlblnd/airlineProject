const express = require("express");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./swagger");

const v1Routes = require("./src/routes/v1");
const errorHandler = require("./src/middleware/errorHandler");
const notFoundHandler = require("./src/middleware/notFoundHandler");

const authRoutes = require("./src/routes/v1/authRoutes"); // 🔥 EKLENDİ

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.status(200).json({
    status: "SUCCESS",
    message: "Airline API is running"
  });
});

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use("/api/v1/auth", authRoutes); // 🔥 LOGIN

app.use("/api/v1", v1Routes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;