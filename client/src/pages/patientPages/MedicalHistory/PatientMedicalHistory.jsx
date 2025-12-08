import React from "react";
import { useLocation } from "react-router-dom";
import Sidebar from "../../../components/Sidebar";
import GetAppointmentContent from "./GetAppointmentContent";
import { useState } from "react";
import PatientAppointments from "./PatientAppointments";
import PatientCompletedAppointments from "./PatientCompletedAppointments";

const GetAppointment = ({ tabs }) => {
    const location = useLocation();
    const [activeTab, setActiveTab] = useState("find-doctor");

    const getActiveTab = () => {
        return (
            tabs.find((tab) => tab.path === location.pathname)?.name ||
            tabs[0].name
        );
    };

    return (
        <div className="flex relative">
            <Sidebar tabs={tabs} getActiveTab={getActiveTab} />

            <div className="min-h-screen w-full bg-light-bg dark:bg-dark-surface md:py-8 md:px-5 py-5">
                <div className="mb-4 flex gap-4 border-b border-light-secondary-text/20 dark:border-dark-secondary-text/20">
                    <button
                        className={`px-4 py-2 font-semibold rounded-t-lg transition-colors duration-200 focus:outline-none ${
                            activeTab === "find-doctor"
                                ? "bg-light-primary text-white dark:bg-dark-primary"
                                : "bg-transparent text-light-primary-text dark:text-dark-primary-text"
                        }`}
                        onClick={() => setActiveTab("find-doctor")}>
                        Find Doctor
                    </button>
                    <button
                        className={`px-4 py-2 font-semibold rounded-t-lg transition-colors duration-200 focus:outline-none ${
                            activeTab === "appointments"
                                ? "bg-light-primary text-white dark:bg-dark-primary"
                                : "bg-transparent text-light-primary-text dark:text-dark-primary-text"
                        }`}
                        onClick={() => setActiveTab("appointments")}>
                        My Appointments
                    </button>
                    <button
                        className={`px-4 py-2 font-semibold rounded-t-lg transition-colors duration-200 focus:outline-none ${
                            activeTab === "completed"
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
        </div>
    );
};

export default GetAppointment;
