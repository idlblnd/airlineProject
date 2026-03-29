const flightService = require("../services/flightService");
const asyncHandler = require("../utils/asyncHandler");

exports.createFlight = asyncHandler(async (req, res) => {
  const result = await flightService.addFlight(req.body);
  res.status(201).json(result);
});

exports.getFlights = asyncHandler(async (req, res) => {
  const result = await flightService.listFlights();
  res.status(200).json(result);
});

exports.queryFlights = asyncHandler(async (req, res) => {
  const result = await flightService.queryFlights(req.query);
  res.status(200).json(result);
});

exports.uploadFlights = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      status: "FAIL",
      message: "No file uploaded"
    });
  }

  const result = await flightService.uploadFlights(req.file);
  res.status(200).json({
    ...result,
    fileName: req.file.originalname
  });
});