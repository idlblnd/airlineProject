const Joi = require("joi");

exports.queryFlightsSchema = Joi.object({
  airportFrom: Joi.string().trim().uppercase().length(3).required(),
  airportTo: Joi.string().trim().uppercase().length(3).required(),
  dateFrom: Joi.date().required(),
  dateTo: Joi.date().optional(),
  capacity: Joi.number().integer().min(1).required(),
  tripType: Joi.string().valid("ONE_WAY", "ROUND_TRIP").default("ONE_WAY"),
  page: Joi.number().integer().min(1).default(1),
  size: Joi.number().integer().valid(10).default(10)
})
  .custom((value, helpers) => {
    if (value.airportFrom === value.airportTo) {
      return helpers.error("any.invalid", {
        message: "airportFrom and airportTo cannot be the same"
      });
    }

    if (value.dateTo && new Date(value.dateTo) < new Date(value.dateFrom)) {
      return helpers.error("any.invalid", {
        message: "dateTo cannot be earlier than dateFrom"
      });
    }

    if (value.tripType === "ROUND_TRIP" && !value.dateTo) {
      return helpers.error("any.invalid", {
        message: "dateTo is required for ROUND_TRIP queries"
      });
    }

    if (value.tripType === "ONE_WAY" && value.dateTo && new Date(value.dateTo) > new Date(value.dateFrom)) {
      return helpers.error("any.invalid", {
        message: "dateTo should not be provided as a later return date for ONE_WAY queries"
      });
    }

    return value;
  })
  .messages({
    "any.invalid": "{{#message}}"
  });

exports.passengerListSchema = Joi.object({
  flightNumber: Joi.string().trim().required(),
  date: Joi.date().required(),
  page: Joi.number().integer().min(1).default(1),
  size: Joi.number().integer().valid(10).default(10)
});
