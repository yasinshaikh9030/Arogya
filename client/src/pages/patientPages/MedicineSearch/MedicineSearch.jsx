import React from "react";
import { useLocation } from "react-router-dom";
import Sidebar from "../../../components/Sidebar";
import PatientDock from "../../../components/patient/PatientDock";
import MedicineSearchContent from "./MedicineSearchContent";

const MedicineSearch = ({ tabs }) => {
    const location = useLocation();

    const getActiveTab = () => {
        return (
            tabs.find((tab) => tab.path === location.pathname)?.name ||
            tabs[0].name
        );
    };

    return (
        <div className="flex relative min-h-screen pb-24 md:pb-0">
            <div className="hidden md:block">
                <Sidebar tabs={tabs} getActiveTab={getActiveTab} />
            </div>

            <div className="min-h-screen w-full bg-light-bg dark:bg-dark-surface md:py-10 md:px-5 py-5 pb-24 md:pb-10">
                <MedicineSearchContent />
            </div>

            <PatientDock tabs={tabs} />
        </div>
    );
};

export default MedicineSearch;
