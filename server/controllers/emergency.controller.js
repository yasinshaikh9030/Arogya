// server/controllers/emergency.controller.js

const Emergency = require("../schema/emergency.schema");
const Doctor = require("../schema/doctor.schema");
const GovDoctors = require("../schema/governmentDoctor.schema");
const AmbulanceService = require("../schema/ambulanceService.schema");
const { sendSms } = require("../config/sms.config");
const dotenv = require("dotenv");
dotenv.config();

// Helper function to generate Google Maps link
const generateGoogleMapsLink = (latitude, longitude) => {
    return `https://www.google.com/maps?q=${latitude},${longitude}`;
};

// Calculate distance between two coordinates using Haversine formula (in kilometers)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
            Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

// Find the nearest available doctor based on location and availability (not in active emergency)
const findNearestDoctor = async (patientLat, patientLon) => {
    try {
        // Doctors currently handling an active emergency (exclude them)
        const busyDoctorIds = await Emergency.find({
            doctorId: { $ne: null },
            isCompleted: false,
            isActive: true,
        }).distinct("doctorId");

        // First, try to find verified doctors with location data and not busy
        const doctors = await Doctor.find({
            verificationStatus: "verified",
            isActive: true,
            _id: { $nin: busyDoctorIds },
            "location.latitude": { $ne: null },
            "location.longitude": { $ne: null },
        }).select("fullName specialty phone email location");

        if (doctors.length === 0) {
            // Fallback to government doctors if no regular doctors found
            const govDoctors = await GovDoctors.find({
                isActive: true,
            }).select("fullName specialty phone");

            if (govDoctors.length > 0) {
                // Return first active government doctor
                return {
                    doctor: govDoctors[0],
                    distance: null,
                    isGovernmentDoctor: true,
                };
            }
            return null;
        }

        // Calculate distance for each doctor and find the nearest
        let nearestDoctor = null;
        let minDistance = Infinity;

        for (const doctor of doctors) {
            const distance = calculateDistance(
                patientLat,
                patientLon,
                doctor.location.latitude,
                doctor.location.longitude
            );

            if (distance < minDistance) {
                minDistance = distance;
                nearestDoctor = doctor;
            }
        }

        return {
            doctor: nearestDoctor,
            distance: minDistance,
            isGovernmentDoctor: false,
        };
    } catch (error) {
        console.error("Error finding nearest doctor:", error);
        return null;
    }
};

// Find nearest ambulance services
const findNearestAmbulances = async (patientLat, patientLon, limit = 3) => {
    try {
        const ambulances = await AmbulanceService.find({
            isActive: true,
        }).select("serviceName phone location district priority");

        if (ambulances.length === 0) {
            return [];
        }

        // Calculate distance for each ambulance
        const ambulancesWithDistance = ambulances
            .map((ambulance) => {
                let distance = null;
                if (
                    ambulance.location?.latitude &&
                    ambulance.location?.longitude
                ) {
                    distance = calculateDistance(
                        patientLat,
                        patientLon,
                        ambulance.location.latitude,
                        ambulance.location.longitude
                    );
                }
                return {
                    ...ambulance.toObject(),
                    distance,
                };
            })
            .sort((a, b) => {
                // Sort by priority first, then by distance
                if (a.priority !== b.priority) {
                    return b.priority - a.priority; // Higher priority first
                }
                if (a.distance === null) return 1;
                if (b.distance === null) return -1;
                return a.distance - b.distance;
            })
            .slice(0, limit);

        return ambulancesWithDistance;
    } catch (error) {
        console.error("Error finding nearest ambulances:", error);
        return [];
    }
};

// Create a new emergency record
exports.createEmergency = async (req, res) => {
    try {
        // const { fullName, phone, location } = req.body;
        const { phone, location } = req.body;

        // // Validation
        // if (
        //     !fullName ||
        //     typeof fullName !== "string" ||
        //     fullName.trim() === ""
        // ) {
        //     return res.status(400).json({
        //         success: false,
        //         message: "Full name is required and must be a non-empty string",
        //     });
        // }

        if (!phone || typeof phone !== "string" || phone.trim() === "") {
            return res.status(400).json({
                success: false,
                message:
                    "Phone number is required and must be a non-empty string",
            });
        }

        // Validate phone format
        const phoneRegex =
            /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/;
        if (!phoneRegex.test(phone)) {
            return res.status(400).json({
                success: false,
                message: "Invalid phone number format",
            });
        }

        // Validate location (required by schema)
        if (!location || typeof location !== "object") {
            return res.status(400).json({
                success: false,
                message:
                    "Location is required and must be an object with latitude and longitude",
            });
        }

        if (
            typeof location.latitude !== "number" ||
            location.latitude < -90 ||
            location.latitude > 90
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Latitude is required and must be a number between -90 and 90",
            });
        }

        if (
            typeof location.longitude !== "number" ||
            location.longitude < -180 ||
            location.longitude > 180
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Longitude is required and must be a number between -180 and 180",
            });
        }

        const googleMapsLink = generateGoogleMapsLink(
            location.latitude,
            location.longitude
        );

        // Find and assign the nearest available doctor
        const doctorAssignment = await findNearestDoctor(
            location.latitude,
            location.longitude
        );

        let assignedDoctor = null;
        let assignedDoctorId = null;

        if (doctorAssignment && doctorAssignment.doctor) {
            assignedDoctor = doctorAssignment.doctor;
            assignedDoctorId = doctorAssignment.doctor._id;
        }

        console.log("================");
        console.log("Assigned Doctor:", assignedDoctor);
        console.log("================");

        // Create emergency record with assigned doctor
        const emergency = await Emergency.create({
            phone: phone.trim(),
            location: {
                latitude: location.latitude,
                longitude: location.longitude,
            },
            googleMapsLink: googleMapsLink,
            doctorId: assignedDoctorId,
            isActive: true, // Mark as active since doctor is assigned
        });

        // Prepare messages
        const patientMessage = assignedDoctor
            ? `🚨 EMERGENCY ALERT 🚨\n\nYour emergency request has been received!\n\nAssigned Doctor: Dr. ${assignedDoctor.fullName}${assignedDoctor.specialty ? ` (${assignedDoctor.specialty})` : ""}\nDoctor Phone: ${assignedDoctor.phone}\n\n📍 Your Location:\n${googleMapsLink}\n\nThe doctor will contact you shortly. Please stay at your location.`
            : `🚨 EMERGENCY ALERT 🚨\n\nYour emergency request has been received!\n\n📍 Your Location:\n${googleMapsLink}\n\nMedical personnel will be assigned shortly. Please stay at your location.`;

        const doctorMessage = assignedDoctor
            ? `🚨 EMERGENCY ASSIGNMENT 🚨\n\nDr. ${assignedDoctor.fullName},\n\nYou have been assigned to an emergency patient!\n\nPatient Phone: ${phone}\nLocation: ${location.latitude}, ${location.longitude}\n\n📍 View on Google Maps:\n${googleMapsLink}\n\nPlease contact the patient immediately!`
            : null;

        const adminMessage = `🚨 NEW EMERGENCY SOS ALERT 🚨\n\nPatient Phone: ${phone}\nLocation: ${location.latitude}, ${location.longitude}\n\n📍 View on Google Maps:\n${googleMapsLink}\n\n${assignedDoctor ? `Doctor Assigned: Dr. ${assignedDoctor.fullName} (${assignedDoctor.phone})` : "⚠️ No doctor available - Manual assignment required"}\n\nEmergency ID: ${emergency._id}`;

        // Send SMS to patient
        try {
            const patientPhoneFormatted = phone.startsWith("+91")
                ? phone
                : `+91${phone}`;
            await sendSms(patientPhoneFormatted, patientMessage);
            console.log(`Emergency alert sent to patient: ${phone}`);
        } catch (error) {
            console.error("Failed to send SMS to patient:", error);
        }

        // Send SMS to assigned doctor
        if (assignedDoctor && doctorMessage) {
            try {
                const doctorPhoneFormatted = assignedDoctor.phone.startsWith("+91")
                    ? assignedDoctor.phone
                    : `+91${assignedDoctor.phone}`;
                await sendSms(doctorPhoneFormatted, doctorMessage);
                console.log(`Emergency assignment sent to Dr. ${assignedDoctor.fullName}: ${assignedDoctor.phone}`);
            } catch (error) {
                console.error(`Failed to send SMS to doctor:`, error);
            }
        }

        // Send SMS to admin
        if (process.env.TEST_PHONE_NUMBER) {
            sendSms(process.env.TEST_PHONE_NUMBER, adminMessage).catch((err) => {
                console.error("Error sending SMS to admin:", err);
            });
        }

        // Find and notify nearest ambulance services
        const nearestAmbulances = await findNearestAmbulances(
            location.latitude,
            location.longitude,
            3 // Notify top 3 nearest ambulances
        );

        if (nearestAmbulances.length > 0) {
            const ambulanceMessage = `🚨 EMERGENCY ALERT 🚨\n\nAmbulance Service Required!\n\nPatient Phone: ${phone}\nLocation: ${location.latitude}, ${location.longitude}\n\n📍 View on Google Maps:\n${googleMapsLink}\n\n${assignedDoctor ? `Assigned Doctor: Dr. ${assignedDoctor.fullName} (${assignedDoctor.phone})` : ""}\n\nPlease dispatch ambulance immediately!`;

            const ambulancePromises = nearestAmbulances.map(async (ambulance) => {
                try {
                    const ambulancePhoneFormatted = ambulance.phone.startsWith("+91")
                        ? ambulance.phone
                        : `+91${ambulance.phone}`;
                    await sendSms(ambulancePhoneFormatted, ambulanceMessage);
                    console.log(`Ambulance alert sent to ${ambulance.serviceName}: ${ambulance.phone}`);
                } catch (error) {
                    console.error(`Failed to send SMS to ambulance ${ambulance.serviceName}:`, error);
                }
            });

            await Promise.allSettled(ambulancePromises);
        }

        return res.status(201).json({
            success: true,
            message: "Emergency record created successfully. Doctor assigned and notifications sent.",
            data: {
                emergency: emergency,
                assignedDoctor: assignedDoctor
                    ? {
                          _id: assignedDoctor._id,
                          fullName: assignedDoctor.fullName,
                          specialty: assignedDoctor.specialty,
                          phone: assignedDoctor.phone,
                          distance: doctorAssignment.distance,
                      }
                    : null,
                ambulancesNotified: nearestAmbulances.length,
                googleMapsLink: googleMapsLink,
            },
        });
    } catch (error) {
        console.error("Create emergency error:", error);

        if (error.name === "ValidationError") {
            return res.status(400).json({
                success: false,
                message: "Validation error",
                error: error.message,
            });
        }

        return res.status(500).json({
            success: false,
            message: "Failed to create emergency record",
            error: error.message,
        });
    }
};

// Get all emergency records
exports.getAllEmergencies = async (req, res) => {
    try {
        const emergencies = await Emergency.find({}, "-videoCallLink")
            .populate(
                "doctorId",
                "fullName specialty phone email consultationFee availableSlots"
            )
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            data: emergencies,
        });
    } catch (error) {
        console.error("Get all emergencies error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch emergency records",
            error: error.message,
        });
    }
};

// Get a single emergency record by ID
exports.getEmergencyById = async (req, res) => {
    try {
        const { id } = req.params;

        const emergency = await Emergency.findById(id).populate(
            "doctorId",
            "fullName specialty phone email"
        );

        if (!emergency) {
            return res.status(404).json({
                success: false,
                message: "Emergency record not found",
            });
        }

        return res.status(200).json({
            success: true,
            data: emergency,
        });
    } catch (error) {
        console.error("Get emergency by ID error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch emergency record",
            error: error.message,
        });
    }
};

// Update emergency record (e.g., add video call link)
exports.updateEmergency = async (req, res) => {
    try {
        const { id } = req.params;
        const { videoCallLink, doctorId, location } = req.body;

        const updateData = {};
        if (videoCallLink !== undefined)
            updateData.videoCallLink = videoCallLink;
        if (doctorId !== undefined) updateData.doctorId = doctorId;
        if (location !== undefined) {
            // Validate location
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

        const emergency = await Emergency.findByIdAndUpdate(
            id,
            { $set: updateData },
            { new: true, runValidators: true }
        ).populate("doctorId", "fullName specialty phone email");

        if (!emergency) {
            return res.status(404).json({
                success: false,
                message: "Emergency record not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Emergency record updated successfully",
            data: emergency,
        });
    } catch (error) {
        console.error("Update emergency error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to update emergency record",
            error: error.message,
        });
    }
};

// Generate video call link for emergency (uses emergency ID as roomID)
exports.generateVideoCallLink = async (req, res) => {
    try {
        const { id } = req.params;
        const baseUrl = process.env.FRONTEND_URL || "http://localhost:5173";

        const emergency = await Emergency.findById(id);
        if (!emergency) {
            return res.status(404).json({
                success: false,
                message: "Emergency record not found",
            });
        }

        // Use emergency ID as roomID for consistent video calls
        const roomID = emergency._id.toString();
        const videoCallLink = `${baseUrl}/emer-appointment/?roomID=${roomID}`;

        // Update emergency with video call link
        emergency.videoCallLink = videoCallLink;
        await emergency.save();

        console.log("Generated video call link for emergency:", id);
        console.log("Room ID:", roomID);
        console.log("Video Call Link:", videoCallLink);

        return res.status(200).json({
            success: true,
            message: "Video call link generated successfully",
            data: {
                emergencyId: emergency._id,
                roomID: roomID,
                videoCallLink: videoCallLink,
            },
        });
    } catch (error) {
        console.error("Generate video call link error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to generate video call link",
            error: error.message,
        });
    }
};

// Delete emergency record
exports.deleteEmergency = async (req, res) => {
    try {
        const { id } = req.params;

        const emergency = await Emergency.findByIdAndDelete(id);

        if (!emergency) {
            return res.status(404).json({
                success: false,
                message: "Emergency record not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Emergency record deleted successfully",
        });
    } catch (error) {
        console.error("Delete emergency error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to delete emergency record",
            error: error.message,
        });
    }
};

// Single-click emergency alarm - sends location via Google Maps to medical personnel
exports.triggerEmergencyAlarm = async (req, res) => {
    try {
        const { phone, location } = req.body;

        // Validation
        if (!phone || typeof phone !== "string" || phone.trim() === "") {
            return res.status(400).json({
                success: false,
                message: "Phone number is required and must be a non-empty string",
            });
        }

        // Validate phone format
        const phoneRegex = /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/;
        if (!phoneRegex.test(phone)) {
            return res.status(400).json({
                success: false,
                message: "Invalid phone number format",
            });
        }

        // Validate location
        if (!location || typeof location !== "object") {
            return res.status(400).json({
                success: false,
                message: "Location is required and must be an object with latitude and longitude",
            });
        }

        if (
            typeof location.latitude !== "number" ||
            location.latitude < -90 ||
            location.latitude > 90
        ) {
            return res.status(400).json({
                success: false,
                message: "Latitude is required and must be a number between -90 and 90",
            });
        }

        if (
            typeof location.longitude !== "number" ||
            location.longitude < -180 ||
            location.longitude > 180
        ) {
            return res.status(400).json({
                success: false,
                message: "Longitude is required and must be a number between -180 and 180",
            });
        }

        // Generate Google Maps link
        const googleMapsLink = generateGoogleMapsLink(
            location.latitude,
            location.longitude
        );

        // Create emergency record
        const emergency = await Emergency.create({
            phone: phone.trim(),
            location: {
                latitude: location.latitude,
                longitude: location.longitude,
            },
            googleMapsLink: googleMapsLink,
        });

        // Prepare emergency alert message with Google Maps link
        const emergencyMessage = `🚨 EMERGENCY ALARM 🚨\n\nPatient needs immediate medical attention!\n\nPhone: ${phone}\nLocation: ${location.latitude}, ${location.longitude}\n\n📍 View on Google Maps:\n${googleMapsLink}\n\nPlease respond immediately!`;

        // Send SMS to admin
        if (process.env.TEST_PHONE_NUMBER) {
            sendSms(process.env.TEST_PHONE_NUMBER, emergencyMessage).catch((err) => {
                console.error("Error sending SMS to admin:", err);
            });
        }

        // Send SMS to all active government doctors
        // try {
        //     const activeDoctors = await GovDoctors.find({ isActive: true }).select("phone fullName");
            
        //     const doctorPromises = activeDoctors.map(async (doctor) => {
        //         const doctorMessage = `🚨 EMERGENCY ALARM 🚨\n\nDr. ${doctor.fullName},\n\nA patient needs immediate medical attention!\n\nPatient Phone: ${phone}\nLocation: ${location.latitude}, ${location.longitude}\n\n📍 View on Google Maps:\n${googleMapsLink}\n\nPlease respond immediately!`;

        //         // Format phone number
        //         let doctorPhone = doctor.phone.startsWith("+91")
        //             ? doctor.phone
        //             : `+91${doctor.phone}`;

        //         try {
        //             await sendSms(doctorPhone, doctorMessage);
        //             console.log(`Emergency alert sent to Dr. ${doctor.fullName} (${doctorPhone})`);
        //         } catch (error) {
        //             console.error(`Failed to send SMS to Dr. ${doctor.fullName}:`, error);
        //         }
        //     });

        //     await Promise.allSettled(doctorPromises);
        // } catch (error) {
        //     console.error("Error sending SMS to government doctors:", error);
        // }

        console.log(`Emergency alarm triggered for phone: ${phone}`);
        console.log(`Google Maps link: ${googleMapsLink}`);

        return res.status(201).json({
            success: true,
            message: "Emergency alarm triggered successfully. Medical personnel have been alerted with your location.",
            data: {
                emergencyId: emergency._id,
                googleMapsLink: googleMapsLink,
                location: {
                    latitude: location.latitude,
                    longitude: location.longitude,
                },
            },
        });
    } catch (error) {
        console.error("Trigger emergency alarm error:", error);

        if (error.name === "ValidationError") {
            return res.status(400).json({
                success: false,
                message: "Validation error",
                error: error.message,
            });
        }

        return res.status(500).json({
            success: false,
            message: "Failed to trigger emergency alarm",
            error: error.message,
        });
    }
};
