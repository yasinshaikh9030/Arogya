const mongoose = require("mongoose");

const patientSchema = new mongoose.Schema(
    {
        // Basic Information
        fullName: {
            type: String,
            required: [true, "Full name is required"],
            trim: true,
            maxlength: [100, "Full name cannot exceed 100 characters"],
        },

        dob: {
            type: Date,
            required: [true, "Date of birth is required"],
            validate: {
                validator: function (value) {
                    return value < new Date();
                },
                message: "Date of birth must be in the past",
            },
        },

        gender: {
            type: String,
            required: [true, "Gender is required"],
            enum: {
                values: ["male", "female", "other"],
                message: "Gender must be one of: Male, Female, Other",
            },
        },

        phone: {
            type: String,
            required: [true, "Phone number is required"],
            trim: true,
            unique: true,
            validate: {
                validator: function (value) {
                    return /^[\+]?[1-9][\d]{0,15}$/.test(value);
                },
                message: "Please enter a valid phone number",
            },
        },

        address: {
            type: String,
            required: [true, "Address is required"],
            trim: true,
            maxlength: [200, "Address cannot exceed 200 characters"],
        },

        district: {
            type: String,
            required: [true, "District is required"],
            trim: true,
            maxlength: [50, "District name cannot exceed 50 characters"],
        },

        govIdType: {
            type: String,
            required: [true, "Government ID type is required"],
            enum: {
                values: [
                    "aadhar",
                    "pan",
                    "passport",
                    "driving-license",
                    "voter-id",
                ],
                message: "Invalid government ID type",
            },
        },

        governmentIdProof: {
            type: String, // this will store the Cloudinary URL or filename
            required: [true, "Government ID proof file is required"],
        },

        emergencyContactName: {
            type: String,
            required: [true, "Emergency contact name is required"],
            trim: true,
            maxlength: [
                100,
                "Emergency contact name cannot exceed 100 characters",
            ],
        },

        emergencyContactPhone: {
            type: String,
            required: [true, "Emergency contact phone is required"],
            trim: true,
            validate: {
                validator: function (value) {
                    return /^[\+]?[1-9][\d]{0,15}$/.test(value);
                },
                message: "Please enter a valid emergency contact phone number",
            },
        },

        medicalHistory: {
            type: String,
            required: [false, "Medical history is required"],
            trim: true,
            maxlength: [1000, "Medical history cannot exceed 1000 characters"],
        },

        // Optional repeatable medical details
        alergies: {
            type: [String],
            default: [],
            trim: true,
        },

        operations: {
            type: [String],
            default: [],
            trim: true,
        },

        ongoingMedications: {
            type: [String],
            default: [],
            trim: true,
        },

        permanentMedications: {
            type: [String],
            default: [],
            trim: true,
        },
        majorDiseases: {
            type: [String],
            default: [],
            trim: true,
        },

        disabilities: {
            type: [String],
            default: [],
            trim: true,
        },

        medicalHistoryDocuments: [
            {
                title: { type: String, trim: true },
                type: { type: String, trim: true },
                fileUrl: { type: String, trim: true },
                uploadedAt: { type: Date, default: Date.now },
            },
        ],

        medicalHistorySummary: {
            type: String,
            trim: true,
            maxlength: [4000, "Medical history summary cannot exceed 4000 characters"],
            default: "",
        },

        telemedicineConsent: {
            type: Boolean,
            required: [true, "Telemedicine consent is required"],
            default: false,
        },

        // Clerk Integration
        clerkUserId: {
            type: String,
            required: [true, "Clerk user ID is required"],
            unique: true,
            trim: true,
        },
        language: {
            type: String,
            required: [false, "Preferred language is required"],
            trim: true,
            maxlength: [50, "Language cannot exceed 50 characters"],
            default: "en",
        },
        medicationReminders: {
            type: [
                {
                    medicine: { type: String, trim: true },
                    dosage: { type: String, trim: true },
                    frequency: { type: String, trim: true },
                    // time is stored as HH:MM (24-hour) string for simplicity
                    time: { type: String, trim: true },
                    // optional note the patient wants included in reminders
                    note: { type: String, trim: true, default: '' },
                    // last time this reminder was notified (used to avoid duplicates)
                    lastNotifiedAt: { type: Date, default: null },
                    active: { type: Boolean, default: true },
                    createdAt: { type: Date, default: Date.now },
                },
            ],
            default: [],
        },
        location: {
            latitude: {
                type: Number,
                default: null,
            },
            longitude: {
                type: Number,
                default: null,
            },
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// Create and export the model
const Patient = mongoose.model("Patient", patientSchema);
module.exports = Patient;
