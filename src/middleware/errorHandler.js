module.exports = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const status = err.status || "ERROR";

  res.status(statusCode).json({
    status,
    message: err.message || "Internal server error"
  });
};