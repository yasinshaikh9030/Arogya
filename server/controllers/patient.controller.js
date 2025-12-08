// server/controllers/patient.controller.js
const { translate } = require("@vitalets/google-translate-api");
const { sendSms } = require("../config/sms.config");
const Patient = require("../schema/patient.schema");
const cloudinary = require("../config/cloudinary");

exports.createPatient = async (req, res) => {
    const {
        fullName,
        dob,
        gender,
        phone,
        address,
        district,
        govIdType,
        governmentIdProof,
        emergencyContactName,
        emergencyContactPhone,
        telemedicineConsent,
        clerkUserId,
        alergies,
        operations,
        ongoingMedications,
        permanentMedications,
        majorDiseases,
    } = req.body;

    const errors = [];

    // Inline validation
    if (
        !fullName ||
        typeof fullName !== "string" ||
        fullName.trim() === "" ||
        fullName.length > 100
    )
        errors.push(
            "fullName is required and must be a non-empty string (max 100 chars)"
        );
    // Validate governmentIdProof file (from multer)
    if (
        !req.files ||
        !req.files.governmentIdProof ||
        !req.files.governmentIdProof[0]
    )
        errors.push("governmentIdProof file is required");
    if (
        !address ||
        typeof address !== "string" ||
        address.trim() === "" ||
        address.length > 200
    )
        errors.push(
            "address is required and must be a non-empty string (max 200 chars)"
        );
    if (
        !district ||
        typeof district !== "string" ||
        district.trim() === "" ||
        district.length > 50
    )
        errors.push(
            "district is required and must be a non-empty string (max 50 chars)"
        );
    if (
        !emergencyContactName ||
        typeof emergencyContactName !== "string" ||
        emergencyContactName.trim() === "" ||
        emergencyContactName.length > 100
    )
        errors.push(
            "emergencyContactName is required and must be a non-empty string (max 100 chars)"
        );
    // if (
    //     !clerkUserId ||
    //     typeof clerkUserId !== "string" ||
    //     clerkUserId.trim() === ""
    // )
    //     errors.push("clerkUserId is required and must be a non-empty string");

    // dob
    if (!dob || isNaN(Date.parse(dob))) {
        errors.push("dob is required and must be a valid date");
    } else if (new Date(dob) >= new Date()) {
        errors.push("dob must be in the past");
    }

    // gender
    const allowedGenders = ["male", "female", "other"];
    if (!allowedGenders.includes(gender)) {
        errors.push("gender must be one of: " + allowedGenders.join(", "));
    }

    // phone
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    if (!phone || !phoneRegex.test(phone)) {
        errors.push("phone is required and must be a valid phone number");
    }

    // govIdType
    const allowedGovIdTypes = ["aadhar", "voter-id"];
    if (!allowedGovIdTypes.includes(govIdType)) {
        errors.push(
            "govIdType must be one of: " + allowedGovIdTypes.join(", ")
        );
    }

    // emergencyContactPhone
    if (!emergencyContactPhone || !phoneRegex.test(emergencyContactPhone)) {
        errors.push(
            "emergencyContactPhone is required and must be a valid phone number"
        );
    }

    // If there are validation errors, return them
    if (errors.length > 0) {
        return res
            .status(400)
            .json({ error: "Validation failed", details: errors });
    }

    // upload governmentIdProof to cloudinary
    let governmentIdProofUrl = "";
    console.log("req.files", req.files);

    async function uploadBufferToCloud(buffer, folder = "patient_docs") {
        const uploadResult = await new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
                { resource_type: "auto", folder },
                (error, result) => {
                    if (error) return reject(error);
                    resolve(result);
                }
            );
            stream.end(buffer);
        });
        return uploadResult?.secure_url || "";
    }

    if (
        req.files &&
        req.files.governmentIdProof &&
        req.files.governmentIdProof[0]
    ) {
        try {
            governmentIdProofUrl = await uploadBufferToCloud(
                req.files.governmentIdProof[0].buffer,
                "patient_docs"
            );
        } catch (err) {
            console.error(
                "[patient.createPatient] governmentIdProof upload failed:",
                err.message || err
            );
        }
    }

    console.log("Government ID Proof URL:", governmentIdProofUrl);

    try {
        console.log("clerkUserId", clerkUserId);
        const patient = await Patient.create({
            fullName,
            dob,
            gender,
            phone,
            address,
            district,
            govIdType,
            governmentIdProof: governmentIdProofUrl || "",
            emergencyContactName,
            emergencyContactPhone,
            telemedicineConsent: true,
            clerkUserId,
        });
        console.log(patient);

        const newPhone = phone.startsWith("+91") ? phone : "+91" + phone;

        const message = `Dear ${fullName}, your patient profile has been created successfully.`;
        const result = await translate(message, { to: "en" });

        sendSms(newPhone, result.text).catch((err) => {
            console.error("Error sending SMS:", err);
        });

        res.status(201).json({
            message: "Patient created successfully",
            patient,
        });
    } catch (error) {
        console.log(error);
        if (error.name === "ValidationError") {
            return res.status(400).json({ error: error.message });
        }
        if (error.code === 11000) {
            return res.status(409).json({
                error: "Patient with this Clerk user ID already exists.",
            });
        }
        res.status(500).json({ error: "Server error", details: error.message });
    }
};

// Get all patients
exports.getAllPatients = async (req, res) => {
    try {
        const patients = await Patient.find();
        res.json(patients);
    } catch (error) {
        res.status(500).json({ error: "Server error", details: error.message });
    }
};

// Get all patients with location data (for admin map)
exports.getAllPatientsWithLocation = async (req, res) => {
    try {
        const patients = await Patient.find({
            "location.latitude": { $ne: null },
            "location.longitude": { $ne: null },
        }).select("fullName phone email location district state address");

        res.json({
            success: true,
            data: patients,
        });
    } catch (error) {
        console.error("Get all patients with location error:", error);
        res.status(500).json({
            success: false,
            error: "Server error",
            details: error.message,
        });
    }
};

// Get a patient by Clerk user ID (from params)
exports.getPatientByClerkId = async (req, res) => {
    try {
        const { clerkUserId } = req.params;
        if (!clerkUserId) {
            return res.status(400).json({
                error: "clerkUserId is required in the request params",
            });
        }
        const patient = await Patient.findOne({ clerkUserId });
        console.log(patient);
        if (!patient) {
            return res.status(404).json({ error: "Patient not found" });
        }
        res.json(patient);
    } catch (error) {
        res.status(500).json({ error: "Server error", details: error.message });
    }
};

exports.getPatientWithEvents = async (req, res) => {
    try {
        const { patientId } = req.params;
        const patient = await Patient.findById(patientId).populate("events");
        if (!patient)
            return res.status(404).json({ error: "Patient not found" });
        res.json(patient);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// Get medication reminders for a patient by clerkUserId
exports.getMedicationReminders = async (req, res) => {
    try {
        const { clerkUserId } = req.params;
        if (!clerkUserId)
            return res
                .status(400)
                .json({ success: false, message: "Missing clerkUserId" });

        const patient = await Patient.findOne({ clerkUserId });
        if (!patient)
            return res
                .status(404)
                .json({ success: false, message: "Patient not found" });

        return res.status(200).json({
            success: true,
            reminders: patient.medicationReminders || [],
        });
    } catch (err) {
        console.error(
            "[patient.getMedicationReminders] error",
            err.message || err
        );
        return res.status(500).json({
            success: false,
            message: "Failed to fetch reminders",
            error: err.message,
        });
    }
};

// Add a medication reminder for a patient
exports.addMedicationReminder = async (req, res) => {
    try {
        const { clerkUserId } = req.params;
        const {
            medicine,
            dosage = "",
            frequency = "",
            time = "",
            note = "",
        } = req.body;

        if (!clerkUserId)
            return res
                .status(400)
                .json({ success: false, message: "Missing clerkUserId" });
        if (!medicine || typeof medicine !== "string" || !medicine.trim()) {
            return res
                .status(400)
                .json({ success: false, message: "medicine is required" });
        }

        const patient = await Patient.findOne({ clerkUserId });
        if (!patient)
            return res
                .status(404)
                .json({ success: false, message: "Patient not found" });

        const reminder = {
            medicine: medicine.trim(),
            dosage: dosage.trim(),
            frequency: frequency.trim(),
            time: time.trim(),
            note: String(note).trim(),
            active: true,
            lastNotifiedAt: null,
        };

        patient.medicationReminders.push(reminder);
        await patient.save();

        // Return the newly added reminder (last item)
        const added =
            patient.medicationReminders[patient.medicationReminders.length - 1];
        return res.status(201).json({ success: true, reminder: added });
    } catch (err) {
        console.error(
            "[patient.addMedicationReminder] error",
            err.message || err
        );
        return res.status(500).json({
            success: false,
            message: "Failed to add reminder",
            error: err.message,
        });
    }
};

// Update a medication reminder
exports.updateMedicationReminder = async (req, res) => {
    try {
        const { clerkUserId, reminderId } = req.params;
        const { medicine, dosage, frequency, time, active, note } = req.body;

        if (!clerkUserId || !reminderId)
            return res
                .status(400)
                .json({ success: false, message: "Missing identifiers" });

        const patient = await Patient.findOne({ clerkUserId });
        if (!patient)
            return res
                .status(404)
                .json({ success: false, message: "Patient not found" });

        // Try Mongoose subdocument access first
        let rem = null;
        if (
            patient.medicationReminders &&
            typeof patient.medicationReminders.id === "function"
        ) {
            rem = patient.medicationReminders.id(reminderId);
        }
        // Fallback to find in case .id is not available or returned plain object
        if (!rem) {
            rem = patient.medicationReminders.find(
                (r) => String(r._id || r.id || "") === String(reminderId)
            );
        }
        if (!rem)
            return res
                .status(404)
                .json({ success: false, message: "Reminder not found" });

        if (medicine !== undefined) rem.medicine = String(medicine).trim();
        if (dosage !== undefined) rem.dosage = String(dosage).trim();
        if (frequency !== undefined) rem.frequency = String(frequency).trim();
        if (time !== undefined) rem.time = String(time).trim();
        if (note !== undefined) rem.note = String(note).trim();
        if (active !== undefined) rem.active = Boolean(active);

        await patient.save();
        return res.status(200).json({ success: true, reminder: rem });
    } catch (err) {
        console.error(
            "[patient.updateMedicationReminder] error",
            err.message || err
        );
        return res.status(500).json({
            success: false,
            message: "Failed to update reminder",
            error: err.message,
        });
    }
};

// Delete a medication reminder
exports.deleteMedicationReminder = async (req, res) => {
    try {
        const { clerkUserId, reminderId } = req.params;
        if (!clerkUserId || !reminderId)
            return res
                .status(400)
                .json({ success: false, message: "Missing identifiers" });

        const patient = await Patient.findOne({ clerkUserId });
        if (!patient)
            return res
                .status(404)
                .json({ success: false, message: "Patient not found" });

        // Try the DocumentArray lookup first (Mongoose subdocument)
        let rem = null;
        if (
            patient.medicationReminders &&
            typeof patient.medicationReminders.id === "function"
        ) {
            rem = patient.medicationReminders.id(reminderId);
        }

        // Fallback: if .id didn't find a subdoc (or isn't available) try to find by _id or id
        if (!rem) {
            rem = patient.medicationReminders.find(
                (r) => String(r._id || r.id || "") === String(reminderId)
            );
        }

        if (!rem)
            return res
                .status(404)
                .json({ success: false, message: "Reminder not found" });

        // If this is a Mongoose subdocument it will have a remove() method; otherwise remove via filter
        if (typeof rem.remove === "function") {
            rem.remove();
        } else {
            patient.medicationReminders = patient.medicationReminders.filter(
                (r) => String(r._id || r.id || "") !== String(reminderId)
            );
        }
        await patient.save();

        return res
            .status(200)
            .json({ success: true, message: "Reminder removed" });
    } catch (err) {
        console.error(
            "[patient.deleteMedicationReminder] error",
            err.message || err
        );
        return res.status(500).json({
            success: false,
            message: "Failed to delete reminder",
            error: err.message,
        });
    }
};

exports.setPreferredLanguage = async (req, res) => {
    try {
        const { clerkUserId } = req.params;
        const { language } = req.body;

        if (!clerkUserId)
            return res
                .status(400)
                .json({ success: false, message: "Missing clerkUserId" });

        const patient = await Patient.findOne({ clerkUserId });
        if (!patient)
            return res
                .status(404)
                .json({ success: false, message: "Patient not found" });

        patient.language = String(language).trim() || "en";
        await patient.save();

        return res
            .status(200)
            .json({ success: true, language: patient.language });
    } catch (err) {
        console.error(
            "[patient.setPreferredLanguage] error",
            err.message || err
        );
        return res.status(500).json({
            success: false,
            message: "Failed to set preferred language",
            error: err.message,
        });
    }
};

// Update patient location (latitude and longitude)
exports.updateLocation = async (req, res) => {
    try {
        const { clerkUserId } = req.params;
        const { latitude, longitude } = req.body;

        if (!clerkUserId) {
            return res.status(400).json({
                success: false,
                message: "Missing clerkUserId",
            });
        }

        if (latitude === undefined || longitude === undefined) {
            return res.status(400).json({
                success: false,
                message: "Latitude and longitude are required",
            });
        }

        // Validate latitude and longitude
        if (typeof latitude !== "number" || latitude < -90 || latitude > 90) {
            return res.status(400).json({
                success: false,
                message: "Latitude must be a number between -90 and 90",
            });
        }

        if (
            typeof longitude !== "number" ||
            longitude < -180 ||
            longitude > 180
        ) {
            return res.status(400).json({
                success: false,
                message: "Longitude must be a number between -180 and 180",
            });
        }

        const patient = await Patient.findOne({ clerkUserId });
        if (!patient) {
            return res.status(404).json({
                success: false,
                message: "Patient not found",
            });
        }

        patient.location = {
            latitude,
            longitude,
        };
        await patient.save();

        return res.status(200).json({
            success: true,
            message: "Location updated successfully",
            location: patient.location,
        });
    } catch (error) {
        console.error("[patient.updateLocation] error", error.message || error);
        return res.status(500).json({
            success: false,
            message: "Failed to update location",
            error: error.message,
        });
    }
};
