exports.toQueryFlightsResponseDto = ({ flights, page, size, totalRecords }) => ({
  status: "SUCCESS",
  page,
  size,
  totalRecords,
  totalPages: Math.ceil(totalRecords / size),
  flights: flights.map((flight) => ({
    flightNumber: flight.flight_number,
    airportFrom: flight.airport_from,
    airportTo: flight.airport_to,
    dateFrom: flight.date_from,
    dateTo: flight.date_to,
    duration: flight.duration,
    capacity: flight.capacity,
    departureTime: flight.departure_time
      ? String(flight.departure_time).slice(0, 5)
      : null
  }))
});