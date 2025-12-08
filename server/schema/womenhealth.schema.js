const mongoose = require("mongoose");

const DailyLogSchema = new mongoose.Schema({
    date: { type: Date, required: true },

    // Flow intensity: none, light, medium, heavy
    flowIntensity: {
        type: String,
        enum: ["none", "light", "medium", "heavy"],
        default: "none",
    },

    // Symptoms logged by user
    symptoms: [
        {
            type: String,
            enum: [
                "cramps",
                "bloating",
                "headache",
                "fatigue",
                "acne",
                "nausea",
                "moodSwing",
                "backPain",
                "heavyBleeding",
                "spotting",
                "clotting",
            ],
        },
    ],

    mood: { type: String }, // optional
    notes: { type: String }, //ooptional// user's personal notes
});

const CycleSchema = new mongoose.Schema({
    cycleStart: { type: Date, required: true }, // first day of period
    cycleEnd: { type: Date }, // last day of period (optional initially)

    // Length of this period (number of days)
    periodLength: { type: Number, default: 0 },

    // Can store multiple period days (like 5-day period)
    periodDays: [{ type: Date }],

    averageLength: { type: Number }, // tracked automatically
    predictedNextStart: { type: Date }, // AI/logic prediction
    ovulationDate: { type: Date },
    fertileWindow: {
        start: { type: Date },
        end: { type: Date },
    },

    //   isIrregular: { type: Boolean, default: false },
    //   irregularityReason: { type: String },   // e.g., "late period", "heavy bleeding"
});

const WomenHealthSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", unique: true },

    // Language preferences, required for multilingual module
    preferredLanguage: {
        type: String,
        enum: ["en", "hi", "pa"],
        default: "en",
    },

    // Global summary
    averageCycleLength: { type: Number }, // Calculated from cycles[]
    averagePeriodLength: { type: Number }, // Calculated from periodDays
    lastPeriodStart: { type: Date },
    lastPeriodEnd: { type: Date },
    clerkUserId: {type: String},

    // Full cycle records
    cycles: [CycleSchema],

    // Per-day logs (for calendar)
    dailyLogs: [DailyLogSchema],

    // Predictions stored for UI calendar summary
    cyclePredictions: {
        nextPeriodStart: { type: Date },
        ovulationDate: { type: Date },
        fertileWindowStart: { type: Date },
        fertileWindowEnd: { type: Date },
    },

    // Alerts and anomaly notifications
    //   anomalyAlerts: [
    //     {
    //       type: {
    //         type: String,
    //         enum: [
    //           "missed_period",
    //           "irregular_cycle",
    //           "heavy_bleeding",
    //           "long_cycle",
    //           "short_cycle",
    //           "pregnancy_suspected",
    //           "possible_pcos",
    //           "possible_thyroid"
    //         ]
    //       },
    //       message: String,
    //       date: { type: Date, default: Date.now },
    //       notifiedToDoctor: { type: Boolean, default: false }
    //     }
    //   ],

    // Doctor advice messages
    //   doctorMessages: [
    //     {
    //       doctorId: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor" },
    //       message: String,
    //       date: { type: Date, default: Date.now }
    //     }
    //   ],

    // Timestamps
    updatedAt: { type: Date, default: Date.now },
});

const WomenHealth = mongoose.model("WomenHealth", WomenHealthSchema);
module.exports = WomenHealth;
// access with womenHealth.dailyLogs
// womenHealth.cycles
// womenHealth.cyclePredictions
