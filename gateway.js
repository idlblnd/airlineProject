const express = require("express");
const cors = require("cors");
const { createProxyMiddleware } = require("http-proxy-middleware");

const app = express();

// 🔥 PORT
const PORT = process.env.PORT || process.env.GATEWAY_PORT || 8080;

// 🔥 API TARGET (AWS içinde localhost)
const apiTarget = (process.env.API_TARGET_URL || "http://127.0.0.1:3000").replace(/\/$/, "");

// 🔥 CORS
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// 🔥 ROOT → AGENT
app.get("/", (req, res) => {
  res.redirect("/agent");
});

// 🔥 HEALTH CHECK
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "SUCCESS",
    message: "Gateway health check passed"
  });
});

// 🔥 AGENT UI → API'ye proxy
app.use("/agent", createProxyMiddleware({
  target: apiTarget,
  changeOrigin: true,
  logLevel: "warn"
}));

// 🔥 API ROUTES
app.use("/api", createProxyMiddleware({
  target: apiTarget,
  changeOrigin: true,
  logLevel: "warn"
}));

// 🔥 SWAGGER
app.use("/api-docs", createProxyMiddleware({
  target: apiTarget,
  changeOrigin: true,
  logLevel: "warn"
}));

app.use("/swagger", createProxyMiddleware({
  target: apiTarget,
  changeOrigin: true,
  logLevel: "warn"
}));

// 🔥 START
app.listen(PORT, () => {
  console.log("🚀 Gateway running on port:", PORT);
  console.log("🔁 Forwarding traffic to:", apiTarget);
});