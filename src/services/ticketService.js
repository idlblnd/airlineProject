const AppError = require("../utils/AppError");
const flightRepository = require("../repositories/flightRepository");
const ticketRepository = require("../repositories/ticketRepository");
const { toBuyTicketResponseDto, toCheckInResponseDto } = require("../dtos/response/ticketResponseDto");
const { toPassengerListResponseDto } = require("../dtos/response/passengerResponseDto");

exports.buyTicket = async ({ flightNumber, date, fullName }) => {
  const client = await ticketRepository.getClient();

  try {
    await client.query("BEGIN");

    const flight = await flightRepository.findFlightByNumberAndDate(flightNumber, date, client);

    if (!flight) {
      throw new AppError("Flight not found", 404);
    }

    if (flight.capacity <= 0) {
      throw new AppError("SOLD OUT", 400);
    }

    await flightRepository.decreaseCapacity(flight.id, client);

    const ticketNumber = `TCK-${Date.now()}`;

    await ticketRepository.createTicket(                                        
      flight.id,
      fullName,
      date,
      ticketNumber,                                                                                               
      client
    );                              

    await client.query("COMMIT");
                      
    return toBuyTicketResponseDto(ticketNumber, { flightNumber, date, fullName });
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {                                         
    client.release();
  }
};

exports.checkIn = async ({ flightNumber, date, fullName }) => {
  const ticket = await ticketRepository.findTicketForCheckIn(
    flightNumber,
    date,
    fullName
  );

  if (!ticket) {
    throw new AppError("No ticket found for this passenger. Please buy a ticket first.", 404);
  }

  if (ticket.is_checked_in) {
    throw new AppError("Passenger is already checked in.", 400);
  }

  const checkedInCount = await ticketRepository.countCheckedInPassengers(ticket.flight_id, date);
  const n = checkedInCount + 1;
  const cols = ["A", "B", "C", "D", "E", "F"];
  const seatNumber = `${Math.floor((n - 1) / 6) + 10}${cols[(n - 1) % 6]}`;

  await ticketRepository.updateCheckIn(ticket.id, seatNumber);

  return toCheckInResponseDto(seatNumber, { flightNumber, date, fullName });
};

exports.getPassengers = async ({ flightNumber, date, page = 1, size = 10 }) => {
  const offset = (page - 1) * size;

  const result = await ticketRepository.getCheckedInPassengers(
    flightNumber,
    date,
    size,
    offset
  );

  return toPassengerListResponseDto({
    flightNumber,
    date,
    page,
    size,
    totalRecords: result.totalRecords,
    passengers: result.passengers
  });
};