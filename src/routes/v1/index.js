const express = require("express");
const flightRoutes = require("./flightRoutes");
const ticketRoutes = require("./ticketRoutes");

const router = express.Router();

router.use(flightRoutes);
router.use(ticketRoutes);

module.exports = router;