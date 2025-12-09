import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import Sidebar from "../../../components/Sidebar";
import PatientDock from "../../../components/patient/PatientDock";
import SymptomCheckerContent from "./SymptomCheckerContent";
import VoiceNavigator from "../voiceNavigator/VoiceNavigator";

const SymptomChecker = ({ tabs }) => {
    const location = useLocation();

    const [voiceEnabled, setVoiceEnabled] = useState(() => {
        if (typeof window === "undefined") return false;
        try {
            const saved = localStorage.getItem("patientVoiceNavigatorEnabled");
            return saved ? JSON.parse(saved) : false;
        } catch {
            return false;
        }
    });

    useEffect(() => {
        try {
            localStorage.setItem(
                "patientVoiceNavigatorEnabled",
                JSON.stringify(voiceEnabled)
            );
        } catch {
        }
    }, [voiceEnabled]);

    const getActiveTab = () => {
        return (
            tabs.find((tab) => tab.path === location.pathname)?.name ||
            tabs[0].name
        );
    };

    return (
        <div className="flex relative min-h-screen pb-24 md:pb-0">
            <div className="hidden md:block">
                <Sidebar
                    tabs={tabs}
                    getActiveTab={getActiveTab}
                    voiceEnabled={voiceEnabled}
                    onToggleVoice={() => setVoiceEnabled((v) => !v)}
                />
            </div>

            <div className="min-h-screen w-full bg-light-bg dark:bg-dark-surface md:py-10 md:px-5 py-5 pb-24 md:pb-10">
                <SymptomCheckerContent />
            </div>

            <PatientDock tabs={tabs} />
            <VoiceNavigator autoStart={voiceEnabled} />
        </div>
    );
};

export default SymptomChecker;
