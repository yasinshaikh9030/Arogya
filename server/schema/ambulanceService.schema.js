const mongoose = require("mongoose");

// Ambulance Service Schema
const ambulanceServiceSchema = new mongoose.Schema(
    {
        serviceName: {
            type: String,
            required: [true, "Service name is required"],
            trim: true,
            maxlength: [100, "Service name cannot exceed 100 characters"],
        },
        phone: {
            type: String,
            required: [true, "Phone number is required"],
            trim: true,
            minlength: [10, "Phone number must be at least 10 digits"],
            maxlength: [15, "Phone number cannot exceed 15 digits"],
            match: [/^[0-9+\-\s()]+$/, "Please fill a valid phone number"],
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
        district: {
            type: String,
            trim: true,
            maxlength: [50, "District name cannot exceed 50 characters"],
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        priority: {
            type: Number,
            default: 1,
            min: [1, "Priority must be at least 1"],
            max: [10, "Priority cannot exceed 10"],
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// Indexes
ambulanceServiceSchema.index({ isActive: 1, priority: -1 });
ambulanceServiceSchema.index({ "location.latitude": 1, "location.longitude": 1 });

// Create and export the model
const AmbulanceService = mongoose.model("AmbulanceService", ambulanceServiceSchema);
module.exports = AmbulanceService;

