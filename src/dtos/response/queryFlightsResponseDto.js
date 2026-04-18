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
    dateFrom: flight.date_from ? String(flight.date_from).slice(0, 10) : null,
    dateTo: flight.date_to   ? String(flight.date_to).slice(0, 10)   : null,
    duration: flight.duration,
    capacity: flight.capacity,
    departureTime: flight.departure_time
      ? String(flight.departure_time).slice(0, 5)
      : null
  }))
});