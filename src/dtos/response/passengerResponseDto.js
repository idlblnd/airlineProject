exports.toPassengerListResponseDto = ({
  flightNumber,
  date,
  page,
  size,
  totalRecords,
  passengers
}) => ({
  status: "SUCCESS",
  flightNumber,
  date,
  page,
  size,
  totalRecords,
  totalPages: Math.ceil(totalRecords / size),
  passengers: passengers.map((passenger) => ({
    fullName: passenger.full_name,
    seatNumber: passenger.seat_number
  }))
});