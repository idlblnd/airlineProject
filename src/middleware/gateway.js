const { queryFlightLimiter } = require("./rateLimiter");

const gateway = (req, res, next) => {
  console.log(`Gateway hit: ${req.method} ${req.originalUrl}`);
  next();
};

module.exports = {
  gateway,
  queryFlightLimiter
};