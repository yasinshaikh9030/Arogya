import {
    PanelLeftClose,
    PanelLeftOpen,
    ChartColumnIncreasing,
} from "lucide-react";
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import UserButton from "./auth/UserButton";
import { useUser } from "../context/UserContext";

const Sidebar = ({ tabs }) => {
    const { user } = useUser();
    // Initialize isCollapsed from localStorage or default to false
    const [isCollapsed, setIsCollapsed] = useState(() => {
        const saved = localStorage.getItem("sidebarCollapsed");
        return saved ? JSON.parse(saved) : false;
    });
    const navigate = useNavigate();
    const location = useLocation();

    // Update localStorage whenever isCollapsed changes
    const handleCollapse = () => {
        const newState = !isCollapsed;
        setIsCollapsed(newState);
        localStorage.setItem("sidebarCollapsed", JSON.stringify(newState));
    };

    const getActiveTab = () => {
        return (
            tabs.find((tab) => tab.path === location.pathname)?.name ||
            tabs[0].name
        );
    };

    return (
        <>
            {/* Mobile Sidebar Overlay */}
            <div
                className={`
                    fixed inset-0 z-40 bg-black/30 transition-opacity duration-1000
                    ${
                        isCollapsed
                            ? "pointer-events-none opacity-0"
                            : "pointer-events-auto opacity-100"
                    }
                    md:hidden
                `}
                onClick={handleCollapse}
                aria-hidden="true"
            />
            {/* Sidebar */}
            <aside
                className={`
                    top-0 left-0 h-screen bg-light-surface dark:bg-dark-bg text-light-primary-text dark:text-dark-primary-text flex flex-col px-3 py-5 transition-all duration-300 ease-in-out z-50
                    ${
                        isCollapsed
                            ? "w-0 overflow-hidden md:w-20 md:block hidden md:relative fixed"
                            : "w-full fixed md:w-60 md:sticky md:left-0"
                    }
                `}
                style={{ maxWidth: isCollapsed ? "200px" : "100vw" }}>
                <div
                    className={`flex px-2 ${
                        isCollapsed ? "justify-center" : "justify-between"
                    } items-center w-full`}>
                    <div
                        className={`overflow-hidden transition-all duration-300 ease-in-out ${
                            isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"
                        }`}>
                        <img
                            className="text-2xl font-semibold cursor-pointer whitespace-nowrap"
                            onClick={() => navigate("/")}
                            src={
                                "https://tailwindcss.com/plus-assets/img/logos/mark.svg?color=indigo&shade=600"
                            }
                            height={36}
                            width={36}
                        />
                    </div>
                    <button
                        onClick={handleCollapse}
                        className="rounded-lg hover:bg-light-hover dark:hover:bg-dark-hover p-2 md:opacity-100">
                        {isCollapsed ? (
                            <PanelLeftOpen size={26} />
                        ) : (
                            <PanelLeftClose size={26} />
                        )}
                    </button>
                </div>

                <hr className="mt-3 mb-4 border-light-border dark:border-dark-border opacity-20" />
                <nav className="flex-0">
                    <ul className="space-y-1">
                        {tabs.map((tab) => (
                            <li
                                key={tab.id}
                                className={`cursor-pointer px-4 py-3 text-base rounded-lg transition-all duration-300 ease-in-out ${
                                    getActiveTab() === tab.name
                                        ? "bg-light-primary/15 dark:bg-dark-primary/10 text-light-primary dark:text-dark-primary"
                                        : "hover:bg-light-hover dark:hover:bg-dark-hover"
                                }`}
                                onClick={() => {
                                    navigate(tab.path);
                                    if (window.innerWidth < 768)
                                        handleCollapse();
                                }}>
                                <div className="flex items-center">
                                    <tab.icon className="shrink-0" size={22} />
                                    <span
                                        className={`ml-2 transition-all text-sm font-semibold duration-300 ease-in-out ${
                                            isCollapsed
                                                ? "w-0 opacity-0"
                                                : "w-auto opacity-100"
                                        } whitespace-nowrap overflow-hidden`}>
                                        {tab.name}
                                    </span>
                                </div>
                            </li>
                        ))}
                    </ul>
                </nav>

                <hr className="mt-3 mb-5 border-light-border dark:border-dark-border opacity-20" />

                <div
                    className={`flex items-center md:justify-center justify-start px-2 transition-all duration-300 ease-in-out`}>
                    {!isCollapsed ? (
                        <div className="flex items-center md:justify-center justify-start gap-2 overflow-hidden">
                            <UserButton/>
                            <p className="font-medium md:text-base text-lg whitespace-nowrap transition-all duration-300 ease-in-out">
                                {user.fullName ||
                                    user.firstName + user.lastName}
                            </p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-4">
                            <UserButton
                                appearance={{
                                    elements: {
                                        userButtonAvatarBox: "w-20 h-20",
                                    },
                                }}
                            />
                        </div>
                    )}
                </div>
            </aside>
            {/* Mobile Sidebar Toggle Button */}
            <button
                onClick={handleCollapse}
                className="rounded-lg absolute hover:bg-light-hover dark:hover:bg-dark-hover px-4 py-6 md:opacity-0 opacity-100 md:hidden transition-all duration-300 ease-in-out z-50"
                style={{ left: 0, top: 0 }}>
                {isCollapsed && <PanelLeftOpen size={26} />}
            </button>
        </>
    );
};

export default Sidebar;
