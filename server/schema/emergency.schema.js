const mongoose = require("mongoose");

const emergencySchema = new mongoose.Schema(
    {
        // Patient Information
        fullName: {
            type: String,
            // required: [true, "Full name is required"],
            trim: true,
            maxlength: [100, "Full name cannot exceed 100 characters"],
        },
        phone: {
            type: String,
            required: [true, "Phone number is required"],
            trim: true,
            validate: {
                validator: function (value) {
                    // Validates phone numbers with or without country code
                    return /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/.test(
                        value
                    );
                },
                message: "Invalid phone number format",
            },
        },

        // Location Information
        location: {
            latitude: {
                type: Number,
                required: [true, "Latitude is required"],
                min: [-90, "Latitude must be between -90 and 90"],
                max: [90, "Latitude must be between -90 and 90"],
            },
            longitude: {
                type: Number,
                required: [true, "Longitude is required"],
                min: [-180, "Longitude must be between -180 and 180"],
                max: [180, "Longitude must be between -180 and 180"],
            },
        },
        googleMapsLink: {
            type: String,
            trim: true,
            default: "",
        },
        // Video Call Link
        videoCallLink: {
            type: String,
            trim: true,
            default: "",
        },

        // Link to doctor if assigned
        doctorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Doctor",
            default: null,
        },

        isActive: {
            type: Boolean,
            default: false,
        },
        isCompleted: {
            type: Boolean,
            default: false,
        },
        completedAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// Indexes for better query performance
emergencySchema.index({ createdAt: -1 });
emergencySchema.index({ "location.latitude": 1, "location.longitude": 1 });

// Create and export the model
const Emergency = mongoose.model("Emergency", emergencySchema);
module.exports = Emergency;
