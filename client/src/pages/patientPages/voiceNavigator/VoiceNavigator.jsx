import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

/**
 * Simple voice navigator:
 * - Uses browser SpeechRecognition (webkit or standard).
 * - Normalizes incoming transcript using regex (removes common starters).
 * - Matches commands using word-boundary regex for safe matching.
 *
 * How to integrate (Windsurf):
 * - Provide onNavigate(key) prop: key is one of TAB_KEYS (see constants).
 * - Replace onNavigate calls with your router calls, e.g. history.push("/dashboard") or Windsurf API.
 */

const TAB_KEYS = {
    dashboard: "Dashboard",
    symptomChecker: "Symptoms Checker",
    logout: "Logout",
    language: "Language",
    shereads: "SheReads",
    menstrual: "Menstrual Health",
    appointment: "Get Appointment",
    searchMedicine: "Search Medicine",
    community: "Community Health",
    profile: "Profile" // example
};

// create match patterns (word-boundary) for each key.
// Add synonyms or alternate phrases here.
const COMMAND_PATTERNS = [
    { key: "dashboard", pattern: /\b(dashboard|home|analytics|charts|data)\b/ },
    { key: "symptomChecker", pattern: /\b(symptom(s)?|checker|symptom checker)\b/ },
    { key: "logout", pattern: /\b(log ?out|sign ?out|logout)\b/ },
    { key: "language", pattern: /\b(language|lang|translate)\b/ },
    { key: "shereads", pattern: /\b(she ?reads|shereads|she-reads)\b/ },
    { key: "menstrual", pattern: /\b(menstru(al)?|period|menstrual)\b/ },
    { key: "appointment", pattern: /\b(appointment|book|get appointment|book appointment|doctor)\b/ },
    { key: "searchMedicine", pattern: /\b(search (medicine|meds)|medicine|drug|pharmacy|search)\b/ },
    { key: "community", pattern: /\b(community|community health|forum|groups)\b/ },
    { key: "profile", pattern: /\b(profile|account|my profile)\b/ }
];

// regex to remove common starting words like "go to", "open", "please", etc.
const CLEANUP_REGEX = /\b(go to|goto|open|navigate to|navigate|please|kindly|show|take me to|go)\b/gi;

const keyToPatientPath = {
    dashboard: "/patient/dashboard",
    symptomChecker: "/patient/symptom-checker",
    shereads: "/patient/she-reads",
    menstrual: "/patient/menstrual-health",
    appointment: "/patient/get-appointment",
    searchMedicine: "/patient/medicine-search",
    community: "/patient/community",
};

const VoiceNavigator = ({ onNavigate, currentTab = "", autoStart = false }) => {
    const navigate = useNavigate();
    const [isSupported, setIsSupported] = useState(true);
    const [isListening, setIsListening] = useState(false);
    const [lastCommand, setLastCommand] = useState("");
    const [showHelp, setShowHelp] = useState(false);
    const recognitionRef = useRef(null);
    const autoStartPrevRef = useRef(false);

    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            setIsSupported(false);
            return;
        }

        const rec = new SpeechRecognition();
        rec.lang = "en-US";
        rec.interimResults = false;
        rec.continuous = true; // keep listening; we'll still manage stop/restart via flags

        rec.onresult = (e) => {
            const raw = e.results[e.results.length - 1][0].transcript || "";
            const cleaned = raw.replace(CLEANUP_REGEX, "").replace(/\s+/g, " ").trim().toLowerCase();
            setLastCommand(cleaned);
            handleCommand(cleaned);
        };

        rec.onend = () => {
            // if the user intended continuous listening, restart while autoStart is on
            if (autoStartPrevRef.current) {
                try {
                    rec.start();
                    setIsListening(true);
                    return;
                } catch (e) {
                    console.warn(e);
                }
            }
            setIsListening(false);
        };

        rec.onerror = (err) => {
            console.error("Speech recognition error:", err);
            setIsListening(false);
        };

        recognitionRef.current = rec;
        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.onresult = null;
                recognitionRef.current.onend = null;
                recognitionRef.current.onerror = null;
                try { recognitionRef.current.stop(); } catch (e) { }
            }
        };
    }, []);

    useEffect(() => {
        if (!recognitionRef.current) return;

        if (autoStart && !autoStartPrevRef.current) {
            try {
                recognitionRef.current.start();
                setIsListening(true);
            } catch (e) {
                console.warn(e);
            }
        } else if (!autoStart && autoStartPrevRef.current) {
            try {
                recognitionRef.current.stop();
            } catch (e) {
                console.warn(e);
            }
            setIsListening(false);
        }

        autoStartPrevRef.current = autoStart;
    }, [autoStart]);

    const navigateByKey = (key) => {
        if (typeof onNavigate === "function") {
            onNavigate(key);
            return;
        }

        const path = keyToPatientPath[key];
        if (path) {
            navigate(path);
        }
    };

    const handleCommand = (text) => {
        if (!text) return;

        // 1) Try exact key match (user says the exact key word)
        if (TAB_KEYS[text]) {
            navigateByKey(text);
            return;
        }

        // 2) Try patterns (regex) in order
        for (const { key, pattern } of COMMAND_PATTERNS) {
            if (pattern.test(text)) {
                navigateByKey(key);
                return;
            }
        }

        // 3) fallback: try split words and match any single word
        const words = text.split(/\s+/);
        for (const w of words) {
            for (const { key, pattern } of COMMAND_PATTERNS) {
                if (pattern.test(w)) {
                    navigateByKey(key);
                    return;
                }
            }
        }

        // If we reach here, no match found — you may show a small UI hint
        console.info("No command match for:", text);
    };

    const toggleListening = () => {
        if (autoStart) return;
        if (!recognitionRef.current) return;
        try {
            if (isListening) {
                recognitionRef.current.stop();
                setIsListening(false);
            } else {
                recognitionRef.current.start();
                setIsListening(true);
            }
        } catch (e) {
            // sometimes start/stop throws if called too quickly; handle gracefully
            console.warn(e);
        }
    };

    if (!isSupported) {
        return null; // or return a small notice UI if you prefer
    }

    return (
        <div style={{ position: "fixed", top: 18, right: 18, zIndex: 1200, display: "flex", flexDirection: "column", gap: 10, alignItems: "flex-end" }}>
            {showHelp && (
                <div style={{ minWidth: 260, padding: 14, borderRadius: 12, background: "rgba(255,255,255,0.95)", boxShadow: "0 8px 30px rgba(0,0,0,0.08)" }}>
                    <strong style={{ display: "block", marginBottom: 8 }}>🎤 Voice Commands</strong>
                    <div style={{ fontSize: 13, color: "#333" }}>
                        Try saying simple words like:
                        <ul style={{ marginTop: 6 }}>
                            {Object.entries(TAB_KEYS).slice(0, 6).map(([k, label]) => (
                                <li key={k}><code>{k}</code> — {label}</li>
                            ))}
                        </ul>
                        <div style={{ fontSize: 12, color: "#666" }}>
                            Current: {TAB_KEYS[currentTab] || currentTab || "—"}
                        </div>
                        {lastCommand && <div style={{ marginTop: 8, fontSize: 12, color: "#444" }}>Heard: “{lastCommand}”</div>}
                    </div>
                </div>
            )}

            <div style={{ display: "flex", gap: 10 }}>
                <button
                    title="Help"
                    onClick={() => setShowHelp(v => !v)}
                    style={{
                        width: 46,
                        height: 46,
                        borderRadius: "999px",
                        border: "1px solid rgba(255,255,255,0.8)",
                        cursor: "pointer",
                        background: "linear-gradient(135deg,#4C51BF,#667EEA)",
                        color: "white",
                        fontSize: 18,
                        boxShadow: "0 10px 25px rgba(76,81,191,0.45)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                    }}
                >
                    ?
                </button>

                <button
                    title={isListening ? "Stop listening" : "Start listening"}
                    onClick={toggleListening}
                    style={{
                        width: 60,
                        height: 60,
                        borderRadius: "999px",
                        border: "1px solid rgba(255,255,255,0.9)",
                        cursor: "pointer",
                        background: isListening
                            ? "linear-gradient(135deg,#F56565,#E53E3E)"
                            : "linear-gradient(135deg,#38B2AC,#319795)",
                        color: "white",
                        fontSize: 22,
                        boxShadow: isListening
                            ? "0 0 0 3px rgba(254,178,178,0.8),0 10px 25px rgba(229,62,62,0.55)"
                            : "0 10px 25px rgba(56,178,172,0.45)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                    }}
                >
                    {isListening ? "●" : "🎤"}
                </button>
            </div>

            {isListening && (
                <div
                    style={{
                        background: "rgba(254,243,242,0.95)",
                        color: "#9b2c2c",
                        padding: "8px 12px",
                        borderRadius: 18,
                        fontSize: 12,
                        boxShadow: "0 4px 14px rgba(0,0,0,0.12)"
                    }}
                >
                    Listening… say a feature name
                </div>
            )}
        </div>
    );
};

export default VoiceNavigator;