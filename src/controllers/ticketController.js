const ticketService = require("../services/ticketService");
const asyncHandler = require("../utils/asyncHandler");

exports.buyTicket = asyncHandler(async (req, res) => {
  const result = await ticketService.buyTicket(req.body);
  res.status(201).json(result);
});

exports.checkIn = asyncHandler(async (req, res) => {
  const result = await ticketService.checkIn(req.body);
  res.status(200).json(result);
});

exports.getPassengers = asyncHandler(async (req, res) => {
  const result = await ticketService.getPassengers(req.query);
  res.status(200).json(result);
});