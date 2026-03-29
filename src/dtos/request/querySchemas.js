const Joi = require("joi");

exports.queryFlightsSchema = Joi.object({
  airportFrom: Joi.string().trim().uppercase().required(),
  airportTo: Joi.string().trim().uppercase().required(),
  dateFrom: Joi.date().required(),
  dateTo: Joi.date().optional(),
  capacity: Joi.number().integer().min(1).required(),
  tripType: Joi.string().valid("ONE_WAY", "ROUND_TRIP").default("ONE_WAY"),
  page: Joi.number().integer().min(1).default(1),
  size: Joi.number().integer().valid(10).default(10)
});

exports.passengerListSchema = Joi.object({
  flightNumber: Joi.string().trim().required(),
  date: Joi.date().required(),
  page: Joi.number().integer().min(1).default(1),
  size: Joi.number().integer().valid(10).default(10)
});