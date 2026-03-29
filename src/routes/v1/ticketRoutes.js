const express = require("express");

const ticketController = require("../../controllers/ticketController");
const validate = require("../../middleware/validate");
const auth = require("../../middleware/authMiddleware");

const {
  buyTicketSchema,
  checkInSchema
} = require("../../dtos/request/ticketSchemas");

const {
  passengerListSchema
} = require("../../dtos/request/querySchemas");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Tickets
 *   description: Ticket operations
 */

/**
 * @swagger
 * /api/v1/tickets/buy:
 *   post:
 *     summary: Buy ticket
 *     description: Decreases capacity. Returns SOLD OUT if no seats left.
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             flightNumber: "TK101"
 *             date: "2026-04-01"
 *             fullName: "Cem Yılmaz"
 *     responses:
 *       201:
 *         description: Ticket purchased
 *         content:
 *           application/json:
 *             example:
 *               status: SUCCESS
 *               ticketNumber: "TCK123456"
 */
router.post(
  "/tickets/buy",
  auth,
  validate(buyTicketSchema),
  ticketController.buyTicket
);

/**
 * @swagger
 * /api/v1/tickets/check-in:
 *   post:
 *     summary: Check-in passenger
 *     description: Assigns seat number automatically
 *     tags: [Tickets]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             flightNumber: "TK101"
 *             date: "2026-04-01"
 *             fullName: "Cem Yılmaz"
 *     responses:
 *       200:
 *         description: Check-in success
 *         content:
 *           application/json:
 *             example:
 *               status: SUCCESS
 *               seatNumber: 12
 */
router.post(
  "/tickets/check-in",
  validate(checkInSchema),
  ticketController.checkIn
);

/**
 * @swagger
 * /api/v1/tickets/passengers:
 *   get:
 *     summary: Passenger list
 *     description: Returns checked-in passengers and seat numbers with paging
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: flightNumber
 *         required: true
 *         schema:
 *           type: string
 *         example: "TK101"
 *       - in: query
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         example: "2026-04-01"
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
 *         description: Passenger list
 *         content:
 *           application/json:
 *             example:
 *               status: "SUCCESS"
 *               flightNumber: "TK101"
 *               date: "2026-04-01"
 *               page: 1
 *               size: 10
 *               totalRecords: 18
 *               totalPages: 2
 *               passengers:
 *                 - fullName: "Cem Yılmaz"
 *                   seatNumber: 5
 *       401:
 *         description: Unauthorized
 */
router.get(
  "/tickets/passengers",
  auth,
  validate(passengerListSchema, "query"),
  ticketController.getPassengers
);

module.exports = router;