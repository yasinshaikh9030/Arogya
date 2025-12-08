// server/routes/ambulanceService.route.js
const express = require("express");
const router = express.Router();
const ambulanceServiceController = require("../controllers/ambulanceService.controller");

// POST /api/ambulance-service - Create a new ambulance service
router.post("/", ambulanceServiceController.createAmbulanceService);

// GET /api/ambulance-service - Get all ambulance services
router.get("/", ambulanceServiceController.getAllAmbulanceServices);

// GET /api/ambulance-service/:id - Get a single ambulance service by ID
router.get("/:id", ambulanceServiceController.getAmbulanceServiceById);

// PUT /api/ambulance-service/:id - Update an ambulance service
router.put("/:id", ambulanceServiceController.updateAmbulanceService);

// DELETE /api/ambulance-service/:id - Delete an ambulance service
router.delete("/:id", ambulanceServiceController.deleteAmbulanceService);

module.exports = router;

