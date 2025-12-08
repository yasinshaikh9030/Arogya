// server/routes/patient.route.js
const express = require("express");
const router = express.Router();
const Patient = require("../schema/patient.schema");
const multer = require("multer");
const { createPatient, getAllPatients, getAllPatientsWithLocation, getPatientByClerkId, getPatientWithEvents, getMedicationReminders, addMedicationReminder, updateMedicationReminder, deleteMedicationReminder, setPreferredLanguage, updateLocation, getMedicalHistory, upsertMedicalHistory } = require("../controllers/patient.controller");

const upload = multer({ storage: multer.memoryStorage() });

// Create a new patient (inline validation)
// Accept governmentIdProof file via multer
router.post(
    "/create-patient",
    upload.fields([
        { name: 'governmentIdProof', maxCount: 1 },
    ]),
    createPatient
);

// Get all patients
router.get("/all-patients", getAllPatients);

// Get all patients with location (for admin map)
router.get("/all-patients/location", getAllPatientsWithLocation);

// Get a patient by Clerk user ID
router.get("/get-patient/:clerkUserId", getPatientByClerkId);

// Medication reminders
router.get('/:clerkUserId/reminders', getMedicationReminders);
router.post('/:clerkUserId/reminders', addMedicationReminder);
router.put('/:clerkUserId/reminders/:reminderId', updateMedicationReminder);
router.delete('/:clerkUserId/reminders/:reminderId', deleteMedicationReminder);

router.get('/:patientId', getPatientWithEvents);

router.post('/:clerkUserId/language', setPreferredLanguage);

// Update patient location
router.put('/:clerkUserId/location', updateLocation);

// Medical history (text + documents + AI summary)
router.get('/:clerkUserId/medical-history', getMedicalHistory);
router.post(
    '/:clerkUserId/medical-history',
    upload.array('documents', 10),
    upsertMedicalHistory
);

module.exports = router;
