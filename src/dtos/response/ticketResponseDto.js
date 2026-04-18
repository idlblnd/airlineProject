exports.toBuyTicketResponseDto = (ticketNumber, { flightNumber, date, fullName } = {}) => ({
  status: "SUCCESS",
  message: "Ticket purchased successfully. Passenger must check in separately to receive a seat.",
  transactionStatus: "SUCCESS",
  ticketNumber,
  flightNumber,
  date,
  fullName
});

exports.toCheckInResponseDto = (seatNumber, { flightNumber, date, fullName, departureTime, arrivalTime } = {}) => ({
  status: "SUCCESS",
  message: "Check-in completed. Seat assigned.",
  transactionStatus: "SUCCESS",
  seatNumber,
  flightNumber,
  date,
  fullName,
  departureTime,
  arrivalTime
});
