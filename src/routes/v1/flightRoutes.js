const express = require("express");
const multer = require("multer");

const flightController = require("../../controllers/flightController");
const validate = require("../../middleware/validate");
const auth = require("../../middleware/authMiddleware");

const { queryFlightsLimiter } = require("../../middleware/rateLimiter");
const { createFlightSchema } = require("../../dtos/request/flightSchemas");
const { queryFlightsSchema } = require("../../dtos/request/querySchemas");

const router = express.Router();
const upload = multer({ dest: "uploads/" });

/**
 * @swagger
 * tags:
 *   name: Flights
 *   description: Flight operations
 */

/**
 * @swagger
 * /api/v1/flights/query:
 *   get:
 *     summary: Query available flights
 *     description: Returns flights with available seats. Max 3 requests per day.
 *     tags: [Flights]
 *     parameters:
 *       - in: query
 *         name: airportFrom
 *         required: true
 *         schema:
 *           type: string
 *         example: "IST"
 *       - in: query
 *         name: airportTo
 *         required: true
 *         schema:
 *           type: string
 *         example: "ADB"
 *       - in: query
 *         name: dateFrom
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         example: "2026-04-01"
 *       - in: query
 *         name: dateTo
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *         example: "2026-04-05"
 *       - in: query
 *         name: capacity
 *         required: true
 *         schema:
 *           type: integer
 *         example: 2
 *       - in: query
 *         name: tripType
 *         required: false
 *         schema:
 *           type: string
 *           enum: [ONE_WAY, ROUND_TRIP]
 *         example: "ONE_WAY"
 *       - in: query
 *         name: page
 *         required: false
 *         schema:
 *           type: integer
 *           default: 1
 *         example: 1
 *       - in: query
 *         name: size
 *         required: false
 *         schema:
 *           type: integer
 *           default: 10
 *           enum: [10]
 *         example: 10
 *     responses:
 *       200:
 *         description: Available flights
 *         content:
 *           application/json:
 *             example:
 *               status: "SUCCESS"
 *               page: 1
 *               size: 10
 *               totalRecords: 24
 *               totalPages: 3
 *               flights:
 *                 - flightNumber: "TK101"
 *                   airportFrom: "IST"
 *                   airportTo: "ADB"
 *                   dateFrom: "2026-04-01"
 *                   dateTo: "2026-04-01"
 *                   duration: 75
 *                   capacity: 30
 *       400:
 *         description: Validation error
 *       429:
 *         description: Too many requests
 */
router.get(
  "/flights/query",
  queryFlightsLimiter,
  validate(queryFlightsSchema, "query"),
  flightController.queryFlights
);

/**
 * @swagger
 * /api/v1/flights/add:
 *   post:
 *     summary: Add new flight
 *     description: Adds a flight to airline schedule
 *     tags: [Flights]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Flight'
 *     responses:
 *       201:
 *         description: Flight created
 *         content:
 *           application/json:
 *             example:
 *               status: SUCCESS
 *               message: Flight added successfully
 */
router.post(
  "/flights/add",
  auth,
  validate(createFlightSchema),
  flightController.createFlight
);

/**
 * @swagger
 * /api/v1/flights/upload:
 *   post:
 *     summary: Upload flight CSV
 *     description: Adds multiple flights from file
 *     tags: [Flights]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: File processed
 *         content:
 *           application/json:
 *             example:
 *               status: SUCCESS
 *               totalProcessed: 10
 */
router.post(
  "/flights/upload",
  auth,
  upload.single("file"),
  flightController.uploadFlights
);

module.exports = router;