const rateLimit = require("express-rate-limit");

exports.queryFlightsLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: "FAIL",
    message: "Daily query limit exceeded (3)"
  }
});