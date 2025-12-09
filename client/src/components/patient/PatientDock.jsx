import React, { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Home } from "lucide-react";
import Dock from "../UI/dock";

const PatientDock = ({ tabs = [] }) => {
    const navigate = useNavigate();
    const location = useLocation();

    const items = useMemo(() => {
        const baseItems = tabs.map((tab) => {
            const isActive = tab.path === location.pathname;
            const Icon = tab.icon;
            const iconClass = isActive
                ? "text-light-bg dark:text-dark-bg"
                : "text-light-secondary-text dark:text-dark-secondary-text";

            const itemClassName = isActive
                ? "bg-light-primary dark:bg-dark-primary shadow-md"
                : "bg-transparent hover:bg-light-hover/70 dark:hover:bg-dark-hover/70";

            return {
                icon: <Icon size={22} className={iconClass} />,
                label: tab.name,
                onClick: () => navigate(tab.path),
                className: `transition-colors duration-200 transform hover:scale-105 active:scale-95 ${itemClassName}`,
            };
        });

        const isHomeActive = location.pathname === "/";
        const homeIconClass = isHomeActive
            ? "text-light-bg dark:text-dark-bg"
            : "text-light-secondary-text dark:text-dark-secondary-text";
        const homeItemClassName = isHomeActive
            ? "bg-light-primary dark:bg-dark-primary shadow-md"
            : "bg-transparent hover:bg-light-hover/70 dark:hover:bg-dark-hover/70";

        const homeItem = {
            icon: <Home size={22} className={homeIconClass} />,
            label: "Home",
            onClick: () => navigate("/"),
            className: `transition-colors duration-200 transform hover:scale-105 active:scale-95 ${homeItemClassName}`,
        };

        return [homeItem, ...baseItems];
    }, [tabs, location.pathname, navigate]);

    if (!tabs || tabs.length === 0) return null;

    return (
        <div className="fixed inset-x-0 bottom-0 z-40 md:hidden bg-transparent">
            <Dock
                items={items}
                panelHeight={64}
                baseItemSize={44}
                magnification={52}
                dockHeight={80}
                className="bg-light-surface dark:bg-dark-bg backdrop-blur-md shadow-md"
            />
        </div>
    );
};

export default PatientDock;
