import axios from "axios";
import {
    Calendar as CalendarIcon,
    ChevronLeft,
    ChevronRight,
    Clock,
    Edit,
    Plus,
    Trash2,
    X,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";

const DAILY_LOG_SYMPTOMS = [
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
];
const FLOW_OPTIONS = ["none", "light", "medium", "heavy"];

const WomenHealthCalendar = ({ patientId }) => {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [periodDays, setPeriodDays] = useState([]);
    const [cycleStart, setCycleStart] = useState(null);
    const [cycleEnd, setCycleEnd] = useState(null);
    const [showPeriodModal, setShowPeriodModal] = useState(false);
    const [periodAction, setPeriodAction] = useState(null);

    // Log modal state
    const [showLogModal, setShowLogModal] = useState(false);
    const [logSymptoms, setLogSymptoms] = useState([]);
    const [logFlow, setLogFlow] = useState("none");
    const [logMood, setLogMood] = useState("");
    const [logNotes, setLogNotes] = useState("");
    const [logLoading, setLogLoading] = useState(false);

    const handleToggleSymptom = (symptom) => {
        setLogSymptoms((prev) =>
            prev.includes(symptom)
                ? prev.filter((s) => s !== symptom)
                : [...prev, symptom]
        );
    };
    const handleSaveLog = async () => {
        setLogLoading(true);
        try {
            await axios.post(
                `${import.meta.env.VITE_SERVER_URL}/api/womenhealth/daily-log`,
                {
                    userId: patientId,
                    date: selectedDate,
                    symptoms: logSymptoms,
                    flowIntensity: logFlow,
                    mood: logMood,
                    notes: logNotes,
                }
            );
            toast.success("Log saved!");
            setShowLogModal(false);
            setLogSymptoms([]);
            setLogFlow("none");
            setLogMood("");
            setLogNotes("");
            fetchPeriodData();
        } catch (err) {
            toast.error("Failed to save log");
        } finally {
            setLogLoading(false);
        }
    };

    useEffect(() => {
        fetchPeriodData();
    }, [patientId]);

    const [summary, setSummary] = useState({});
    const [dailyLogs, setDailyLogs] = useState([]);
    const [showViewLogModal, setShowViewLogModal] = useState(false);
    const [viewLog, setViewLog] = useState(null);

    const fetchPeriodData = async () => {
        try {
            const response = await axios.get(
                `${
                    import.meta.env.VITE_SERVER_URL
                }/api/womenhealth/${patientId}`
            );
            console.log(response);
            if (response.data && response.data.dailyLogs) {
                setDailyLogs(response.data.dailyLogs);
            } else {
                setDailyLogs([]);
            }
            if (
                response.data &&
                response.data.cycles &&
                response.data.cycles.length
            ) {
                // Gather all periodDays, cycleStarts, and cycleEnds from all cycles
                const allPeriodDays = [];
                const allCycleStarts = [];
                const allCycleEnds = [];
                response.data.cycles.forEach((cycle) => {
                    if (cycle.periodDays)
                        allPeriodDays.push(
                            ...cycle.periodDays.map((d) => new Date(d))
                        );
                    if (cycle.cycleStart)
                        allCycleStarts.push(new Date(cycle.cycleStart));
                    if (cycle.cycleEnd)
                        allCycleEnds.push(new Date(cycle.cycleEnd));
                });
                setPeriodDays(allPeriodDays);
                setCycleStart(allCycleStarts);
                setCycleEnd(allCycleEnds);
            } else {
                setPeriodDays([]);
                setCycleStart([]);
                setCycleEnd([]);
            }
            // Set summary
            // Gather all ovulation days and fertile windows from all cycles
            let ovulationDays = [],
                fertileWindows = [];
            if (response.data.cycles && response.data.cycles.length) {
                response.data.cycles.forEach((cycle) => {
                    if (cycle.ovulationDate)
                        ovulationDays.push(new Date(cycle.ovulationDate));
                    if (
                        cycle.fertileWindow &&
                        cycle.fertileWindow.start &&
                        cycle.fertileWindow.end
                    ) {
                        fertileWindows.push({
                            start: new Date(cycle.fertileWindow.start),
                            end: new Date(cycle.fertileWindow.end),
                        });
                    }
                });
            }
            setSummary({
                nextPeriodStart:
                    response.data.nextPeriodStart ||
                    (response.data.cyclePredictions &&
                        response.data.cyclePredictions.nextPeriodStart),
                averageCycleLength: response.data.averageCycleLength,
                averagePeriodLength: response.data.averagePeriodLength,
                lastPeriodStart: response.data.lastPeriodStart,
                lastPeriodEnd: response.data.lastPeriodEnd,
                lastPeriodDuration: response.data.lastPeriodDuration,
                lastPeriodLength: response.data.lastPeriodLength,
                ovulationDays,
                fertileWindows,
            });
        } catch (err) {
            setPeriodDays([]);
            setCycleStart([]);
            setCycleEnd([]);
            setSummary({});
        }
    };

    // Calendar helper functions
    const getDaysInMonth = (date) => {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (date) => {
        return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    };

    const generateCalendarDays = () => {
        const daysInMonth = getDaysInMonth(currentMonth);
        const firstDay = getFirstDayOfMonth(currentMonth);
        const days = [];

        // Add empty cells for days before the first day of the month
        for (let i = 0; i < firstDay; i++) {
            days.push(null);
        }

        // Add days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            days.push(day);
        }

        return days;
    };

    const navigateMonth = (direction) => {
        const newMonth = new Date(currentMonth);
        if (direction === "prev") {
            newMonth.setMonth(currentMonth.getMonth() - 1);
        } else {
            newMonth.setMonth(currentMonth.getMonth() + 1);
        }
        setCurrentMonth(newMonth);
    };

    const isToday = (day) => {
        const today = new Date();
        return (
            day === today.getDate() &&
            currentMonth.getMonth() === today.getMonth() &&
            currentMonth.getFullYear() === today.getFullYear()
        );
    };

    const isSelected = (day) => {
        if (!day) return false;
        return (
            day === selectedDate.getDate() &&
            currentMonth.getMonth() === selectedDate.getMonth() &&
            currentMonth.getFullYear() === selectedDate.getFullYear()
        );
    };

    const isPeriodDay = (day) => {
        if (!day) return false;
        const dateObj = new Date(
            currentMonth.getFullYear(),
            currentMonth.getMonth(),
            day
        );
        return periodDays.some(
            (d) => d.toDateString() === dateObj.toDateString()
        );
    };
    const isPeriodStart = (day) => {
        if (!cycleStart || cycleStart.length === 0) return false;
        const dateObj = new Date(
            currentMonth.getFullYear(),
            currentMonth.getMonth(),
            day
        );
        return cycleStart.some(
            (start) => start.toDateString() === dateObj.toDateString()
        );
    };
    const isPeriodEnd = (day) => {
        if (!cycleEnd || cycleEnd.length === 0) return false;
        const dateObj = new Date(
            currentMonth.getFullYear(),
            currentMonth.getMonth(),
            day
        );
        return cycleEnd.some(
            (end) => end.toDateString() === dateObj.toDateString()
        );
    };

    const handleDayClick = (day) => {
        if (!day) return;
        const newDate = new Date(
            currentMonth.getFullYear(),
            currentMonth.getMonth(),
            day
        );
        setSelectedDate(newDate);
    };

    // handlePeriodAction now takes action and date
    const handlePeriodAction = async (action, dateObj) => {
        const dateToUse = dateObj || selectedDate;
        if (!dateToUse) return;
        try {
            const res = await axios.post(
                `${import.meta.env.VITE_SERVER_URL}/api/womenhealth/period-day`,
                {
                    userId: patientId,
                    date: dateToUse,
                    action,
                }
            );
            console.log(res);
            toast.success("Saved!");
            setPeriodAction(null);
            fetchPeriodData();
        } catch (err) {
            toast.error("Failed to save");
        }
    };

    return (
        <div>
            <div className="dark:bg-dark-bg bg-light-surface rounded-2xl p-6 shadow-md hover:shadow-xl transition-all duration-300">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-2xl font-bold text-light-primary-text dark:text-dark-primary-text flex items-center">
                        <CalendarIcon className="w-6 h-6 mr-3 text-light-primary dark:text-dark-primary" />
                        My Calendar
                    </h3>
                    <div className="flex gap-2">
                        {/* Button state logic */}
                        {(() => {
                            // Determine if period is started and not ended for selectedDate's cycle
                            let periodStarted = false,
                                periodEnded = false;
                            if (cycleStart && Array.isArray(cycleStart)) {
                                periodStarted = cycleStart.some(
                                    (start) =>
                                        start.toDateString() ===
                                        selectedDate?.toDateString()
                                );
                            }
                            if (cycleEnd && Array.isArray(cycleEnd)) {
                                periodEnded = cycleEnd.some(
                                    (end) =>
                                        end.toDateString() ===
                                        selectedDate?.toDateString()
                                );
                            }
                            // Find if current date is in an active period (started but not ended)
                            let inActivePeriod = false;
                            if (
                                cycleStart &&
                                Array.isArray(cycleStart) &&
                                cycleEnd &&
                                Array.isArray(cycleEnd)
                            ) {
                                for (let i = 0; i < cycleStart.length; i++) {
                                    const start = cycleStart[i];
                                    const end = cycleEnd[i] || null;
                                    if (
                                        selectedDate &&
                                        start <= selectedDate &&
                                        (!end || selectedDate <= end)
                                    ) {
                                        inActivePeriod = true;
                                        break;
                                    }
                                }
                            }
                            // Period Start button: enabled if no active period on selectedDate and not between cycles
                            let betweenCycles = false;
                            if (
                                cycleStart &&
                                Array.isArray(cycleStart) &&
                                cycleEnd &&
                                Array.isArray(cycleEnd) &&
                                selectedDate
                            ) {
                                // Sort cycles by start date
                                const cycles = cycleStart.map((start, i) => ({
                                    start,
                                    end: cycleEnd[i] || null,
                                }));
                                cycles.sort((a, b) => a.start - b.start);
                                for (let i = 0; i < cycles.length - 1; i++) {
                                    const end = cycles[i].end;
                                    const nextStart = cycles[i + 1].start;
                                    if (
                                        end &&
                                        selectedDate > end &&
                                        selectedDate < nextStart
                                    ) {
                                        betweenCycles = true;
                                        break;
                                    }
                                }
                                // Also disable if inside any cycle (but not at start)
                                for (let i = 0; i < cycles.length; i++) {
                                    const start = cycles[i].start;
                                    const end = cycles[i].end;
                                    if (
                                        start < selectedDate &&
                                        end &&
                                        selectedDate <= end
                                    ) {
                                        betweenCycles = true;
                                        break;
                                    }
                                }
                            }
                            // Period Day/End: enabled if in active period
                            // Green = enabled, Red = disabled
                            return (
                                <>
                                    <button
                                        className={`px-4 py-2 rounded-lg font-semibold ${
                                            selectedDate && !betweenCycles
                                                ? "bg-green-600 hover:bg-green-700"
                                                : "bg-red-500 opacity-70"
                                        } text-white transition`}
                                        onClick={() => {
                                            if (!selectedDate) return;
                                            if (inActivePeriod) {
                                                handlePeriodAction(
                                                    "end",
                                                    selectedDate
                                                );
                                            } else {
                                                handlePeriodAction(
                                                    "start",
                                                    selectedDate
                                                );
                                            }
                                        }}
                                        disabled={
                                            !selectedDate || betweenCycles
                                        }>
                                        {inActivePeriod
                                            ? "End Period"
                                            : "Start Period"}
                                    </button>
                                    <button
                                        className={`px-4 py-2 rounded-lg font-semibold ${
                                            selectedDate
                                                ? dailyLogs.find(
                                                      (l) =>
                                                          new Date(
                                                              l.date
                                                          ).toDateString() ===
                                                          selectedDate.toDateString()
                                                  )
                                                    ? "bg-green-600 hover:bg-green-700"
                                                    : "bg-blue-600 hover:bg-blue-700"
                                                : "bg-red-500 opacity-70"
                                        } text-white transition`}
                                        onClick={() => {
                                            const log = dailyLogs.find(
                                                (l) =>
                                                    new Date(
                                                        l.date
                                                    ).toDateString() ===
                                                    selectedDate.toDateString()
                                            );
                                            if (log) {
                                                setViewLog(log);
                                                setShowViewLogModal(true);
                                            } else {
                                                setShowLogModal(true);
                                            }
                                        }}
                                        disabled={!selectedDate}>
                                        {dailyLogs.find(
                                            (l) =>
                                                new Date(
                                                    l.date
                                                ).toDateString() ===
                                                selectedDate.toDateString()
                                        )
                                            ? "View Log"
                                            : "Add Log"}
                                    </button>
                                </>
                            );
                        })()}
                    </div>
                </div>

                {/* Add Log Modal */}
                {showLogModal && (
                    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/60">
                        <div className="bg-light-bg dark:bg-dark-bg text-light-primary-text dark:text-dark-primary-text rounded-2xl p-6 w-full max-w-md relative">
                            <button
                                className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                onClick={() => setShowLogModal(false)}>
                                <X size={20} />
                            </button>

                            <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
                                Add Daily Log (
                                {selectedDate
                                    ? new Date(
                                          selectedDate
                                      ).toLocaleDateString()
                                    : ""}
                                )
                            </h3>

                            <div className="mb-6">
                                <div className="font-semibold mb-2 text-gray-800 dark:text-gray-300">
                                    Symptoms
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {DAILY_LOG_SYMPTOMS.map((s) => (
                                        <button
                                            key={s}
                                            type="button"
                                            onClick={() =>
                                                handleToggleSymptom(s)
                                            }
                                            className={`px-3 py-1.5 rounded-full text-sm font-medium border transition
                ${
                    logSymptoms.includes(s)
                        ? "bg-light-primary dark:bg-dark-primary text-white border-light-primary dark:border-dark-primary shadow-md shadow-light-primary/20 dark:shadow-dark-primary/20"
                        : "bg-light-bg dark:bg-dark-surface border-none text-light-secondary-text dark:text-dark-secondary-text"
                }`}>
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="mb-6">
                                <div className="font-semibold mb-2 text-gray-800 dark:text-gray-300">
                                    Flow Intensity
                                </div>
                                <div className="flex gap-4">
                                    {FLOW_OPTIONS.map((opt) => (
                                        <label
                                            key={opt}
                                            className="flex items-center gap-2 cursor-pointer text-sm text-gray-700 dark:text-gray-300">
                                            <input
                                                type="radio"
                                                name="flowIntensity"
                                                value={opt}
                                                checked={logFlow === opt}
                                                onChange={() => setLogFlow(opt)}
                                                className="accent-green-600"
                                            />
                                            <span className="capitalize">
                                                {opt}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="mb-4">
                                <div className="font-semibold mb-1 text-gray-800 dark:text-gray-300">
                                    Mood (optional)
                                </div>
                                <input
                                    type="text"
                                    value={logMood}
                                    onChange={(e) => setLogMood(e.target.value)}
                                    className="w-full rounded-lg bg-lightt-bg dark:bg-dark-surface text-light-primar-text dark:text-dark-primar-text px-3 py-3 text-sm mt-1 outline-none"
                                    placeholder="How do you feel?"
                                />
                            </div>

                            <div className="mb-5">
                                <div className="font-semibold mb-1 text-gray-800 dark:text-gray-300">
                                    Notes (optional)
                                </div>
                                <textarea
                                    value={logNotes}
                                    onChange={(e) =>
                                        setLogNotes(e.target.value)
                                    }
                                    className="w-full rounded-lg bg-lightt-bg dark:bg-dark-surface text-light-primar-text dark:text-dark-primar-text px-3 py-3 text-sm mt-1 outline-none"
                                    placeholder="Add any notes..."
                                    rows={2}
                                />
                            </div>

                            <div className="flex justify-end gap-3">
                                <button
                                    className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition"
                                    onClick={() => setShowLogModal(false)}
                                    disabled={logLoading}>
                                    Cancel
                                </button>

                                <button
                                    className="px-5 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white font-medium shadow-lg shadow-green-600/20 transition disabled:opacity-60"
                                    onClick={handleSaveLog}
                                    disabled={logLoading}>
                                    {logLoading ? "Saving..." : "Save"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* View Log Modal */}
                {showViewLogModal && viewLog && (
                    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/60">
                        <div className="bg-light-bg dark:bg-dark-bg text-light-primary-text dark:text-dark-primary-text rounded-2xl shadow-xl p-6 w-full max-w-md relative">
                            <button
                                className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                onClick={() => setShowViewLogModal(false)}>
                                <X size={20} />
                            </button>

                            <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
                                Log Details{" "}
                                {viewLog.date
                                    ? `(${new Date(
                                          viewLog.date
                                      ).toLocaleDateString()})`
                                    : ""}
                            </h3>

                            <div className="mb-3">
                                <span className="font-semibold text-gray-700 dark:text-gray-300 block mb-2">
                                    Symptoms:
                                </span>

                                <div className="flex flex-wrap gap-2">
                                    {Array.isArray(viewLog.symptoms) &&
                                    viewLog.symptoms.length ? (
                                        viewLog.symptoms.map(
                                            (symptom, index) => (
                                                <span
                                                    key={index}
                                                    className="px-3 py-1 rounded-full text-sm bg-green-100 text-green-800 dark:bg-green-900/60 dark:text-green-300 border border-green-200 dark:border-green-700">
                                                    {symptom}
                                                </span>
                                            )
                                        )
                                    ) : (
                                        <span className="text-gray-500 dark:text-gray-400">
                                            None
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="mb-2">
                                <span className="font-semibold text-gray-700 dark:text-gray-300">
                                    Flow Intensity:
                                </span>
                                <span className="ml-2 capitalize text-gray-900 dark:text-gray-100">
                                    {viewLog.flowIntensity}
                                </span>
                            </div>

                            <div className="mb-2">
                                <span className="font-semibold text-gray-700 dark:text-gray-300">
                                    Mood:
                                </span>
                                <span className="ml-2 text-gray-900 dark:text-gray-100">
                                    {viewLog.mood || "—"}
                                </span>
                            </div>

                            <div className="mb-2">
                                <span className="font-semibold text-gray-700 dark:text-gray-300">
                                    Notes:
                                </span>
                                <span className="ml-2 text-gray-900 dark:text-gray-100">
                                    {viewLog.notes || "—"}
                                </span>
                            </div>

                            <div className="flex justify-end mt-5">
                                <button
                                    onClick={() => setShowViewLogModal(false)}
                                    className="px-5 py-2 rounded-lg bg-light-primary dark:bg-dark-primary text-white font-medium hover:bg-light-primary-hover dark:hover:bg-dark-primary-hover transition cursor-pointer">
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Summary and Day Status beside calendar */}
                    <div className="lg:col-span-1 flex flex-col items-center justify-center">
                        <div className="my-4 p-6 rounded-2xl shadow-md bg-light-bg dark:bg-dark-surface w-full transition-all text-md">
                            {/* SUMMARY SECTION */}
                            <div className="mb-6 space-y-3">
                                <div>
                                    <span className="font-semibold text-light-primary-text dark:text-dark-primary-text">
                                        Next Predicted Period:
                                    </span>
                                    <span className="text-blue-500 dark:text-blue-400 font-bold">
                                        {summary.nextPeriodStart
                                            ? " " +
                                              new Date(
                                                  summary.nextPeriodStart
                                              ).toLocaleDateString()
                                            : "--"}
                                    </span>
                                </div>

                                <hr className="text-light-secondary-text/30 dark:text-dark-secondary-text/30" />

                                <div>
                                    <span className="font-semibold text-light-primary-text dark:text-dark-primary-text">
                                        Average Cycle Length:
                                    </span>
                                    <span className="text-light-primary-text dark:text-dark-primary-text">
                                        {summary.averageCycleLength
                                            ? " " +
                                              summary.averageCycleLength +
                                              " days"
                                            : "--"}
                                    </span>
                                </div>

                                <div>
                                    <span className="font-semibold text-light-primary-text dark:text-dark-primary-text">
                                        Average Period Length:
                                    </span>
                                    <span className="text-light-primary-text dark:text-dark-primary-text">
                                        {summary.averagePeriodLength
                                            ? " " +
                                              summary.averagePeriodLength +
                                              " days"
                                            : "--"}
                                    </span>
                                </div>

                                <hr className="text-light-secondary-text/30 dark:text-dark-secondary-text/30" />

                                {/* <div>
                                    <span className="font-semibold text-light-primary-text dark:text-dark-primary-text">
                                        Last Period Start:
                                    </span>
                                    <span className="text-light-primary-text dark:text-dark-primary-text">
                                        {summary.lastPeriodStart
                                            ? " " +
                                              new Date(
                                                  summary.lastPeriodStart
                                              ).toLocaleDateString()
                                            : "--"}
                                    </span>
                                </div>

                                <div>
                                    <span className="font-semibold text-light-primary-text dark:text-dark-primary-text">
                                        Last Period End:
                                    </span>
                                    <span className="text-light-primary-text dark:text-dark-primary-text">
                                        {summary.lastPeriodEnd
                                            ? " " +
                                              new Date(
                                                  summary.lastPeriodEnd
                                              ).toLocaleDateString()
                                            : "--"}
                                    </span>
                                </div> */}

                                {/* Display ovulation and fertile window for the latest cycle only */}
                                {(() => {
                                    if (
                                        summary.ovulationDays &&
                                        summary.ovulationDays.length > 0
                                    ) {
                                        const lastOvu =
                                            summary.ovulationDays[
                                                summary.ovulationDays.length - 1
                                            ];
                                        return (
                                            <div>
                                                <span className="font-semibold text-light-primary-text dark:text-dark-primary-text">
                                                    Ovulation Day:
                                                </span>
                                                <span className="text-purple-600 dark:text-purple-400 font-bold">
                                                    {" "}
                                                    {lastOvu.toLocaleDateString()}
                                                </span>
                                            </div>
                                        );
                                    }
                                    return null;
                                })()}
                                {(() => {
                                    if (
                                        summary.fertileWindows &&
                                        summary.fertileWindows.length > 0
                                    ) {
                                        const lastWin =
                                            summary.fertileWindows[
                                                summary.fertileWindows.length -
                                                    1
                                            ];
                                        return (
                                            <>
                                                <div>
                                                    <span className="font-semibold text-light-primary-text dark:text-dark-primary-text">
                                                        Fertile Window Start:
                                                    </span>
                                                    <span className="text-green-600 dark:text-green-400 font-bold">
                                                        {" "}
                                                        {lastWin.start.toLocaleDateString()}
                                                    </span>
                                                </div>
                                                <div>
                                                    <span className="font-semibold text-light-primary-text dark:text-dark-primary-text">
                                                        Fertile Window End:
                                                    </span>
                                                    <span className="text-green-600 dark:text-green-400 font-bold">
                                                        {" "}
                                                        {lastWin.end.toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </>
                                        );
                                    }
                                    return null;
                                })()}
                            </div>

                            <hr className="text-light-secondary-text/30 dark:text-dark-secondary-text/30" />

                            {/* DAY STATUS SECTION */}
                            <div className="mt-4 text-center">
                                <span className="font-semibold text-light-primary-text dark:text-dark-primary-text">
                                    Day Status:
                                </span>
                                <br />

                                <div className="mt-2 text-base">
                                    {(() => {
                                        const dateToShow =
                                            selectedDate || new Date();
                                        const day = dateToShow.getDate();

                                        // Ovulation and fertile window logic for all cycles
                                        const selected = new Date(
                                            dateToShow.getFullYear(),
                                            dateToShow.getMonth(),
                                            dateToShow.getDate()
                                        );
                                        if (
                                            summary.ovulationDays &&
                                            Array.isArray(summary.ovulationDays)
                                        ) {
                                            for (const ovu of summary.ovulationDays) {
                                                if (
                                                    selected.toDateString() ===
                                                    ovu.toDateString()
                                                ) {
                                                    return (
                                                        <span className="text-purple-600 dark:text-purple-400 font-bold">
                                                            Ovulation Day
                                                        </span>
                                                    );
                                                }
                                            }
                                        }
                                        if (
                                            summary.fertileWindows &&
                                            Array.isArray(
                                                summary.fertileWindows
                                            )
                                        ) {
                                            for (const win of summary.fertileWindows) {
                                                if (
                                                    selected >= win.start &&
                                                    selected <= win.end
                                                ) {
                                                    return (
                                                        <span className="text-green-600 dark:text-green-400 font-bold">
                                                            Fertility Phase
                                                        </span>
                                                    );
                                                }
                                            }
                                        }
                                        if (isPeriodStart(day))
                                            return (
                                                <span className="text-blue-500 dark:text-blue-400 font-bold">
                                                    Period Start
                                                </span>
                                            );

                                        if (isPeriodEnd(day))
                                            return (
                                                <span className="text-red-500 dark:text-red-400 font-bold">
                                                    Period End
                                                </span>
                                            );

                                        if (isPeriodDay(day))
                                            return (
                                                <span className="text-pink-500 dark:text-pink-400 font-bold">
                                                    Period Day
                                                </span>
                                            );

                                        return (
                                            <span className="text-gray-500 dark:text-gray-400">
                                                No period data for this date
                                            </span>
                                        );
                                    })()}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Calendar Grid */}
                    <div className="lg:col-span-2">
                        {/* Calendar Header */}
                        <div className="flex items-center justify-between mb-4">
                            <button
                                onClick={() => navigateMonth("prev")}
                                className="p-2 rounded-lg bg-light-background dark:bg-dark-background hover:bg-light-primary/10 dark:hover:bg-dark-primary/10 transition-colors">
                                <ChevronLeft className="w-5 h-5 text-light-primary-text dark:text-dark-primary-text" />
                            </button>
                            <h4 className="text-xl font-bold text-light-primary-text dark:text-dark-primary-text">
                                {currentMonth.toLocaleDateString("en-US", {
                                    month: "long",
                                    year: "numeric",
                                })}
                            </h4>
                            <button
                                onClick={() => navigateMonth("next")}
                                className="p-2 rounded-lg bg-light-background dark:bg-dark-background hover:bg-light-primary/10 dark:hover:bg-dark-primary/10 transition-colors">
                                <ChevronRight className="w-5 h-5 text-light-primary-text dark:text-dark-primary-text" />
                            </button>
                        </div>

                        {/* Calendar Days Header */}
                        <div className="grid grid-cols-7 gap-1 mb-2">
                            {[
                                "Sun",
                                "Mon",
                                "Tue",
                                "Wed",
                                "Thu",
                                "Fri",
                                "Sat",
                            ].map((day) => (
                                <div
                                    key={day}
                                    className="p-2 text-center text-sm font-medium text-light-secondary-text dark:text-dark-secondary-text">
                                    {day}
                                </div>
                            ))}
                        </div>

                        {/* Calendar Days Grid */}
                        <div className="grid grid-cols-7 gap-1">
                            {generateCalendarDays().map((day, index) => (
                                <div
                                    key={index}
                                    onClick={() => handleDayClick(day)}
                                    className={`
                            relative p-3 min-h-[48px] rounded-lg cursor-pointer transition-all duration-200 flex flex-col items-center justify-center
                            ${
                                !day
                                    ? "cursor-default"
                                    : "hover:bg-light-primary/10 dark:hover:bg-dark-primary/10"
                            }
                            ${
                                isToday(day)
                                    ? "bg-light-primary text-white font-bold"
                                    : ""
                            }
                            ${
                                isSelected(day) && !isToday(day)
                                    ? "bg-light-primary/20 dark:bg-dark-primary/20 border-2 border-light-primary dark:border-dark-primary"
                                    : ""
                            }
                            ${
                                !day
                                    ? ""
                                    : "border border-light-secondary-text/10 dark:border-dark-secondary-text/10"
                            }
                        `}>
                                    {day && (
                                        <>
                                            <span
                                                className={`text-sm ${
                                                    isToday(day)
                                                        ? "text-white"
                                                        : "text-light-primary-text dark:text-dark-primary-text"
                                                }`}>
                                                {day}
                                            </span>
                                            {/* Period dots */}
                                            {isPeriodDay(day) && (
                                                <div className="absolute top-1 right-1">
                                                    <div
                                                        className={`w-2 h-2 rounded-full 
                                                        ${
                                                            isPeriodStart(day)
                                                                ? "bg-blue-500"
                                                                : isPeriodEnd(
                                                                      day
                                                                  )
                                                                ? "bg-red-500"
                                                                : "bg-pink-400"
                                                        }
                                                    `}></div>
                                                </div>
                                            )}
                                            {/* Fertility phase green dot for all cycles */}
                                            {(() => {
                                                if (
                                                    !day ||
                                                    !summary.fertileWindows ||
                                                    !Array.isArray(
                                                        summary.fertileWindows
                                                    )
                                                )
                                                    return null;
                                                const dateObj = new Date(
                                                    currentMonth.getFullYear(),
                                                    currentMonth.getMonth(),
                                                    day
                                                );
                                                for (const win of summary.fertileWindows) {
                                                    if (
                                                        dateObj >= win.start &&
                                                        dateObj <= win.end &&
                                                        !isPeriodDay(day)
                                                    ) {
                                                        return (
                                                            <div className="absolute top-1 right-1">
                                                                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                                            </div>
                                                        );
                                                    }
                                                }
                                                return null;
                                            })()}
                                            {/* Ovulation day purple dot for all cycles */}
                                            {(() => {
                                                if (
                                                    !day ||
                                                    !summary.ovulationDays ||
                                                    !Array.isArray(
                                                        summary.ovulationDays
                                                    )
                                                )
                                                    return null;
                                                const dateObj = new Date(
                                                    currentMonth.getFullYear(),
                                                    currentMonth.getMonth(),
                                                    day
                                                );
                                                for (const ovu of summary.ovulationDays) {
                                                    if (
                                                        dateObj.toDateString() ===
                                                        ovu.toDateString()
                                                    ) {
                                                        return (
                                                            <div className="absolute top-1 left-1">
                                                                <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                                                            </div>
                                                        );
                                                    }
                                                }
                                                return null;
                                            })()}
                                            {/* Next predicted period faded green block */}
                                            {(() => {
                                                if (
                                                    !day ||
                                                    !summary.nextPeriodStart
                                                )
                                                    return null;
                                                const dateObj = new Date(
                                                    currentMonth.getFullYear(),
                                                    currentMonth.getMonth(),
                                                    day
                                                );
                                                if (
                                                    dateObj.toDateString() ===
                                                    new Date(
                                                        summary.nextPeriodStart
                                                    ).toDateString()
                                                ) {
                                                    return (
                                                        <div className="absolute inset-0 rounded-lg bg-green-200 opacity-40 pointer-events-none"></div>
                                                    );
                                                }
                                                return null;
                                            })()}
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WomenHealthCalendar;
