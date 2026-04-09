const express = require("express");
const flightRoutes = require("./flightRoutes");
const ticketRoutes = require("./ticketRoutes");
const agentRoutes = require("./agentRoutes");

const router = express.Router();

router.use(flightRoutes);
router.use(ticketRoutes);
router.use("/agent", agentRoutes);

module.exports = router;
