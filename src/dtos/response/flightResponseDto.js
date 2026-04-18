const fmtDate = (d) => d ? String(d).slice(0, 10) : null;

exports.toFlightResponseDto = (flight) => ({
    id: flight.id,
    flightNumber: flight.flight_number,
    airportFrom: flight.airport_from,
    airportTo: flight.airport_to,
    dateFrom: fmtDate(flight.date_from),
    dateTo: fmtDate(flight.date_to),
    duration: flight.duration,
    capacity: flight.capacity
  });

  exports.toFlightListResponseDto = (flights) => flights.map((flight) => ({
    id: flight.id,
    flightNumber: flight.flight_number,
    airportFrom: flight.airport_from,
    airportTo: flight.airport_to,
    dateFrom: fmtDate(flight.date_from),
    dateTo: fmtDate(flight.date_to),
    duration: flight.duration,
    capacity: flight.capacity
  }));