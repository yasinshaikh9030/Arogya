// server/routes/patient.route.js
const express = require("express");
const router = express.Router();
const Patient = require("../schema/patient.schema");
const multer = require("multer");
const {
    createPatient,
    getAllPatients,
    getAllPatientsWithLocation,
    getPatientByClerkId,
    getPatientWithEvents,
    getMedicationReminders,
    addMedicationReminder,
    updateMedicationReminder,
    deleteMedicationReminder,
    setPreferredLanguage,
    updateLocation,
} = require("../controllers/patient.controller");
const admin = require("../config/firebase.js");

const upload = multer({ storage: multer.memoryStorage() });

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

// Create a new patient (inline validation)
// Accept governmentIdProof file via multer
router.post(
    "/create-patient",
    upload.fields([{ name: "governmentIdProof", maxCount: 1 }]),
    firebaseAuth,
    createPatient
);

// Get all patients
router.get("/all-patients", getAllPatients);

// Get all patients with location (for admin map)
router.get("/all-patients/location", getAllPatientsWithLocation);

// Get a patient by Clerk user ID
router.get("/get-patient/:clerkUserId", firebaseAuth, getPatientByClerkId);

// Medication reminders
router.get("/:clerkUserId/reminders", getMedicationReminders);
router.post("/:clerkUserId/reminders", addMedicationReminder);
router.put("/:clerkUserId/reminders/:reminderId", updateMedicationReminder);
router.delete("/:clerkUserId/reminders/:reminderId", deleteMedicationReminder);

router.get("/:patientId", getPatientWithEvents);

router.post("/:clerkUserId/language", setPreferredLanguage);

// Update patient location
router.put("/:clerkUserId/location", updateLocation);

module.exports = router;
