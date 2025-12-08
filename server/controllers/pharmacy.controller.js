// server/controllers/pharmacy.controller.js

const Pharmacy = require("../schema/pharmacy.schema");



// Create a new pharmacy
exports.createPharmacy = async (req, res) => {
    try {
        const {
            pharmacyName,
            ownerName,
            licenseNumber,
            phone,
            email,
            alternatePhone,
            address,
            district,
            state,
            pincode,
            registrationType,
            gstNumber,
            operatingHours,
            services,
            description,
            clerkUserId
        } = req.body;

        if (
            !pharmacyName ||
            !ownerName ||
            !licenseNumber ||
            !phone ||
            !email ||
            !address ||
            !district ||
            !state ||
            !pincode ||
            !registrationType
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Missing required fields: pharmacyName, ownerName, licenseNumber, phone, email, address, district, state, pincode, registrationType",
                data: {
                    gstNumber:gstNumber
                }
            });
        }

        if (!clerkUserId) {
            return res.status(401).json({
                success: false,
                message: "User not authenticated",
            });
        }

        const existingPharmacy = await Pharmacy.findOne({
            $or: [
                { email },
                { phone },
                { licenseNumber },
                { clerkUserId },
            ],
        });

        if (existingPharmacy) {
            return res.status(400).json({
                success: false,
                message:
                    "Pharmacy with this email, phone, license number, or user account already exists",
            });
        }

        const pharmacy = await Pharmacy.create({
            pharmacyName,
            ownerName,
            licenseNumber,
            phone,
            email,
            alternatePhone: alternatePhone || "",
            address,
            district,
            state,
            pincode,
            registrationType,
            gstNumber: gstNumber || "",
            operatingHours: operatingHours || [],
            services: services || [],
            description: description || "",
            clerkUserId,
        });

        res.status(201).json({
            success: true,
            message: "Pharmacy registered successfully",
            data: {
                id: pharmacy._id,
                pharmacyName: pharmacy.pharmacyName,
                ownerName: pharmacy.ownerName,
                email: pharmacy.email,
                verificationStatus: pharmacy.verificationStatus,
            },
        });
    } catch (error) {
        console.error("Pharmacy registration error:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
};

// Get all pharmacies
exports.getAllPharmacies = async (req, res) => {
    try {
        const { district, state, verificationStatus } = req.query;
        
        const query = {};
        
        if (district) query.district = district;
        if (state) query.state = state;
        if (verificationStatus) query.verificationStatus = verificationStatus;

        const pharmacies = await Pharmacy.find(query)
            .select(
                "pharmacyName ownerName email phone address district state pincode services rating verificationStatus operatingHours"
            )
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            data: pharmacies,
        });
    } catch (error) {
        console.error("Get pharmacies error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch pharmacies",
            error: error.message,
        });
    }
};

// Get a single pharmacy by clerkUserId
exports.getPharmacyByClerkUserId = async (req, res) => {
    try {
        const { clerkUserId } = req.params;
        const pharmacy = await Pharmacy.findOne({ clerkUserId });

        if (!pharmacy) {
            return res.status(404).json({
                success: false,
                message: "Pharmacy not found",
            });
        }

        res.json({
            success: true,
            data: pharmacy,
        });
    } catch (error) {
        console.error("Get pharmacy error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch pharmacy",
            error: error.message,
        });
    }
};

// Get verified pharmacies only
exports.getVerifiedPharmacies = async (req, res) => {
    try {
        const pharmacies = await Pharmacy.find({
            verificationStatus: "verified",
        }).select(
            "pharmacyName ownerName rating services address district state pincode operatingHours"
        );
        res.json({ success: true, data: pharmacies });
    } catch (error) {
        console.error("Get verified pharmacies error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch verified pharmacies",
        });
    }
};

// Update pharmacy profile
exports.updatePharmacyProfile = async (req, res) => {
    try {
        const {
            pharmacyName,
            ownerName,
            phone,
            email,
            alternatePhone,
            address,
            district,
            state,
            pincode,
            registrationType,
            gstNumber,
            operatingHours,
            services,
            description,
        } = req.body;

        const clerkUserId = req.auth?.userId || req.body.clerkUserId;

        if (!clerkUserId) {
            return res.status(401).json({
                success: false,
                message: "User not authenticated",
            });
        }

        const update = {
            pharmacyName,
            ownerName,
            phone,
            email,
            alternatePhone,
            address,
            district,
            state,
            pincode,
            registrationType,
            gstNumber,
            operatingHours,
            services,
            description,
        };

        Object.keys(update).forEach((key) => {
            if (update[key] === undefined) delete update[key];
        });

        const pharmacy = await Pharmacy.findOneAndUpdate(
            { clerkUserId },
            { $set: update },
            { new: true, runValidators: true }
        );

        if (!pharmacy) {
            return res.status(404).json({
                success: false,
                message: "Pharmacy not found",
            });
        }

        res.json({
            success: true,
            message: "Pharmacy profile updated successfully",
            data: pharmacy,
        });
    } catch (error) {
        console.error("Update pharmacy error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to update pharmacy profile",
            error: error.message,
        });
    }
};

