const db = require("../config/db");

exports.getClient = async () => db.connect();

exports.findExistingTicket = async (flightId, fullName, date, client = db) => {
  const result = await client.query(
    `SELECT id FROM tickets WHERE flight_id = $1 AND LOWER(full_name) = LOWER($2) AND date = $3 LIMIT 1`,
    [flightId, fullName, date]
  );
  return result.rows[0];
};

exports.createTicket = async (flightId, fullName, date, ticketNumber, client = db) => {
  const result = await client.query(
    `INSERT INTO tickets
      (flight_id, full_name, date, ticket_number, is_checked_in)
     VALUES ($1, $2, $3, $4, false)
     RETURNING *`,
    [flightId, fullName, date, ticketNumber]
  );

  return result.rows[0];
};

exports.findTicketForCheckIn = async (flightNumber, date, fullName) => {
  const result = await db.query(
    `SELECT t.id, t.is_checked_in, t.flight_id,
            f.departure_time, f.duration
     FROM tickets t
     JOIN flights f ON t.flight_id = f.id
     WHERE f.flight_number = $1
       AND t.date = $2
       AND LOWER(t.full_name) = LOWER($3)
     LIMIT 1`,
    [flightNumber, date, fullName]
  );

  return result.rows[0];
};

exports.countCheckedInPassengers = async (flightId, date) => {
  const result = await db.query(
    `SELECT COUNT(*) AS count
     FROM tickets
     WHERE flight_id = $1
       AND date = $2
       AND is_checked_in = true`,
    [flightId, date]
  );

  return Number(result.rows[0].count);
};

exports.updateCheckIn = async (ticketId, seatNumber) => {
  await db.query(
    `UPDATE tickets
     SET is_checked_in = true,
         seat_number = $2
     WHERE id = $1`,
    [ticketId, seatNumber]
  );
};

exports.getCheckedInPassengers = async (flightNumber, date, limit, offset) => {
  const passengersResult = await db.query(
    `SELECT t.full_name, t.seat_number, t.ticket_number
     FROM tickets t
     JOIN flights f ON t.flight_id = f.id
     WHERE f.flight_number = $1
       AND t.date = $2
       AND t.is_checked_in = true
     ORDER BY t.seat_number ASC
     LIMIT $3 OFFSET $4`,
    [flightNumber, date, limit, offset]
  );

  const countResult = await db.query(
    `SELECT COUNT(*) AS total
     FROM tickets t
     JOIN flights f ON t.flight_id = f.id
     WHERE f.flight_number = $1
       AND t.date = $2
       AND t.is_checked_in = true`,
    [flightNumber, date]
  );

  return {
    passengers: passengersResult.rows,
    totalRecords: Number(countResult.rows[0].total)
  };
};