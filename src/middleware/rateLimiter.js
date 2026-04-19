const rateLimit = require("express-rate-limit");

const queryFlightLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 1 gün
  max: 100,
  message: {
    status: "ERROR",
    message: "You can only query flights 3 times per day"
  },
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = {
  queryFlightLimiter
};