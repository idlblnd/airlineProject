const Joi = require("joi");

exports.createFlightSchema = Joi.object({
  flightNumber: Joi.string().trim().required(),
  airportFrom: Joi.string().trim().uppercase().required(),
  airportTo: Joi.string().trim().uppercase().required(),
  dateFrom: Joi.date().required(),
  dateTo: Joi.date().required(),
  duration: Joi.number().integer().positive().required(),
  capacity: Joi.number().integer().min(1).required()
});