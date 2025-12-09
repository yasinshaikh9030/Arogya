import React from "react";
import { useLocation } from "react-router-dom";
import Sidebar from "../../../components/Sidebar";
import PatientDashboardContent from "./PatientDashboardContent";
import BookWithCallRightNow from "../../../components/patient/BookWithCallRightNow";
// import VoiceNavigator from "../voiceNavigator/VoiceNavigator";

export default function PDashboard({ tabs }) {
    const location = useLocation();

    const getActiveTab = () => {
        return (
            tabs.find((tab) => tab.path === location.pathname)?.name ||
            tabs[0].name
        );
    };

    return (
        <div className="flex relative">
            <Sidebar tabs={tabs} getActiveTab={getActiveTab} />

            <div className="h-full w-full bg-light-bg dark:bg-dark-surface md:py-10 md:px-5 py-5">
                <PatientDashboardContent />
            </div>

            
            <BookWithCallRightNow />

{/* 
            <PatientDock tabs={tabs} />
            <VoiceNavigator autoStart={voiceEnabled} />  */}
        </div>
    );
}
    