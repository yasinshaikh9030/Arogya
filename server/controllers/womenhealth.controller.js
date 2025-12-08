const WomenHealth = require("../schema/womenhealth.schema.js");

// Add or update a period day for a user
exports.addOrUpdatePeriodDay = async (req, res) => {
    try {
        const { userId, date, action } = req.body; // action: 'start', 'period', 'end'
        console.log(userId);
        if (!userId || !date || !action)
            return res.status(400).json({ error: "Missing fields" });

        let womenHealth = await WomenHealth.findOne({ clerkUserId: userId });
        if (!womenHealth) {
            womenHealth = new WomenHealth({
                userId,
                cycles: [],
                dailyLogs: [],
            });
        }

        let cycle = womenHealth.cycles[womenHealth.cycles.length - 1];
        const dateObj = new Date(date);
        // Start new cycle if 'start' or no cycle exists or last cycle has end
        if (action === "start" || !cycle || cycle.cycleEnd) {
            // Calculate cycleLength and averageCycleLength
            let cycleLength = 28;
            let averageCycleLength = 28;
            let nextPeriodStart = null;
            const cycles = womenHealth.cycles;
            if (cycles.length > 0) {
                const prevCycle = cycles[cycles.length - 1];
                if (prevCycle.cycleStart) {
                    cycleLength = Math.round(
                        (dateObj - new Date(prevCycle.cycleStart)) /
                            (1000 * 60 * 60 * 24)
                    );
                }
            }
            // Calculate average from all cycles if more than 1
            if (cycles.length > 0) {
                let sum = 0;
                let count = 0;
                for (let i = 1; i < cycles.length; i++) {
                    if (cycles[i].cycleStart && cycles[i - 1].cycleStart) {
                        const len = Math.round(
                            (new Date(cycles[i].cycleStart) -
                                new Date(cycles[i - 1].cycleStart)) /
                                (1000 * 60 * 60 * 24)
                        );
                        sum += len;
                        count++;
                    }
                }
                if (count > 0) averageCycleLength = Math.round(sum / count);
            }
            nextPeriodStart = new Date(
                dateObj.getTime() + averageCycleLength * 24 * 60 * 60 * 1000
            );
            womenHealth.lastPeriodStart = dateObj;
            womenHealth.averageCycleLength = averageCycleLength;
            womenHealth.nextPeriodStart = nextPeriodStart;
            if (!womenHealth.cyclePredictions)
                womenHealth.cyclePredictions = {};
            womenHealth.cyclePredictions.nextPeriodStart = nextPeriodStart;
            cycle = {
                cycleStart: dateObj,
                periodDays: [dateObj],
                predictedNextStart: nextPeriodStart,
                averageLength: averageCycleLength,
            };
            womenHealth.cycles.push(cycle);
        } else {
            // Add to periodDays if not already present
            if (
                !cycle.periodDays.some(
                    (d) => new Date(d).toDateString() === dateObj.toDateString()
                )
            ) {
                cycle.periodDays.push(dateObj);
            }
            // Set cycleEnd if 'end'
            if (action === "end") {
                console.log("111111");
                if (!cycle.cycleStart) {
                    return res.status(400).json({
                        error: "Cannot set period end without a period start.",
                    });
                }
                if (dateObj < new Date(cycle.cycleStart)) {
                    return res.status(400).json({
                        error: "End date cannot be before start date.",
                    });
                }
                cycle.cycleEnd = dateObj;
                // Fill periodDays with all days from start to end
                const start = new Date(cycle.cycleStart);
                const end = new Date(dateObj);
                const days = [];
                for (
                    let d = new Date(start);
                    d <= end;
                    d.setDate(d.getDate() + 1)
                ) {
                    days.push(new Date(d));
                }
                cycle.periodDays = days;
                // Save periodLength in cycle
                cycle.periodLength = days.length;
                // Save lastPeriodEnd, lastPeriodLength, lastPeriodDuration
                womenHealth.lastPeriodEnd = dateObj;
                womenHealth.lastPeriodLength = cycle.periodLength;
                console.log("222222222");
                womenHealth.lastPeriodDuration = cycle.periodLength;
                // Calculate ovulation and fertile window for this cycle
                const cycleLength = womenHealth.averageCycleLength || 28;
                // Predict next period start for this cycle
                const nextPeriodStart = new Date(cycle.cycleStart);
                nextPeriodStart.setDate(
                    nextPeriodStart.getDate() + cycleLength
                );
                // Ovulation day: 14 days before next period
                const ovulationDate = new Date(nextPeriodStart);
                ovulationDate.setDate(ovulationDate.getDate() - 14);
                // Fertile window: ovulation -5 to ovulation +1
                const fertileWindowStart = new Date(ovulationDate);
                fertileWindowStart.setDate(fertileWindowStart.getDate() - 5);
                const fertileWindowEnd = new Date(ovulationDate);
                fertileWindowEnd.setDate(fertileWindowEnd.getDate() + 1);
                cycle.ovulationDate = ovulationDate;
                cycle.fertileWindow = {
                    start: fertileWindowStart,
                    end: fertileWindowEnd,
                };
                // Calculate averagePeriodLength from all cycles
                const lengths = womenHealth.cycles
                    .map(
                        (c) =>
                            c.periodLength ||
                            (c.periodDays ? c.periodDays.length : 0)
                    )
                    .filter((l) => l > 0);
                if (lengths.length > 0) {
                    womenHealth.averagePeriodLength = Math.round(
                        lengths.reduce((a, b) => a + b, 0) / lengths.length
                    );
                }
            }
        }

        await womenHealth.save();
        console.log("================");

        res.json({ success: true, womenHealth });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Add or update a daily log for a user and date
exports.addOrUpdateDailyLog = async (req, res) => {
    try {
        const { userId, date, symptoms, flowIntensity, mood, notes } = req.body;

        console.log(userId);

        if (!userId || !date)
            return res.status(400).json({ error: "Missing fields" });
        let womenHealth = await WomenHealth.findOne({ clerkUserId: userId });
        console.log(womenHealth);

        if (!womenHealth) {
            console.log("===");
            womenHealth = new WomenHealth({
                clerkUserId: userId,
                cycles: [],
                dailyLogs: [],
            });
        }
        let log = womenHealth.dailyLogs.find(
            (l) =>
                new Date(l.date).toDateString() ===
                new Date(date).toDateString()
        );
        if (log) {
            log.symptoms = symptoms || [];
            log.flowIntensity = flowIntensity || "none";
            log.mood = mood || "";
            log.notes = notes || "";
        } else {
            womenHealth.dailyLogs.push({
                date,
                symptoms,
                flowIntensity,
                mood,
                notes,
            });
        }
        await womenHealth.save();
        res.json({ success: true, womenHealth });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Fetch women's health data by userId
exports.getWomenHealthByUserId = async (req, res) => {
    try {
        const { userId } = req.params;
        if (!userId) return res.status(400).json({ error: "Missing userId" });
        console.log("======", userId);
        const womenHealth = await WomenHealth.findOne({ clerkUserId: userId });
        console.log("======", womenHealth);

        if (!womenHealth)
            return res
                .status(404)
                .json({ error: "No women health data found" });
        res.json(womenHealth);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
