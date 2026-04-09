const Joi = require("joi");

exports.buyTicketSchema = Joi.object({
  flightNumber: Joi.string().trim().required(),
  date: Joi.date().required(),
  fullName: Joi.string().trim().min(2).pattern(/^[A-Za-zÀ-ÿ\s'-]+$/).required()
}).messages({
  "string.pattern.base": "fullName can only contain letters, spaces, apostrophes, and hyphens"
});

exports.checkInSchema = Joi.object({
  flightNumber: Joi.string().trim().required(),
  date: Joi.date().required(),
  fullName: Joi.string().trim().min(2).pattern(/^[A-Za-zÀ-ÿ\s'-]+$/).required()
}).messages({
  "string.pattern.base": "fullName can only contain letters, spaces, apostrophes, and hyphens"
});
