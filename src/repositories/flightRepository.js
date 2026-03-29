const db = require("../config/db");

exports.createFlight = async (flight) => {
  const result = await db.query(
    `INSERT INTO flights
      (flight_number, airport_from, airport_to, date_from, date_to, duration, capacity)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [
      flight.flightNumber,
      flight.airportFrom,
      flight.airportTo,
      flight.dateFrom,
      flight.dateTo,
      flight.duration,
      flight.capacity
    ]
  );

  return result.rows[0];
};

exports.getFlights = async () => {
  const result = await db.query(
    `SELECT id, flight_number, airport_from, airport_to, date_from, date_to, duration, capacity
     FROM flights
     ORDER BY date_from ASC`
  );

  return result.rows;
};

exports.queryFlights = async (from, to, dateFrom, dateTo, people, limit, offset) => {
  const flightsResult = await db.query(
    `SELECT id, flight_number, airport_from, airport_to, date_from, date_to, duration, capacity
     FROM flights
     WHERE LOWER(airport_from) = LOWER($1)
       AND LOWER(airport_to) = LOWER($2)
       AND date_from >= $3
       AND date_to <= $4
       AND capacity >= $5
     ORDER BY date_from ASC
     LIMIT $6 OFFSET $7`,
    [from, to, dateFrom, dateTo, people, limit, offset]
  );

  const countResult = await db.query(
    `SELECT COUNT(*) AS total
     FROM flights
     WHERE LOWER(airport_from) = LOWER($1)
       AND LOWER(airport_to) = LOWER($2)
       AND date_from >= $3
       AND date_to <= $4
       AND capacity >= $5`,
    [from, to, dateFrom, dateTo, people]
  );

  return {
    flights: flightsResult.rows,
    totalRecords: Number(countResult.rows[0].total)
  };
};

exports.findFlightByNumberAndDate = async (flightNumber, date, client = db) => {
  const result = await client.query(
    `SELECT *
     FROM flights
     WHERE flight_number = $1
       AND date_from = $2
     LIMIT 1`,
    [flightNumber, date]
  );

  return result.rows[0];
};

exports.decreaseCapacity = async (flightId, client = db) => {
  await client.query(
    `UPDATE flights
     SET capacity = capacity - 1
     WHERE id = $1`,
    [flightId]
  );
};