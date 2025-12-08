import React, { useMemo, useState, useRef } from "react";
import {
    Stethoscope,
    HeartPulse,
    AlertTriangle,
    Leaf,
    Pill,
    Clock,
    Mic,
    X,
    Plus,
    RefreshCcw,
    CheckCircle2,
    Languages,
} from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import AiHealthInsight from "../../../components/patient/AiHealthInsight";
import { useUser } from "../../../context/UserContext";

const COMMON_SYMPTOMS = [
    "Fever",
    "Cough",
    "Headache",
    "Stomach Pain",
    "Cold/Flu",
    "Back Pain",
    "Fatigue",
    "Chest Pain",
    "Shortness of Breath",
    "Skin Rash",
    "Joint Pain",
    "Sore Throat",
    "Nausea",
    "Dizziness",
];

function SymptomTag({ label, onRemove }) {
    return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 text-sm">
            {label}
            <button
                type="button"
                onClick={onRemove}
                className="hover:opacity-80"
                aria-label={`Remove ${label}`}>
                <X className="w-3.5 h-3.5" />
            </button>
        </span>
    );
}

const SymptomCheckerContent = () => {
    const [input, setInput] = useState("");
    const [symptoms, setSymptoms] = useState([]);
    const [language, setLanguage] = useState("en");
    const [recording, setRecording] = useState(false);
    const [aiInsight, setAiInsight] = useState(null);
    const recognitionRef = useRef(null);

    const { user } = useUser();
    console.log(user);

    const canSubmit = useMemo(
        () => symptoms.length > 0 || input.trim().length > 0,
        [symptoms, input]
    );

    const addSymptom = (label) => {
        const normalized = label.trim();
        if (!normalized) return;
        setSymptoms((prev) =>
            prev.includes(normalized) ? prev : [...prev, normalized]
        );
        setInput("");
    };

    const removeSymptom = (label) => {
        setSymptoms((prev) => prev.filter((s) => s !== label));
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            addSymptom(input);
        }
    };

    const handleCommonClick = (label) => addSymptom(label);

    const handleClear = () => {
        setSymptoms([]);
        setInput("");
    };

    const calcAge = (d) => {
        const dobDate = new Date(d);
        const diff = Date.now() - dobDate.getTime();
        const ageDate = new Date(diff);
        return Math.abs(ageDate.getUTCFullYear() - 1970);
    };

    const age = user?.metadata?.patientData?.dob ? calcAge(user?.metadata?.patientData?.dob) : "";

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!canSubmit) return;

        const parts = [];
        if (Array.isArray(symptoms) && symptoms.length) {
            parts.push(symptoms.join(", "));
        }
        if (input.trim()) {
            parts.push(input.trim());
        }

        const symptomsText = parts.join(". ");

        if (!symptomsText) return;

        await toast.promise(
            (async () => {
                try {
                    const res = await axios.post(
                        `${import.meta.env.VITE_SERVER_URL}/api/health-analyze`,
                        {
                            symptoms: symptomsText,
                        }
                    );
                    console.log(res.data);
                    setAiInsight(res.data);

                    setInput("");
                    setSymptoms([]);

                    return res.data;
                } catch (e) {
                    console.log(e);
                    throw e;
                }
            })(),
            {
                loading: "AI is analyzing your symptoms...",
                success: (data) =>
                    `Analysis complete! Found ${data.possibleDiseases?.length || 0
                    } possible condition${data.possibleDiseases?.length !== 1 ? 's' : ''}.`,
                error: () => `Failed to analyze symptoms.`,
            }
        );
    };

    const toggleVoice = () => {
        // Simple demo: simulates starting/stopping voice capture
        if (
            !("webkitSpeechRecognition" in window) &&
            !("SpeechRecognition" in window)
        ) {
            toast.error("Voice input is not supported in this browser.");
            return;
        }

        if (recording && recognitionRef.current) {
            recognitionRef.current.stop();
            return;
        }

        const SpeechRecognition =
            window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();

        const langMap = {
            en: "en-US",
            hi: "hi-IN",
            bn: "bn-IN",
            te: "te-IN",
            ta: "ta-IN",
        };

        recognition.lang = langMap[language] || "en-US";
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
            setRecording(true);
        };

        recognition.onend = () => {
            setRecording(false);
        };

        recognition.onerror = () => {
            setRecording(false);
        };

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            setInput((prev) =>
                prev ? `${prev} ${transcript}` : transcript
            );
        };

        recognitionRef.current = recognition;
        recognition.start();
    };

    return (
        <div className="w-full max-w-8xl mx-auto ">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Input Card */}
                <div className="lg:col-span-2 bg-light-surface dark:bg-dark-bg rounded-2xl shadow p-5">
                    <div className="flex items-start justify-between mb-6">
                        <div className="flex items-center gap-2">
                            <HeartPulse className="w-7 h-7 text-light-primary dark:text-dark-primary" />
                            <h3 className="font-semibold text-light-primary-text dark:text-dark-primary-text">
                                Describe your symptoms
                            </h3>
                        </div>

                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="relative">
                            <textarea
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                rows={4}
                                placeholder="Describe how you feel or press Enter to add..."
                                className="w-full rounded-xl border border-light-secondary-text/20 dark:border-dark-secondary-text/20 bg-light-background dark:bg-dark-background text-light-primary-text dark:text-dark-primary-text px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-light-primary dark:focus:ring-dark-primary"
                            />
                            <button
                                type="button"
                                onClick={toggleVoice}
                                className={`absolute right-3 bottom-3 p-2 rounded-lg transition ${recording
                                    ? "bg-red-100 text-red-600 dark:bg-red-900/30"
                                    : "bg-light-background dark:bg-dark-background text-light-secondary-text dark:text-dark-secondary-text"
                                    }`}
                                title="Voice Input"
                                aria-pressed={recording}>
                                <Mic className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Selected Symptoms */}
                        {(symptoms.length > 0 || input.trim()) && (
                            <div className="flex flex-wrap gap-2">
                                {symptoms.map((s) => (
                                    <SymptomTag
                                        key={s}
                                        label={s}
                                        onRemove={() => removeSymptom(s)}
                                    />
                                ))}
                                {input.trim() && (
                                    <button
                                        type="button"
                                        onClick={() => addSymptom(input)}
                                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 text-sm hover:opacity-90">
                                        <Plus className="w-3.5 h-3.5" /> Add "
                                        {input.trim()}"
                                    </button>
                                )}
                            </div>
                        )}

                        <div className="bg-light-surface dark:bg-dark-surface rounded-2xl  p-5">
                            <div className="flex items-center gap-2 mb-3">
                                <AlertTriangle className="w-5 h-5 text-amber-500" />
                                <h4 className="font-semibold text-light-primary-text dark:text-dark-primary-text">
                                    Common symptoms
                                </h4>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {COMMON_SYMPTOMS.map((s) => (
                                    <button
                                        key={s}
                                        onClick={() => handleCommonClick(s)}
                                        type="button"
                                        className="px-3 py-1.5 rounded-full  text-light-secondary-text dark:text-dark-secondary-text hover:bg-light-bg/50 dark:hover:bg-dark-bg/50 bg-light-bg dark:bg-dark-bg text-sm">
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-3 pt-2">
                            <button
                                type="button"
                                onClick={handleClear}
                                className="px-4 py-2 rounded-xl border border-light-secondary-text/20 dark:border-dark-secondary-text/20 text-light-secondary-text dark:text-dark-secondary-text hover:bg-light-background dark:hover:bg-dark-background">
                                <RefreshCcw className="w-4 h-4 inline mr-2" />{" "}
                                Reset
                            </button>
                            <button
                                type="submit"
                                disabled={!canSubmit}
                                className="px-4 py-2 rounded-xl bg-light-primary dark:bg-dark-primary text-white hover:bg-light-primary-dark dark:hover:bg-dark-primary-dark disabled:opacity-50 disabled:cursor-not-allowed">
                                <CheckCircle2 className="w-4 h-4 inline mr-2" />{" "}
                                Check Health
                            </button>
                        </div>

                        {aiInsight && <AiHealthInsight aiInsight={aiInsight} />}
                    </form>
                </div>

                {/* Common Symptoms & Info */}
                <div className="space-y-6">
                    <div className="bg-light-surface dark:bg-dark-bg rounded-2xl shadow p-5">
                        <div className="flex items-center gap-2 mb-3">
                            <Pill className="w-5 h-5 text-fuchsia-600" />
                            <h4 className="font-semibold text-light-primary-text dark:text-dark-primary-text">
                                What you get
                            </h4>
                        </div>
                        <ul className="list-disc pl-5 text-sm text-light-secondary-text dark:text-dark-secondary-text space-y-1">
                            <li>
                                AI analysis: Good / Mild / Moderate / Severe
                            </li>
                            <li>Possible diseases with confidence score</li>
                            <li>
                                Simple remedies and OTC medicine suggestions
                            </li>
                            <li>
                                Accessible UI with large icons and clear
                                language
                            </li>
                        </ul>
                    </div>

                    <div className="bg-light-surface dark:bg-dark-bg rounded-2xl shadow p-5">
                        <div className="flex items-center gap-2 mb-2">
                            <Leaf className="w-5 h-5 text-emerald-600" />
                            <h4 className="font-semibold text-light-primary-text dark:text-dark-primary-text">
                                Accessibility
                            </h4>
                        </div>
                        <p className="text-sm text-light-secondary-text dark:text-dark-secondary-text">
                            Voice input, large icons, adjustable font size,
                            multilingual support.
                        </p>
                        <div className="flex items-center gap-2 text-xs mt-2 text-light-secondary-text dark:text-dark-secondary-text">
                            <Clock className="w-4 h-4" /> Results will appear in
                            the browser console after submitting.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SymptomCheckerContent;
