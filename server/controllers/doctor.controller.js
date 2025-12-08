// server/controllers/doctor.controller.js

const Doctor = require("../schema/doctor.schema");
const Appointment = require('../schema/appointment.schema');
const Rating = require('../schema/rating.schema');
const Patient = require('../schema/patient.schema');
const cloudinary = require("../config/cloudinary");

// Create a new doctor
exports.createDoctor = async (req, res) => {
    try {
        const {
            fullName,
            qualifications,
            registrationNumber,
            specialty,
            phone,
            email,
            licenseFile,
            idProofFile,
            affiliation,
            experience,
            telemedicineConsent,
            clerkUserId
        } = req.body;

        console.log("====> ", clerkUserId)
        // const clerkUserId = req.auth?.userId;

        if (
            !fullName ||
            !qualifications ||
            !registrationNumber ||
            !specialty ||
            !phone ||
            !email
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Missing required fields: fullName, qualifications, registrationNumber, specialty, phone, email",
            });
        }

        console.log(fullName, qualifications, registrationNumber, specialty, phone, email, clerkUserId);

        if (!clerkUserId) {
            return res.status(401).json({
                success: false,
                message: "User not authenticated",
            });
        }

        const existingDoctor = await Doctor.findOne({
            $or: [
                { email },
                { phone },
                { registrationNumber },
                { clerkUserId },
            ],
        });

        if (existingDoctor) {
            return res.status(400).json({
                success: false,
                message:
                    "Doctor with this email, phone, registration number, or user account already exists",
            });
        }

        // Support receiving two files via multer.fields: licenseFile and idProofFile
        let licenseFileUrl = "";
        let idProofFileUrl = "";

        async function uploadBufferToCloud(buffer, folder = 'doctor_docs') {
            const uploadResult = await new Promise((resolve, reject) => {
                const stream = cloudinary.uploader.upload_stream({ resource_type: 'auto', folder }, (error, result) => {
                    if (error) return reject(error);
                    resolve(result);
                });
                stream.end(buffer);
            });
            return uploadResult?.secure_url || '';
        }

        // multer.fields populates req.files as an object: { licenseFile: [file], idProofFile: [file] }
        if (req.files && req.files.licenseFile && req.files.licenseFile[0]) {
            try {
                licenseFileUrl = await uploadBufferToCloud(req.files.licenseFile[0].buffer, 'doctor_docs');
            } catch (err) {
                console.error('[doctor.createDoctor] license upload failed:', err.message || err);
            }
        }

        if (req.files && req.files.idProofFile && req.files.idProofFile[0]) {
            try {
                idProofFileUrl = await uploadBufferToCloud(req.files.idProofFile[0].buffer, 'doctor_docs');
            } catch (err) {
                console.error('[doctor.createDoctor] idProof upload failed:', err.message || err);
            }
        }

        console.log("License File URL:", licenseFileUrl);
        console.log("ID Proof File URL:", idProofFileUrl);

        const doctor = await Doctor.create({
            fullName,
            qualifications,
            registrationNumber,
            specialty,
            phone,
            email,
            licenseFile: licenseFileUrl || "",
            idProofFile: idProofFileUrl || "",
            affiliation: affiliation || "",
            experience: experience || "0",
            telemedicineConsent:
                telemedicineConsent !== undefined ? telemedicineConsent : true,
            clerkUserId,
        });

        console.log("Doctor created:", doctor);

        res.status(201).json({
            success: true,
            message: "Doctor registered successfully",
            data: {
                id: doctor._id,
                fullName: doctor.fullName,
                specialty: doctor.specialty,
                email: doctor.email,
                verificationStatus: doctor.verificationStatus,
            },
        });
    } catch (error) {
        console.error("Doctor registration error:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
};

// ===== Availability & Slots =====

// Helper: convert HH:MM to minutes
function toMinutes(hhmm) {
    const [h, m] = hhmm.split(":").map(Number);
    return h * 60 + m;
}

// Helper: format minutes to HH:MM
function toHHMM(mins) {
    const h = Math.floor(mins / 60)
        .toString()
        .padStart(2, "0");
    const m = (mins % 60).toString().padStart(2, "0");
    return `${h}:${m}`;
}

// Helper: day name from date string YYYY-MM-DD
function dayName(dateStr) {
    const d = new Date(`${dateStr}T00:00:00`);
    const names = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
    ];
    return names[d.getDay()];
}

// POST /api/doctor/availability - set weekly availability ranges
exports.setAvailability = async (req, res) => {
    try {
        const clerkUserId = req.auth?.userId || req.body.clerkUserId;
        if (!clerkUserId) {
            return res.status(401).json({ success: false, message: "User not authenticated" });
        }
        const { availableSlots } = req.body; // [{ day, startTime, endTime }]
        if (!Array.isArray(availableSlots)) {
            return res.status(400).json({ success: false, message: "availableSlots must be an array" });
        }
        const doctor = await Doctor.findOneAndUpdate(
            { clerkUserId },
            { $set: { availableSlots } },
            { new: true }
        );
        if (!doctor) return res.status(404).json({ success: false, message: "Doctor not found" });
        res.json({ success: true, data: doctor.availableSlots });
    } catch (error) {
        console.error("setAvailability error:", error);
        res.status(500).json({ success: false, message: "Failed to save availability" });
    }
};

// GET /api/doctor/availability - get weekly availability
exports.getAvailability = async (req, res) => {
    try {
        const clerkUserId = req.auth?.userId || req.query.clerkUserId;
        if (!clerkUserId) {
            return res.status(401).json({ success: false, message: "User not authenticated" });
        }
        const doctor = await Doctor.findOne({ clerkUserId }).select("availableSlots");
        if (!doctor) return res.status(404).json({ success: false, message: "Doctor not found" });
        res.json({ success: true, data: doctor.availableSlots || [] });
    } catch (error) {
        console.error("getAvailability error:", error);
        res.status(500).json({ success: false, message: "Failed to fetch availability" });
    }
};

// POST /api/doctor/blackouts - add a blackout (freeze window) for date
exports.addBlackout = async (req, res) => {
    try {
        const clerkUserId = req.auth?.userId || req.body.clerkUserId;
        if (!clerkUserId) {
            return res.status(401).json({ success: false, message: "User not authenticated" });
        }
        const { date, startTime, endTime } = req.body;
        if (!date || !startTime || !endTime) {
            return res.status(400).json({ success: false, message: "date, startTime, endTime are required" });
        }
        const doctor = await Doctor.findOneAndUpdate(
            { clerkUserId },
            { $push: { blackouts: { date, startTime, endTime } } },
            { new: true }
        );
        if (!doctor) return res.status(404).json({ success: false, message: "Doctor not found" });
        res.json({ success: true, data: doctor.blackouts });
    } catch (error) {
        console.error("addBlackout error:", error);
        res.status(500).json({ success: false, message: "Failed to add blackout" });
    }
};

// DELETE /api/doctor/blackouts/:index - remove blackout by index
exports.removeBlackout = async (req, res) => {
    try {
        const clerkUserId = req.auth?.userId || req.query.clerkUserId;
        const index = Number(req.params.index);
        if (!clerkUserId) {
            return res.status(401).json({ success: false, message: "User not authenticated" });
        }
        if (Number.isNaN(index)) {
            return res.status(400).json({ success: false, message: "Invalid index" });
        }
        const doctor = await Doctor.findOne({ clerkUserId });
        if (!doctor) return res.status(404).json({ success: false, message: "Doctor not found" });
        if (!Array.isArray(doctor.blackouts) || index < 0 || index >= doctor.blackouts.length) {
            return res.status(400).json({ success: false, message: "Blackout not found" });
        }
        doctor.blackouts.splice(index, 1);
        await doctor.save();
        res.json({ success: true, data: doctor.blackouts });
    } catch (error) {
        console.error("removeBlackout error:", error);
        res.status(500).json({ success: false, message: "Failed to remove blackout" });
    }
};

// GET /api/doctor/:doctorId/slots?date=YYYY-MM-DD - list 20-min available slots
exports.getAvailableSlotsForDate = async (req, res) => {
    try {
        const { doctorId } = req.params;
        const { date } = req.query;
        if (!doctorId || !date) {
            return res.status(400).json({ success: false, message: "doctorId and date are required" });
        }
        const doctor = await Doctor.findById(doctorId).select("availableSlots blackouts");
        if (!doctor) return res.status(404).json({ success: false, message: "Doctor not found" });

        const day = dayName(date);
        const ranges = (doctor.availableSlots || []).filter((r) => r.day === day);
        if (ranges.length === 0) return res.json({ success: true, data: [] });

        // Build blackout intervals for that date
        const blackouts = (doctor.blackouts || []).filter((b) => b.date === date);
        const blackoutIntervals = blackouts.map((b) => [toMinutes(b.startTime), toMinutes(b.endTime)]);

        // Fetch booked appointments for the day (LOCAL time window)
        // Using local boundaries avoids UTC date-shift that can miss matches
        const dayStart = new Date(`${date}T00:00:00`);
        const dayEnd = new Date(`${date}T23:59:59.999`);
        const booked = await Appointment.find({ doctorId, scheduledAt: { $gte: dayStart, $lte: dayEnd } })
            .select("scheduledAt");
        const bookedSet = new Set(
            booked.map((a) => {
                const d = new Date(a.scheduledAt);
                // Compare in LOCAL time to match availability ranges
                const hh = d.getHours().toString().padStart(2, "0");
                const mm = d.getMinutes().toString().padStart(2, "0");
                return `${hh}:${mm}`;
            })
        );

        // Generate 20-min slots inside ranges, exclude blackouts and booked
        const result = [];
        for (const r of ranges) {
            const start = toMinutes(r.startTime);
            const end = toMinutes(r.endTime);
            for (let t = start; t + 20 <= end; t += 20) {
                const hhmm = toHHMM(t);
                // exclude if inside a blackout
                const inBlackout = blackoutIntervals.some(([s, e]) => t >= s && t < e);
                if (inBlackout) continue;
                if (bookedSet.has(hhmm)) continue;
                result.push(hhmm);
            }
        }

        res.json({ success: true, data: result });
    } catch (error) {
        console.error("getAvailableSlotsForDate error:", error);
        res.status(500).json({ success: false, message: "Failed to fetch slots" });
    }
};

// Get all doctors
exports.getAllDoctors = async (req, res) => {
    try {
        const doctors = await Doctor.find({ isActive: true })
            .select(
                "fullName specialty email phone verificationStatus rating experience"
            )
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            data: doctors,
        });
    } catch (error) {
        console.error("Get doctors error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch doctors",
            error: error.message,
        });
    }
};

// Get a single doctor by clerkUserId
exports.getDoctorByClerkUserId = async (req, res) => {
    try {
        const { clerkUserId } = req.params;
        const doctor = await Doctor.findOne({ clerkUserId });

        if (!doctor) {
            return res.status(404).json({
                success: false,
                message: "Doctor not found",
            });
        }

        res.json({
            success: true,
            data: doctor,
        });
    } catch (error) {
        console.error("Get doctor error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch doctor",
            error: error.message,
        });
    }
};

// Upsert (create or update) doctor profile
exports.upsertDoctorProfile = async (req, res) => {
    try {
        // Extract all relevant fields from req.body
        const {
            fullName,
            qualifications,
            registrationNumber,
            specialty,
            phone,
            email,
            affiliation,
            experience,
            bio,
            languages,
            address,
            district,
            state,
            consultationFee,
            telemedicineConsent,
            bankAccount,
            upiId,
            paymentMethod,
        } = req.body;

        // Get clerkUserId from auth (or req.body as fallback for testing)
        const clerkUserId = req.auth?.userId || req.body.clerkUserId;

        if (!clerkUserId) {
            return res.status(401).json({
                success: false,
                message: "User not authenticated",
            });
        }

        // Build the update object
        const update = {
            fullName,
            qualifications,
            registrationNumber,
            specialty,
            phone,
            email,
            affiliation,
            experience,
            bio,
            languages,
            address,
            district,
            state,
            consultationFee,
            telemedicineConsent,
            bankAccount,
            upiId,
            paymentMethod,
            clerkUserId,
            verificationStatus: "pending",
        };

        // Remove undefined fields (so we don't overwrite with undefined)
        Object.keys(update).forEach((key) => {
            if (update[key] === undefined) delete update[key];
        });

        // Upsert: update if exists, otherwise create
        const doctor = await Doctor.findOneAndUpdate(
            { clerkUserId },
            { $set: update },
            { new: true, upsert: true, setDefaultsOnInsert: true }
        );

        res.json({
            success: true,
            message: "Doctor profile saved successfully",
            data: doctor,
        });
    } catch (error) {
        console.error("Upsert doctor error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to save doctor profile",
            error: error.message,
        });
    }
};

// List only verified doctors
exports.getVerifiedDoctors = async (req, res) => {
    try {
        let query = { verificationStatus: "verified" };
        let selectFields = null;
        // If ?full=true, return full documents (all fields inc. docs and bank)
        if (!req.query.full || req.query.full !== "true") {
            selectFields = [
                "fullName specialty qualifications registrationNumber phone email licenseFile idProofFile affiliation experience consultationFee languages rating bio verificationStatus ",
                "address district state ",
                "bankAccount.accountNumber bankAccount.ifscCode bankAccount.bankName bankAccount.accountHolderName bankAccount.branchName ",
                "upiId"
            ].join("");
        }
        const doctors = await Doctor.find(query)
            .select(selectFields)
            .sort({ createdAt: -1 });
        res.json({ success: true, data: doctors });
    } catch (error) {
        console.error("Get verified doctors error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch verified doctors",
        });
    }
};

// List pending doctors (for admin verification)
exports.getPendingDoctors = async (req, res) => {
    try {
        let query = { verificationStatus: "pending" };
        let selectFields = null;
        // If ?full=true, return full documents (all fields inc. docs and bank)
        if (!req.query.full || req.query.full !== "true") {
            selectFields = [
                "fullName specialty qualifications registrationNumber phone email licenseFile idProofFile affiliation experience consultationFee languages rating bio verificationStatus ",
                "address district state ",
                "bankAccount.accountNumber bankAccount.ifscCode bankAccount.bankName bankAccount.accountHolderName bankAccount.branchName ",
                "upiId createdAt"
            ].join("");
        }
        const doctors = await Doctor.find(query)
            .select(selectFields)
            .sort({ createdAt: -1 });
        
        res.json({ success: true, data: doctors });
    } catch (error) {
        console.error("Get pending doctors error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch pending doctors",
        });
    }
};

// Verify a doctor (update verificationStatus to "verified")
exports.verifyDoctor = async (req, res) => {
    try {
        const { doctorId } = req.params;
        
        if (!doctorId) {
            return res.status(400).json({
                success: false,
                message: "Doctor ID is required",
            });
        }

        const doctor = await Doctor.findByIdAndUpdate(
            doctorId,
            {
                verificationStatus: "verified",
                verifiedAt: new Date(),
            },
            { new: true }
        );

        if (!doctor) {
            return res.status(404).json({
                success: false,
                message: "Doctor not found",
            });
        }

        res.json({
            success: true,
            message: "Doctor verified successfully",
            data: doctor,
        });
    } catch (error) {
        console.error("Verify doctor error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to verify doctor",
            error: error.message,
        });
    }
};

// Get all doctors with location data (for admin map)
exports.getAllDoctorsWithLocation = async (req, res) => {
    try {
        const doctors = await Doctor.find({
            "location.latitude": { $ne: null },
            "location.longitude": { $ne: null },
        }).select("fullName specialty phone email location district state address consultationFee");
        
        res.json({
            success: true,
            data: doctors,
        });
    } catch (error) {
        console.error("Get all doctors with location error:", error);
        res.status(500).json({
            success: false,
            error: "Server error",
            details: error.message,
        });
    }
};

// Update doctor location (latitude and longitude)
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
        if (
            typeof latitude !== "number" ||
            latitude < -90 ||
            latitude > 90
        ) {
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

        const doctor = await Doctor.findOne({ clerkUserId });
        if (!doctor) {
            return res.status(404).json({
                success: false,
                message: "Doctor not found",
            });
        }

        doctor.location = {
            latitude,
            longitude,
        };
        await doctor.save();

        return res.status(200).json({
            success: true,
            message: "Location updated successfully",
            location: doctor.location,
        });
    } catch (error) {
        console.error("[doctor.updateLocation] error", error.message || error);
        return res.status(500).json({
            success: false,
            message: "Failed to update location",
            error: error.message,
        });
    }
};

// Return verified doctors with aggregated stats (appointments, ratings, patients count)
exports.getVerifiedDoctorsWithStats = async (req, res) => {
    try {
        // Query param to control active/inactive
        // Default: active = true (doctors working with patients)
        const activeParam = typeof req.query.active !== 'undefined' ? String(req.query.active).toLowerCase() : 'true';
        const active = activeParam === 'false' ? false : true;

        const selectFields = (String(req.query.full) === 'true')
            ? undefined // return full document
            : 'fullName specialty phone email consultationFee experience languages bio _id verificationStatus';

        // Find verified doctors with provided active flag
        const doctors = await Doctor.find({ verificationStatus: 'verified', isActive: active }).select(selectFields);

        const doctorIds = doctors.map(d => d._id);

        // Appointments aggregation per doctor
        const now = new Date();
        const next24 = new Date(now.getTime() + 24*60*60*1000);

        // Consider only confirmed/completed appointments as 'working with patients'
        const apptAgg = await Appointment.aggregate([
            { $match: { doctorId: { $in: doctorIds }, status: { $in: ['confirmed','completed'] } } },
            { $group: {
                _id: '$doctorId',
                totalAppointments: { $sum: 1 },
                upcoming24: { $sum: { $cond: [ { $and: [ { $gte: ['$scheduledAt', now] }, { $lt: ['$scheduledAt', next24] } ] }, 1, 0 ] } },
                patients: { $addToSet: '$patientId' },
                lastAppointmentAt: { $max: '$scheduledAt' }
            } }
        ]);

        // ratings per doctor
        const ratingAgg = await Rating.aggregate([
            { $match: { doctorId: { $in: doctorIds } } },
            { $group: { _id: '$doctorId', avgRating: { $avg: '$rating' }, ratingCount: { $sum: 1 } } }
        ]);

        // Build lookup maps
        const apptMap = new Map(apptAgg.map(a => [String(a._id), a]));
        const ratingMap = new Map(ratingAgg.map(r => [String(r._id), r]));

        const result = doctors.map(doc => {
            const key = String(doc._id);
            const a = apptMap.get(key) || { totalAppointments: 0, upcoming24: 0, patients: [] };
            const r = ratingMap.get(key) || { avgRating: null, ratingCount: 0 };
            return {
                _id: doc._id,
                fullName: doc.fullName,
                specialty: doc.specialty,
                phone: doc.phone,
                email: doc.email,
                consultationFee: doc.consultationFee,
                experience: doc.experience,
                languages: doc.languages,
                bio: doc.bio,
                verificationStatus: doc.verificationStatus,
                stats: {
                    totalAppointments: a.totalAppointments || 0,
                    upcoming24: a.upcoming24 || 0,
                    uniquePatients: (a.patients || []).length,
                    lastAppointmentAt: a.lastAppointmentAt || null,
                    avgRating: r.avgRating ? Number(r.avgRating.toFixed(2)) : null,
                    ratingCount: r.ratingCount || 0,
                }
            };
        });

        // If active=true we keep only those with appointments (working with patients).
        // If active=false (inactive doctors) return all verified inactive docs regardless of appointment counts.
        const filtered = active ? result.filter(d => (d.stats?.totalAppointments || 0) > 0) : result;
        console.log(filtered);
        return res.json({ success: true, data: filtered, meta: { active, returned: filtered.length } });
    } catch (err) {
        console.error('[doctor.getVerifiedDoctorsWithStats] error', err.message || err);
        return res.status(500).json({ success: false, message: 'Failed to load doctors', error: err.message });
    }
};

// Get verified doctors and their unique patients
exports.getVerifiedDoctorsWithPatients = async (req, res) => {
    try {
        // find all verified doctors
        const doctors = await Doctor.find({ verificationStatus: 'verified' }).select('fullName specialty _id email phone');

        if (!doctors || doctors.length === 0) {
            return res.json({ success: true, data: [] });
        }

        const doctorIds = doctors.map(d => d._id);

        // aggregate unique patient ids per doctor from appointments
        const agg = await Appointment.aggregate([
            { $match: { doctorId: { $in: doctorIds } } },
            { $group: { _id: { doctorId: '$doctorId' }, patients: { $addToSet: '$patientId' } } }
        ]);

        // build map doctorId -> [patientIds]
        const map = new Map();
        for (const row of agg) {
            const docId = String(row._id.doctorId || row._id);
            map.set(docId, row.patients || []);
        }

        // collect all patient ids to fetch details in one query
        const allPatientIds = new Set();
        for (const arr of map.values()) {
            for (const pid of arr) allPatientIds.add(String(pid));
        }

        let patientDocs = [];
        if (allPatientIds.size > 0) {
            patientDocs = await Patient.find({ _id: { $in: Array.from(allPatientIds) } }).select('fullName phone email dob district');
        }

        const patientById = new Map(patientDocs.map(p => [String(p._id), p]));

        const result = doctors.map(doc => {
            const pids = map.get(String(doc._id)) || [];
            const patients = pids.map(pid => patientById.get(String(pid))).filter(Boolean);
            return {
                _id: doc._id,
                fullName: doc.fullName,
                specialty: doc.specialty,
                email: doc.email,
                phone: doc.phone,
                patients,
            };
        });

        return res.json({ success: true, data: result });
    } catch (err) {
        console.error('[doctor.getVerifiedDoctorsWithPatients] error', err.message || err);
        return res.status(500).json({ success: false, message: 'Failed to fetch doctors with patients', error: err.message });
    }
};
