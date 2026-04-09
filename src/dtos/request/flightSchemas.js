const Joi = require("joi");

exports.createFlightSchema = Joi.object({
  flightNumber: Joi.string().trim().required(),
  airportFrom: Joi.string().trim().uppercase().length(3).required(),
  airportTo: Joi.string().trim().uppercase().length(3).required(),
  dateFrom: Joi.date().required(),
  dateTo: Joi.date().required(),
  duration: Joi.number().integer().positive().required(),
  capacity: Joi.number().integer().min(1).required()
})
  .custom((value, helpers) => {
    if (value.airportFrom === value.airportTo) {
      return helpers.error("any.invalid", {
        message: "airportFrom and airportTo cannot be the same"
      });
    }

    if (new Date(value.dateTo) < new Date(value.dateFrom)) {
      return helpers.error("any.invalid", {
        message: "dateTo cannot be earlier than dateFrom"
      });
    }

    return value;
  })
  .messages({
    "any.invalid": "{{#message}}"
  });
