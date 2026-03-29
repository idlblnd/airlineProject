module.exports = (req, res) => {
    res.status(404).json({
      status: "FAIL",
      message: "Route not found"
    });
  };