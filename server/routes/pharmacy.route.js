const express = require("express");
const router = express.Router();
const pharmacyController = require("../controllers/pharmacy.controller");
const admin = require("../config/firebase.js");

const firebaseAuth = async (req, res, next) => {
    try {
        const header = req.headers.authorization;

        console.log(header);

        if (!header || !header.startsWith("Bearer ")) {
            return res
                .status(401)
                .json({ error: "Missing or malformed token" });
        }
        console.log("Admin Auth:", typeof admin.auth);

        const token = header.split(" ")[1];

        const decodedToken = await admin.auth().verifyIdToken(token);

        // Attach user info to request
        req.user = decodedToken;

        return next();
    } catch (error) {
        console.error("Firebase Auth Error:", error.message);
        return res.status(401).json({ error: "Invalid or expired token" });
    }
};

// POST /api/pharmacy/create-pharmacy - Create a new pharmacy
router.post("/create-pharmacy", firebaseAuth, pharmacyController.createPharmacy);

// GET /api/pharmacy - Get all pharmacies (with optional filters)
router.get("/", pharmacyController.getAllPharmacies);

// GET /api/pharmacy/get-pharmacy/:clerkUserId - Get single pharmacy by clerkUserId
router.get("/get-pharmacy/:clerkUserId", pharmacyController.getPharmacyByClerkUserId);

// GET /api/pharmacy/verified-pharmacies - Get only verified pharmacies
router.get("/verified-pharmacies", pharmacyController.getVerifiedPharmacies);

// PUT /api/pharmacy/profile - Update pharmacy profile
router.put("/profile", pharmacyController.updatePharmacyProfile);

module.exports = router;

