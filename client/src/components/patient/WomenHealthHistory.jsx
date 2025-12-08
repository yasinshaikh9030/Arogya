import React, { useState, useRef } from "react";
import axios from "axios";
import AiHealthInsight from "./AiHealthInsight";
import { CircleAlert, Download, History, Sparkles, X } from "lucide-react";

const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
];
const currentYear = new Date().getFullYear();
const years = Array.from({ length: 10 }, (_, i) => currentYear - i);

const PRE_PERIOD_NOTIFY_DAYS = 3;
const DELAY_BUFFER_DAYS = 5;

const WomenHealthHistory = ({ patientId }) => {
    const [showCycleModal, setShowCycleModal] = useState(false);
    // Alert state
    const [showAlertModal, setShowAlertModal] = useState(false);
    const [alertCount, setAlertCount] = useState(0);
    const [alerts, setAlerts] = useState([]);

    // AI Review state
    const [showAiModal, setShowAiModal] = useState(false);
    const [aiStartMonth, setAiStartMonth] = useState(0);
    const [aiStartYear, setAiStartYear] = useState(currentYear);
    const [aiEndMonth, setAiEndMonth] = useState(11);
    const [aiEndYear, setAiEndYear] = useState(currentYear);
    const [aiLoading, setAiLoading] = useState(false);
    const [aiError, setAiError] = useState("");
    const [aiInsight, setAiInsight] = useState(null);

    // AI Review logic
    const handleAiReview = async () => {
        setAiLoading(true);
        setAiError("");
        setAiInsight(null);
        try {
            const res = await axios.get(
                `${
                    import.meta.env.VITE_SERVER_URL
                }/api/womenhealth/${patientId}`
            );
            if (res.data) {
                // Filter cycles/logs for selected range
                const startDate = new Date(aiStartYear, aiStartMonth, 1);
                const endDate = new Date(
                    aiEndYear,
                    aiEndMonth + 1,
                    0,
                    23,
                    59,
                    59,
                    999
                );
                const filteredCycles = (res.data.cycles || []).filter(
                    (cycle) => {
                        const s = new Date(cycle.cycleStart);
                        const e = cycle.cycleEnd
                            ? new Date(cycle.cycleEnd)
                            : null;
                        return s <= endDate && (!e || e >= startDate);
                    }
                );
                const filteredLogs = (res.data.dailyLogs || []).filter(
                    (log) => {
                        const d = new Date(log.date);
                        return d >= startDate && d <= endDate;
                    }
                );
                const userJson = JSON.stringify({
                    ...res.data,
                    cycles: filteredCycles,
                    dailyLogs: filteredLogs,
                });
                const aiPrompt = `You are an AI-based women’s health assistant (not a doctor). \nYour job is to analyze menstrual cycle data and daily health logs and provide simple, supportive, and easy-to-understand insights.\nAlways use non-technical, friendly language.\nYou will receive data in JSON format that contains:\n- Menstrual cycle history\n- Period lengths\n- Predicted next cycle\n- Fertile window and ovulation dates\n- Daily logs of symptoms and flow intensity\nYou must NOT give medical diagnoses. You may give wellbeing insights only.\n\n### User Cycle Data:\n${userJson}\n\n### Your Tasks:\n\n1. Cycle Regularity Analysis:\n   - Determine if the cycles look Regular / Slightly Irregular / Irregular.\n   - Explain in simple words.\n2. Period Health Summary:\n   - Comment on period length, flow pattern, and any unusual symptoms like heavy bleeding, clotting, spotting, or pain.\n3. Fertility Window Summary:\n   - Explain upcoming fertile window and ovulation in simple language.\n   - Mention predicted next period date.\n4. Risk Awareness (Not Diagnosis):\n   - If patterns suggest issues like PCOS, hormonal imbalance, or thyroid issues, gently mention:\n     "Some patterns may be worth discussing with a doctor."\n5. Self-care Tips:\n   - Provide 4–6 simple health and hygiene tips.\n6. When to See a Doctor:\n   - Highlight red flags such as:\n     - Very heavy bleeding\n     - Irregular cycles\n     - Severe pain\n     - Long delays\n7. Friendly Tone:\n   - Be reassuring and supportive.\n8. Language Rule:\n   - Use very simple English.\n9. Medical Safety Rule (Mandatory):\n   - End with:\n     "This is not a medical diagnosis. Please consult a licensed doctor for professional advice."\n\n### Output Format (JSON ONLY):\n\n{\n  "cycleRegularity": "Regular | Slightly Irregular | Irregular",\n  "periodHealthSummary": "Simple explanation",\n  "fertilitySummary": {\n    "nextPeriodDate": "YYYY-MM-DD",\n    "ovulationDate": "YYYY-MM-DD",\n    "fertileWindow": "YYYY-MM-DD to YYYY-MM-DD"\n  },\n  "riskInsights": [\n    "Insight 1",\n    "Insight 2"\n  ],\n  "selfCareTips": [\n    "Tip 1",\n    "Tip 2",\n    "Tip 3"\n  ],\n  "seeDoctorIf": [\n    "Condition 1",\n    "Condition 2"\n  ],\n  "disclaimer": "This is not a medical diagnosis. Please consult a licensed doctor for professional advice."\n}`;
                const aiRes = await axios.post(
                    `${
                        import.meta.env.VITE_SERVER_URL
                    }/api/womenhealthai/review`,
                    { prompt: aiPrompt }
                );
                console.log("AI Review JSON:", aiRes.data);
                setAiInsight(aiRes.data);
            }
        } catch (err) {
            setAiError("AI review failed");
        } finally {
            setAiLoading(false);
        }
    };

    const [startMonth, setStartMonth] = useState(0);
    const [startYear, setStartYear] = useState(currentYear);
    const [endMonth, setEndMonth] = useState(11);
    const [endYear, setEndYear] = useState(currentYear);
    const [cycles, setCycles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleFetchCycles = async () => {
        setLoading(true);
        setError("");
        try {
            const res = await axios.get(
                `${
                    import.meta.env.VITE_SERVER_URL
                }/api/womenhealth/${patientId}`
            );
            if (res.data && Array.isArray(res.data.cycles)) {
                const startDate = new Date(startYear, startMonth, 1);
                const endDate = new Date(
                    endYear,
                    endMonth + 1,
                    0,
                    23,
                    59,
                    59,
                    999
                );
                const filtered = res.data.cycles.filter((cycle) => {
                    const s = new Date(cycle.cycleStart);
                    const e = cycle.cycleEnd ? new Date(cycle.cycleEnd) : null;
                    // Overlaps if: (start <= endDate && (no end or end >= startDate))
                    return s <= endDate && (!e || e >= startDate);
                });
                setCycles(filtered);
            }
        } catch (err) {
            setError("Failed to fetch cycles");
        } finally {
            setLoading(false);
        }
    };

    // Alert logic
    const handleAlertClick = async () => {
        setShowAlertModal(true);
        try {
            const res = await axios.get(
                `${
                    import.meta.env.VITE_SERVER_URL
                }/api/womenhealth/${patientId}`
            );
            const data = res.data;
            const alertsList = [];
            if (
                data &&
                data.cyclePredictions &&
                data.cyclePredictions.nextPeriodStart
            ) {
                const predictedDate = new Date(
                    data.cyclePredictions.nextPeriodStart
                );
                const today = new Date();
                // Find if user has marked period start after predicted date
                let hasMarkedStart = false;
                if (Array.isArray(data.cycles)) {
                    for (const cycle of data.cycles) {
                        if (
                            cycle.cycleStart &&
                            new Date(cycle.cycleStart) > predictedDate
                        ) {
                            hasMarkedStart = true;
                            break;
                        }
                    }
                }
                // Delayed period alert
                const delayDate = new Date(predictedDate);
                delayDate.setDate(delayDate.getDate() + DELAY_BUFFER_DAYS);
                if (today > delayDate && !hasMarkedStart) {
                    alertsList.push({
                        type: "delayed",
                        message: `Your period seems delayed. This can happen due to stress, travel or health changes. If delay continues, consider consulting a doctor. (Buffer: ${DELAY_BUFFER_DAYS} days)`,
                    });
                }
                // Pre-period alert (2-3 days before predicted)
                const diffDays = Math.floor(
                    (predictedDate - today) / (1000 * 60 * 60 * 24)
                );
                if (diffDays === 2 || diffDays === 3) {
                    alertsList.push({
                        type: "pre",
                        message: `Your period may start soon. Stay hydrated, avoid junk food, and get good sleep. Tip: Keep sanitary products ready and avoid heavy workouts.`,
                    });
                }
            }
            setAlerts(alertsList);
        } catch (err) {
            setAlerts([]);
        }
    };

    // Update alert count on mount and when patientId changes
    React.useEffect(() => {
        (async () => {
            try {
                console.log("=====");
                const res = await axios.get(
                    `${
                        import.meta.env.VITE_SERVER_URL
                    }/api/womenhealth/${patientId}`
                );
                const data = res.data;
                console.log("=====", res);
                let count = 0;
                if (
                    data &&
                    data.cyclePredictions &&
                    data.cyclePredictions.nextPeriodStart
                ) {
                    const predictedDate = new Date(
                        data.cyclePredictions.nextPeriodStart
                    );
                    const today = new Date();
                    let hasMarkedStart = false;
                    if (Array.isArray(data.cycles)) {
                        for (const cycle of data.cycles) {
                            if (
                                cycle.cycleStart &&
                                new Date(cycle.cycleStart) > predictedDate
                            ) {
                                hasMarkedStart = true;
                                break;
                            }
                        }
                    }
                    const delayDate = new Date(predictedDate);
                    delayDate.setDate(delayDate.getDate() + DELAY_BUFFER_DAYS);
                    if (today > delayDate && !hasMarkedStart) count++;
                    const diffDays = Math.floor(
                        (predictedDate - today) / (1000 * 60 * 60 * 24)
                    );
                    if (diffDays === 2 || diffDays === 3) count++;
                }
                setAlertCount(count);
            } catch {
                setAlertCount(0);
            }
        })();
    }, [patientId]);

    return (
        <>
            <div className="w-full flex justify-center mt-2 mb-2">
                <div className="flex gap-4 dark:bg-dark-bg bg-light-surface rounded-xl px-8 py-5 shadow">
                    <button
                        className="px-4 py-2 flex items-center gap-1 rounded-lg bg-green-600 hover:bg-green-700 text-sm text-white font-semibold transition"
                        onClick={() => setShowCycleModal(true)}>
                        <History size={20} />
                        <p> Cycle History</p>
                    </button>
                    <button
                        className="px-4 py-2 flex items-center gap-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-sm text-white font-semibold transition"
                        onClick={() => setShowAiModal(true)}>
                        <Sparkles size={20} />
                        <p>AI Review</p>
                    </button>
                    <button
                        className="relative px-4 py-2 flex items-center gap-1 rounded-lg bg-red-600 hover:bg-red-700 text-sm text-white font-semibold transition"
                        onClick={handleAlertClick}>
                        <CircleAlert size={20} />
                        <p>Alerts</p>
                        {alertCount > 0 && (
                            <span className="absolute -top-2 -right-2 bg-yellow-400 text-black rounded-full px-2 text-xs font-bold">
                                {alertCount}
                            </span>
                        )}
                    </button>
                </div>
            </div>

            {/* Alerts Modal */}
            {showAlertModal && (
                <div className="fixed inset-0 z-50 flex flex-col items-center justify-start bg-black/70 overflow-y-auto min-h-screen w-full">
                    <div className="w-full max-w-md bg-white dark:bg-dark-bg rounded-2xl shadow-xl p-6 mt-12 mb-8 relative flex flex-col">
                        <button
                            className="absolute top-3 right-3 text-gray-400 hover:text-gray-700"
                            onClick={() => setShowAlertModal(false)}>
                            ✕
                        </button>
                        <h3 className="text-xl font-bold mb-4 text-center text-light-primary-text dark:text-dark-primary-text">
                            Health Alerts
                        </h3>
                        {alerts.length === 0 && (
                            <div className="text-gray-500 text-center">
                                No alerts at this time.
                            </div>
                        )}
                        <ul className="space-y-4">
                            {alerts.map((alert, i) => (
                                <li
                                    key={i}
                                    className={`rounded-xl p-4 shadow border-l-4 ${
                                        alert.type === "delayed"
                                            ? "border-red-500 bg-red-50 dark:bg-red-900/20"
                                            : "border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20"
                                    }`}>
                                    <div className="font-semibold mb-1">
                                        {alert.type === "delayed"
                                            ? "⚠️ Delayed Period"
                                            : "🌸 Upcoming Period"}
                                    </div>
                                    <div className="text-sm">
                                        {alert.message}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}

            {/* AI Review Modal */}
            {showAiModal && (
                <div className="fixed inset-0 z-50 flex flex-col items-center justify-start bg-black/70 overflow-y-auto min-h-screen w-full">
                    <div className="w-full max-w-2xl bg-white dark:bg-gray-900 rounded-none md:rounded-2xl shadow-2xl p-6 mt-8 mb-8 relative flex flex-col border border-gray-200 dark:border-gray-700">
                        {/* Close Button */}
                        <button
                            className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                            onClick={() => setShowAiModal(false)}>
                            ✕
                        </button>

                        {/* Title */}
                        <h3 className="text-2xl font-bold mb-6 text-center text-gray-900 dark:text-white">
                            AI Cycle Review
                        </h3>

                        {/* Filters */}
                        <div className="flex flex-wrap gap-4 mb-6 justify-center">
                            <div>
                                <div className="text-sm font-semibold mb-1 text-gray-700 dark:text-gray-300">
                                    Start Month/Year
                                </div>
                                <select
                                    value={aiStartMonth}
                                    onChange={(e) =>
                                        setAiStartMonth(Number(e.target.value))
                                    }
                                    className="rounded px-2 py-1 mr-2 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600">
                                    {months.map((m, i) => (
                                        <option value={i} key={m}>
                                            {m}
                                        </option>
                                    ))}
                                </select>

                                <select
                                    value={aiStartYear}
                                    onChange={(e) =>
                                        setAiStartYear(Number(e.target.value))
                                    }
                                    className="rounded px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600">
                                    {years.map((y) => (
                                        <option value={y} key={y}>
                                            {y}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <div className="text-sm font-semibold mb-1 text-gray-700 dark:text-gray-300">
                                    End Month/Year
                                </div>
                                <select
                                    value={aiEndMonth}
                                    onChange={(e) =>
                                        setAiEndMonth(Number(e.target.value))
                                    }
                                    className="rounded px-2 py-1 mr-2 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600">
                                    {months.map((m, i) => (
                                        <option value={i} key={m}>
                                            {m}
                                        </option>
                                    ))}
                                </select>

                                <select
                                    value={aiEndYear}
                                    onChange={(e) =>
                                        setAiEndYear(Number(e.target.value))
                                    }
                                    className="rounded px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600">
                                    {years.map((y) => (
                                        <option value={y} key={y}>
                                            {y}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <button
                                onClick={handleAiReview}
                                className="px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold ml-2 transition">
                                Get AI Review
                            </button>
                        </div>

                        {/* Status */}
                        {aiLoading && (
                            <div className="text-blue-600 dark:text-blue-400 text-center">
                                Analyzing with AI...
                            </div>
                        )}

                        {aiError && (
                            <div className="text-red-500 dark:text-red-400 mb-2 text-center">
                                {aiError}
                            </div>
                        )}

                        {/* Results */}
                        <div className="overflow-x-auto w-full">
                            {aiInsight && (
                                <div className="space-y-6 mt-4">
                                    {/* Cycle Regularity */}
                                    <div className="bg-blue-50 dark:bg-blue-900/30 rounded-2xl p-5 shadow border border-blue-100 dark:border-blue-800">
                                        <div className="text-lg font-bold mb-2 text-blue-800 dark:text-blue-200">
                                            Cycle Regularity
                                        </div>
                                        <div className="text-base font-semibold text-gray-900 dark:text-gray-100">
                                            {aiInsight.cycleRegularity}
                                        </div>
                                    </div>

                                    {/* Period Health */}
                                    <div className="bg-green-50 dark:bg-green-900/30 rounded-2xl p-5 shadow border border-green-100 dark:border-green-800">
                                        <div className="text-lg font-bold mb-2 text-green-800 dark:text-green-200">
                                            Period Health Summary
                                        </div>
                                        <div className="text-base text-gray-900 dark:text-gray-100">
                                            {aiInsight.periodHealthSummary}
                                        </div>
                                    </div>

                                    {/* Fertility Summary */}
                                    <div className="bg-purple-50 dark:bg-purple-900/30 rounded-2xl p-5 shadow border border-purple-100 dark:border-purple-800">
                                        <div className="text-lg font-bold mb-2 text-purple-800 dark:text-purple-200">
                                            Fertility Summary
                                        </div>
                                        <div className="mb-1 text-gray-900 dark:text-gray-100">
                                            <span className="font-semibold">
                                                Next Period Date:
                                            </span>{" "}
                                            {aiInsight.fertilitySummary
                                                ?.nextPeriodDate || "--"}
                                        </div>
                                        <div className="mb-1 text-gray-900 dark:text-gray-100">
                                            <span className="font-semibold">
                                                Ovulation Date:
                                            </span>{" "}
                                            {aiInsight.fertilitySummary
                                                ?.ovulationDate || "--"}
                                        </div>
                                        <div className="mb-1 text-gray-900 dark:text-gray-100">
                                            <span className="font-semibold">
                                                Fertile Window:
                                            </span>{" "}
                                            {aiInsight.fertilitySummary
                                                ?.fertileWindow || "--"}
                                        </div>
                                    </div>

                                    {/* Risk Insights */}
                                    {aiInsight.riskInsights?.length > 0 && (
                                        <div className="bg-amber-50 dark:bg-amber-900/30 rounded-2xl p-5 shadow border border-amber-100 dark:border-amber-800">
                                            <div className="text-lg font-bold mb-2 text-amber-800 dark:text-amber-200">
                                                Risk Insights
                                            </div>
                                            <ul className="list-disc pl-6 text-gray-900 dark:text-gray-100">
                                                {aiInsight.riskInsights.map(
                                                    (r, i) => (
                                                        <li key={i}>{r}</li>
                                                    )
                                                )}
                                            </ul>
                                        </div>
                                    )}

                                    {/* Self Care Tips */}
                                    <div className="bg-emerald-50 dark:bg-emerald-900/30 rounded-2xl p-5 shadow border border-emerald-100 dark:border-emerald-800">
                                        <div className="text-lg font-bold mb-2 text-emerald-800 dark:text-emerald-200">
                                            Self-care Tips
                                        </div>
                                        <ul className="list-disc pl-6 text-gray-900 dark:text-gray-100">
                                            {aiInsight.selfCareTips?.map(
                                                (tip, i) => (
                                                    <li key={i}>{tip}</li>
                                                )
                                            )}
                                        </ul>
                                    </div>

                                    {/* See Doctor If */}
                                    <div className="bg-red-50 dark:bg-red-900/30 rounded-2xl p-5 shadow border border-red-100 dark:border-red-800">
                                        <div className="text-lg font-bold mb-2 text-red-800 dark:text-red-200">
                                            See a Doctor If
                                        </div>
                                        <ul className="list-disc pl-6 text-gray-900 dark:text-gray-100">
                                            {aiInsight.seeDoctorIf?.map(
                                                (cond, i) => (
                                                    <li key={i}>{cond}</li>
                                                )
                                            )}
                                        </ul>
                                    </div>

                                    {/* Disclaimer */}
                                    <div className="bg-yellow-50 dark:bg-yellow-900/30 rounded-2xl p-5 shadow border border-yellow-100 dark:border-yellow-800">
                                        <div className="text-base font-semibold text-yellow-800 dark:text-yellow-200">
                                            {aiInsight.disclaimer}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Cycle History Modal */}
            {showCycleModal && (
                <div className="fixed inset-0 z-50 flex flex-col items-center justify-start bg-black/70 overflow-y-auto min-h-screen w-full">
                    <div className="w-full max-w-5xl bg-light-bg dark:bg-dark-bg rounded-none md:rounded-2xl shadow-xl p-6 mt-8 mb-8 relative flex flex-col text-light-text dark:text-dark-text">
                        {/* Close button */}
                        <button
                            className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition"
                            onClick={() => setShowCycleModal(false)}>
                            <X />
                        </button>

                        <h3 className="text-2xl font-bold mb-6 text-center text-light-primary-text dark:text-dark-primary-text">
                            Cycle History
                        </h3>

                        {/* Filters + Buttons */}
                        <div className="flex flex-wrap gap-4 mb-6 justify-center items-end">
                            {/* Start Date */}
                            <div>
                                <p className="text-sm font-semibold mb-1 text-light-primary-text dark:text-dark-primary-text">
                                    Start Month/Year
                                </p>
                                <select
                                    value={startMonth}
                                    onChange={(e) =>
                                        setStartMonth(Number(e.target.value))
                                    }
                                    className="rounded-lg px-3 py-2 mr-2 bg-light-surface dark:bg-dark-surface text-light-primary-text dark:text-dark-primary-text">
                                    {months.map((m, i) => (
                                        <option value={i} key={m}>
                                            {m}
                                        </option>
                                    ))}
                                </select>
                                <select
                                    value={startYear}
                                    onChange={(e) =>
                                        setStartYear(Number(e.target.value))
                                    }
                                    className="rounded-lg px-3 py-2 mr-2 bg-light-surface dark:bg-dark-surface text-light-primary-text dark:text-dark-primary-text">
                                    {years.map((y) => (
                                        <option value={y} key={y}>
                                            {y}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* End Date */}
                            <div>
                                <p className="text-sm font-semibold mb-1 text-light-primary-text dark:text-dark-primary-text">
                                    End Month/Year
                                </p>
                                <select
                                    value={endMonth}
                                    onChange={(e) =>
                                        setEndMonth(Number(e.target.value))
                                    }
                                    className="rounded-lg px-3 py-2 mr-2 bg-light-surface dark:bg-dark-surface text-light-primary-text dark:text-dark-primary-text">
                                    {months.map((m, i) => (
                                        <option value={i} key={m}>
                                            {m}
                                        </option>
                                    ))}
                                </select>
                                <select
                                    value={endYear}
                                    onChange={(e) =>
                                        setEndYear(Number(e.target.value))
                                    }
                                    className="rounded-lg px-3 py-2 mr-2 bg-light-surface dark:bg-dark-surface text-light-primary-text dark:text-dark-primary-text">
                                    {years.map((y) => (
                                        <option value={y} key={y}>
                                            {y}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Buttons - Uniform */}
                            <button
                                onClick={handleFetchCycles}
                                className="px-5 flex items-center gap-1 py-2  rounded-lg font-semibold bg-light-primary hover:bg-light-primary-hover dark:bg-dark-primary text-dark-primary-text transition">
                                <History size={20} />
                                <p> History</p>
                            </button>

                            <button
                                onClick={() => window.print()}
                                className="px-5 flex items-center gap-1 py-2 rounded-lg font-semibold bg-light-secondary hover:bg-light-secondary-hover dark:bg-dark-secondary text-dark-primary-text  transition print:hidden">
                                <Download size={20} />
                                <p>Download</p>
                            </button>
                        </div>

                        {loading && (
                            <div className="text-center text-gray-600 dark:text-gray-400">
                                Loading...
                            </div>
                        )}

                        {error && (
                            <div className="text-red-500 dark:text-red-400 mb-2 text-center">
                                {error}
                            </div>
                        )}

                        {/* Table */}
                        <div className="overflow-x-auto w-full">
                            <table className="w-full text-left border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                                {/* Table Head */}
                                <thead className="bg-light-surface dark:bg-dark-surface text-light-primary-text dark:text-dark-primary-text">
                                    <tr>
                                        <th className="p-3">No.</th>
                                        <th className="p-3">Start</th>
                                        <th className="p-3">End</th>
                                        <th className="p-3">Length</th>
                                        <th className="p-3">Ovulation</th>
                                        <th className="p-3">Fertile Window</th>
                                    </tr>
                                </thead>

                                {/* Table Body */}
                                <tbody className="bg-light-surface dark:bg-dark-surface text-light-primary-text dark:text-dark-primary-text">
                                    {cycles.length === 0 && !loading ? (
                                        <tr>
                                            <td
                                                colSpan={6}
                                                className="text-center py-6 text-gray-500 dark:text-gray-500">
                                                No cycles found for this period.
                                            </td>
                                        </tr>
                                    ) : (
                                        cycles.map((cycle, idx) => (
                                            <tr
                                                key={cycle._id || idx}
                                                className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                                                <td className="p-3">
                                                    {idx + 1}
                                                </td>
                                                <td className="p-3">
                                                    {new Date(
                                                        cycle.cycleStart
                                                    ).toLocaleDateString()}
                                                </td>
                                                <td className="p-3">
                                                    {cycle.cycleEnd ? (
                                                        new Date(
                                                            cycle.cycleEnd
                                                        ).toLocaleDateString()
                                                    ) : (
                                                        <span className="italic text-gray-400 dark:text-gray-500">
                                                            Ongoing
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="p-3">
                                                    {cycle.periodLength
                                                        ? `${cycle.periodLength} days`
                                                        : "--"}
                                                </td>
                                                <td className="p-3">
                                                    {cycle.ovulationDate
                                                        ? new Date(
                                                              cycle.ovulationDate
                                                          ).toLocaleDateString()
                                                        : "--"}
                                                </td>
                                                <td className="p-3">
                                                    {cycle.fertileWindow?.start
                                                        ? `${new Date(
                                                              cycle.fertileWindow.start
                                                          ).toLocaleDateString()} to ${new Date(
                                                              cycle.fertileWindow.end
                                                          ).toLocaleDateString()}`
                                                        : "--"}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default WomenHealthHistory;
