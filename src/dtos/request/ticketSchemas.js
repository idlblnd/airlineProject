const Joi = require("joi");

exports.buyTicketSchema = Joi.object({
  flightNumber: Joi.string().trim().required(),
  date: Joi.date().required(),
  fullName: Joi.string().trim().min(2).required()
});

exports.checkInSchema = Joi.object({
  flightNumber: Joi.string().trim().required(),
  date: Joi.date().required(),
  fullName: Joi.string().trim().min(2).required()
});