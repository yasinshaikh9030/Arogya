import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import Sidebar from "../../../components/Sidebar";
import PatientDock from "../../../components/patient/PatientDock";
import GetAppointmentContent from "./GetAppointmentContent";
import PatientAppointments from "./PatientAppointments";
import PatientCompletedAppointments from "./PatientCompletedAppointments";
import VoiceNavigator from "../voiceNavigator/VoiceNavigator";

const GetAppointment = ({ tabs }) => {
    const location = useLocation();
    const [activeTab, setActiveTab] = useState("find-doctor");

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

            <div className="min-h-screen w-full bg-light-bg dark:bg-dark-surface md:py-8 md:px-5 py-4 pb-24 md:pb-10">
                <div className="mb-4 flex gap-2 overflow-x-auto border-b border-light-secondary-text/20 dark:border-dark-secondary-text/20 pb-1">
                    <button
                        className={`whitespace-nowrap px-3 py-2 text-xs sm:text-sm md:text-base font-semibold rounded-t-lg transition-colors duration-200 focus:outline-none ${activeTab === "find-doctor"
                            ? "bg-light-primary text-white dark:bg-dark-primary"
                            : "bg-transparent text-light-primary-text dark:text-dark-primary-text"
                            }`}
                        onClick={() => setActiveTab("find-doctor")}>
                        Find Doctor
                    </button>
                    <button
                        className={`whitespace-nowrap px-3 py-2 text-xs sm:text-sm md:text-base font-semibold rounded-t-lg transition-colors duration-200 focus:outline-none ${activeTab === "appointments"
                            ? "bg-light-primary text-white dark:bg-dark-primary"
                            : "bg-transparent text-light-primary-text dark:text-dark-primary-text"
                            }`}
                        onClick={() => setActiveTab("appointments")}>
                        My Appointments
                    </button>
                    <button
                        className={`whitespace-nowrap px-3 py-2 text-xs sm:text-sm md:text-base font-semibold rounded-t-lg transition-colors duration-200 focus:outline-none ${activeTab === "completed"
                            ? "bg-light-primary text-white dark:bg-dark-primary"
                            : "bg-transparent text-light-primary-text dark:text-dark-primary-text"
                            }`}
                        onClick={() => setActiveTab("completed")}>
                        Completed Appointments
                    </button>
                </div>
                {activeTab === "find-doctor" && <GetAppointmentContent />}
                {activeTab === "appointments" && <PatientAppointments />}
                {activeTab === "completed" && <PatientCompletedAppointments />}
            </div>

            <PatientDock tabs={tabs} />
            <VoiceNavigator autoStart={voiceEnabled} />
        </div>
    );
};

export default GetAppointment;
