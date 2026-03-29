exports.toBuyTicketResponseDto = (ticketNumber) => ({
    status: "SUCCESS",
    message: "Ticket purchased successfully",
    data: {
      transactionStatus: "SUCCESS",
      ticketNumber
    }
  });
  
  exports.toCheckInResponseDto = (seatNumber) => ({
    status: "SUCCESS",
    message: "Check-in completed",
    data: {
      transactionStatus: "SUCCESS",
      seatNumber
    }
  });