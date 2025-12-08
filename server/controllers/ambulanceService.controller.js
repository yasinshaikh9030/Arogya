// server/controllers/ambulanceService.controller.js

const AmbulanceService = require("../schema/ambulanceService.schema");

// Create a new ambulance service
exports.createAmbulanceService = async (req, res) => {
    try {
        const { serviceName, phone, location, district, priority } = req.body;

        // Validation
        if (!serviceName || typeof serviceName !== "string" || serviceName.trim() === "") {
            return res.status(400).json({
                success: false,
                message: "Service name is required",
            });
        }

        if (!phone || typeof phone !== "string" || phone.trim() === "") {
            return res.status(400).json({
                success: false,
                message: "Phone number is required",
            });
        }

        // Validate phone format
        const phoneRegex = /^[0-9+\-\s()]+$/;
        if (!phoneRegex.test(phone)) {
            return res.status(400).json({
                success: false,
                message: "Invalid phone number format",
            });
        }

        // Validate location if provided
        if (location) {
            if (
                typeof location.latitude !== "number" ||
                location.latitude < -90 ||
                location.latitude > 90
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Latitude must be a number between -90 and 90",
                });
            }

            if (
                typeof location.longitude !== "number" ||
                location.longitude < -180 ||
                location.longitude > 180
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Longitude must be a number between -180 and 180",
                });
            }
        }

        const ambulanceService = await AmbulanceService.create({
            serviceName: serviceName.trim(),
            phone: phone.trim(),
            location: location || { latitude: null, longitude: null },
            district: district?.trim() || "",
            priority: priority || 1,
            isActive: true,
        });

        return res.status(201).json({
            success: true,
            message: "Ambulance service created successfully",
            data: ambulanceService,
        });
    } catch (error) {
        console.error("Create ambulance service error:", error);

        if (error.name === "ValidationError") {
            return res.status(400).json({
                success: false,
                message: "Validation error",
                error: error.message,
            });
        }

        return res.status(500).json({
            success: false,
            message: "Failed to create ambulance service",
            error: error.message,
        });
    }
};

// Get all ambulance services
exports.getAllAmbulanceServices = async (req, res) => {
    try {
        const { active } = req.query;
        const query = {};

        if (active !== undefined) {
            query.isActive = active === "true";
        }

        const ambulanceServices = await AmbulanceService.find(query)
            .sort({ priority: -1, createdAt: -1 });

        return res.status(200).json({
            success: true,
            data: ambulanceServices,
        });
    } catch (error) {
        console.error("Get all ambulance services error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch ambulance services",
            error: error.message,
        });
    }
};

// Get a single ambulance service by ID
exports.getAmbulanceServiceById = async (req, res) => {
    try {
        const { id } = req.params;

        const ambulanceService = await AmbulanceService.findById(id);

        if (!ambulanceService) {
            return res.status(404).json({
                success: false,
                message: "Ambulance service not found",
            });
        }

        return res.status(200).json({
            success: true,
            data: ambulanceService,
        });
    } catch (error) {
        console.error("Get ambulance service by ID error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch ambulance service",
            error: error.message,
        });
    }
};

// Update ambulance service
exports.updateAmbulanceService = async (req, res) => {
    try {
        const { id } = req.params;
        const { serviceName, phone, location, district, priority, isActive } = req.body;

        const updateData = {};
        if (serviceName !== undefined) updateData.serviceName = serviceName.trim();
        if (phone !== undefined) {
            const phoneRegex = /^[0-9+\-\s()]+$/;
            if (!phoneRegex.test(phone)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid phone number format",
                });
            }
            updateData.phone = phone.trim();
        }
        if (location !== undefined) {
            if (
                typeof location.latitude !== "number" ||
                location.latitude < -90 ||
                location.latitude > 90
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Latitude must be a number between -90 and 90",
                });
            }
            if (
                typeof location.longitude !== "number" ||
                location.longitude < -180 ||
                location.longitude > 180
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Longitude must be a number between -180 and 180",
                });
            }
            updateData.location = location;
        }
        if (district !== undefined) updateData.district = district.trim();
        if (priority !== undefined) {
            if (priority < 1 || priority > 10) {
                return res.status(400).json({
                    success: false,
                    message: "Priority must be between 1 and 10",
                });
            }
            updateData.priority = priority;
        }
        if (isActive !== undefined) updateData.isActive = isActive;

        const ambulanceService = await AmbulanceService.findByIdAndUpdate(
            id,
            { $set: updateData },
            { new: true, runValidators: true }
        );

        if (!ambulanceService) {
            return res.status(404).json({
                success: false,
                message: "Ambulance service not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Ambulance service updated successfully",
            data: ambulanceService,
        });
    } catch (error) {
        console.error("Update ambulance service error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to update ambulance service",
            error: error.message,
        });
    }
};

// Delete ambulance service
exports.deleteAmbulanceService = async (req, res) => {
    try {
        const { id } = req.params;

        const ambulanceService = await AmbulanceService.findByIdAndDelete(id);

        if (!ambulanceService) {
            return res.status(404).json({
                success: false,
                message: "Ambulance service not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Ambulance service deleted successfully",
        });
    } catch (error) {
        console.error("Delete ambulance service error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to delete ambulance service",
            error: error.message,
        });
    }
};

