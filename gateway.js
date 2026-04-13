const path = require("path");
const express = require("express");
const cors = require("cors");
const { createProxyMiddleware } = require("http-proxy-middleware");

const app = express();
const PORT = process.env.PORT || process.env.GATEWAY_PORT || 8080;
const apiTarget = (process.env.API_TARGET_URL || "http://127.0.0.1:8080").replace(/\/$/, "");

app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.get("/", (req, res) => {
  res.status(200).json({
    status: "SUCCESS",
    message: "Airline gateway is running",
    apiTarget
  });
});

app.use("/agent", express.static(path.join(__dirname, "public", "agent")));
app.get("/agent/*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "agent", "index.html"));
});

const proxy = createProxyMiddleware({
  target: apiTarget,
  changeOrigin: true,
  xfwd: true,
  logLevel: "warn",
  onProxyReq(proxyReq, req) {
    console.log(`Gateway forwarding ${req.method} ${req.originalUrl} -> ${apiTarget}`);
  }
});

app.use("/api", proxy);
app.use("/api-docs", proxy);

app.listen(PORT, () => {
  console.log(`Gateway running on port ${PORT}`);
  console.log(`Forwarding traffic to ${apiTarget}`);
});
