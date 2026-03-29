const fs = require("fs");
const csv = require("csv-parser");

const AppError = require("../utils/AppError");
const flightRepository = require("../repositories/flightRepository");
const { toFlightResponseDto, toFlightListResponseDto } = require("../dtos/response/flightResponseDto");
const { toQueryFlightsResponseDto } = require("../dtos/response/queryFlightsResponseDto");

exports.addFlight = async (data) => {
  if (new Date(data.dateTo) < new Date(data.dateFrom)) {
    throw new AppError("dateTo cannot be earlier than dateFrom", 400);
  }

  const createdFlight = await flightRepository.createFlight(data);
  return {
    status: "SUCCESS",
    message: "Flight created successfully",
    data: toFlightResponseDto(createdFlight)
  };
};

exports.listFlights = async () => {
  const flights = await flightRepository.getFlights();
  return {
    status: "SUCCESS",
    data: toFlightListResponseDto(flights)
  };
};

exports.queryFlights = async ({
  airportFrom,
  airportTo,
  dateFrom,
  dateTo,
  capacity,
  page = 1,
  size = 10
}) => {
  const effectiveDateTo = dateTo || dateFrom;
  const offset = (page - 1) * size;

  const result = await flightRepository.queryFlights(
    airportFrom,
    airportTo,
    dateFrom,
    effectiveDateTo,
    capacity,
    size,
    offset
  );

  return toQueryFlightsResponseDto({
    flights: result.flights,
    page,
    size,
    totalRecords: result.totalRecords
  });
};

exports.uploadFlights = async (file) => {
  return new Promise((resolve, reject) => {
    const rows = [];

    fs.createReadStream(file.path)
      .pipe(csv())
      .on("data", (data) => rows.push(data))
      .on("end", async () => {
        let successCount = 0;
        let failedCount = 0;

        for (const row of rows) {
          try {
            const flightData = {
              flightNumber: row.flight_number,
              airportFrom: row.airport_from,
              airportTo: row.airport_to,
              dateFrom: row.date_from,
              dateTo: row.date_to,
              duration: Number(row.duration),
              capacity: Number(row.capacity)
            };

            if (new Date(flightData.dateTo) < new Date(flightData.dateFrom)) {
              failedCount += 1;
              continue;
            }

            await flightRepository.createFlight(flightData);
            successCount += 1;
          } catch (error) {
            failedCount += 1;
          }
        }

        fs.unlinkSync(file.path);

        resolve({
          status: "SUCCESS",
          message: "Flights uploaded successfully",
          data: {
            totalRecords: rows.length,
            successCount,
            failedCount
          }
        });
      })
      .on("error", (error) => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
        reject(error);
      });
  });
};