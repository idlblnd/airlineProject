const { queryFlightLimiter } = require("./rateLimiter");

const gateway = (req, res, next) => {
  console.log(`Request trace: ${req.method} ${req.originalUrl}`);
  next();
};

module.exports = {
  gateway,
  queryFlightLimiter
};
