import { useState } from "react";
import { Dialog, DialogPanel } from "@headlessui/react";
import {
    RefreshCcw,
    Menu,
    PieChart,
    MousePointerClick,
    Fingerprint,
    Grid,
    X,
    ChevronDown,
    Phone,
    PlayCircle,
    Eye,
    LayoutDashboard,
} from "lucide-react";
import { useTheme } from "../../context/ThemeProvider";
import { useNavigate } from "react-router-dom";
import GoogleTranslater from "./GoogleTranslater";
import { useUser } from "../../context/UserContext";
import SignIn from "../auth/SignIn";
import SignUp from "../auth/SignUp";

const callsToAction = [];

export default function Navbar() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [authMode, setAuthMode] = useState(null); // "signin" | "signup" | null
    const { theme, setTheme } = useTheme();
    const navigate = useNavigate();

    const { user, isLoaded, isSignedIn } = useUser();

    // Function to get dashboard route based on user role
    const getDashboardRoute = () => {
        if (!isLoaded || !user) return "/dashboard";
        
        console.log("user", user);
        const userRole = user.metadata?.role;
        console.log(userRole);
        if (!userRole) return "/dashboard";

        switch (userRole) {
            case "Patient":
                return "/patient/dashboard";
            case "Doctor":
                return "/doctor/dashboard";
            case "Admin":
                return "/admin/dashboard";
            case "Pharmacy":
                return "/pharmacy/dashboard";
            default:
                return "/dashboard";
        }
    };

    const handleDashboardClick = () => {
        const route = getDashboardRoute();
        navigate(route);
    };

    const toggleColorBlindTheme = () => {
        setTheme(theme === "colorblind" ? "light" : "colorblind");
    };

    const cycleTheme = () => {
        if (theme === "light") {
            setTheme("dark");
        } else if (theme === "dark") {
            setTheme("colorblind");
        } else {
            setTheme("light");
        }
    };

    return (
        <header className="absolute w-screen z-50">
            <nav
                aria-label="Global"
                className="mx-auto flex max-w-7xl items-center justify-between p-6 lg:px-8">
                <div className="flex lg:flex-1">
                    <a href="/" className="flex items-center gap-2">
                        <img
                            src={"/aroga-logo.png"}
                            alt="Arogya Logo"
                            className="h-10 w-10"
                        />
                        <span className="text-2xl font-bold text-light-primary-text dark:text-dark-primary-text">
                            Arogya
                        </span>
                    </a>
                </div>
                <div className="flex lg:hidden">
                    <button
                        type="button"
                        onClick={() => setMobileMenuOpen(true)}
                        className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-light-primary-text dark:text-dark-primary-text cursor-pointer">
                        <span className="sr-only">Open main menu</span>
                        <Menu aria-hidden="true" className="size-6" />
                    </button>
                </div>
                <div className="hidden lg:flex flex-1" />
                <div className="hidden lg:flex lg:flex-1 gap-5 lg:justify-end items-center">
                    {
                        <div className="flex gap-6 items-center">
                            {isSignedIn ? (
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={handleDashboardClick}
                                        className="flex items-center gap-2 text-sm/6 font-semibold text-light-primary-text dark:text-dark-primary-text cursor-pointer">
                                        Dashboard
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => setAuthMode("signin")}
                                            className="inline-flex items-center gap-2 rounded-full bg-light-primary text-white px-4 py-2 text-sm font-semibold shadow-sm hover:bg-light-primary-dark transition">
                                            Sign In
                                        </button>
                                        <button
                                            onClick={() => setAuthMode("signup")}
                                            className="inline-flex items-center gap-2 rounded-full border border-light-primary text-light-primary px-4 py-2 text-sm font-semibold shadow-sm hover:bg-light-bg transition">
                                            Sign Up
                                        </button>
                                    </div>
                                    {authMode === "signin" && (
                                        <div className="absolute top-full mt-3 bg-white dark:bg-dark-bg shadow-lg rounded-xl p-4 w-80 z-20">
                                            <SignIn />
                                        </div>
                                    )}
                                    {authMode === "signup" && (
                                        <div className="absolute top-full mt-3 bg-white dark:bg-dark-bg shadow-lg rounded-xl p-4 w-80 z-20">
                                            <SignUp />
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    }
                    <div className="flex items-center gap-3">
                        <button
                            onClick={toggleColorBlindTheme}
                            className="cursor-pointer text-light-primary-text dark:text-dark-primary-text">
                            <Eye />
                        </button>
                        <GoogleTranslater />
                    </div>
                </div> 
            </nav>
            <Dialog
                open={mobileMenuOpen}
                onClose={setMobileMenuOpen}
                className="lg:hidden">
                <div className="fixed inset-0 z-40 bg-black/20" />
                <DialogPanel className="fixed top-4 right-4 z-50 w-[85%] max-w-sm max-h-[80vh] overflow-visible bg-light-bg dark:bg-dark-bg p-6 rounded-2xl shadow-lg ring-1 ring-light-primary/10 dark:ring-dark-primary/10">
                    <div className="flex items-center justify-between">
                        <a href="#" className="-m-1.5 p-1.5 cursor-pointer">
                            <span className="sr-only">Your Company</span>
                            <img
                                alt=""
                                src="https://tailwindcss.com/plus-assets/img/logos/mark.svg?color=indigo&shade=600"
                                className="h-8 w-auto"
                            />
                        </a>
                        <button
                            type="button"
                            onClick={() => setMobileMenuOpen(false)}
                            className="-m-2.5 rounded-md p-2.5 text-light-primary-text dark:text-dark-primary-text cursor-pointer">
                            <span className="sr-only">Close menu</span>
                            <X aria-hidden="true" className="size-6" />
                        </button>
                    </div>
                    <div className="mt-4 flow-root">
                        <div className="-my-4 divide-y divide-light-secondary/20 dark:divide-dark-secondary/20">
                            <div className="space-y-2 py-4" />
                            <div className="py-6 flex flex-col gap-3">
                                <button
                                    onClick={toggleColorBlindTheme}
                                    className="cursor-pointer flex items-center gap-2 text-light-primary-text dark:text-dark-primary-text">
                                    <Eye />
                                    <p>
                                        {theme === "colorblind"
                                            ? "Color Blind Mode"
                                            : "Normal Mode"}
                                    </p>
                                </button>
                                <div className="flex items-center max-w-[280px]">
                                    <GoogleTranslater />
                                </div>
                                {isSignedIn ? (
                                    <div className="flex flex-col gap-3">
                                        <button
                                            onClick={() => {
                                                handleDashboardClick();
                                                setMobileMenuOpen(false);
                                            }}
                                            className="-mx-3 flex items-center gap-2 rounded-lg px-3 py-2.5 text-base/7 font-semibold text-light-primary-text dark:text-dark-primary-text hover:bg-light-surface dark:hover:bg-dark-surface cursor-pointer">
                                            <LayoutDashboard className="size-5" />
                                            Dashboard
                                        </button>
                                        <SignOutButton redirectUrl="/">
                                            <button
                                                className="-mx-3 flex items-center gap-2 rounded-lg px-3 py-2.5 text-base/7 font-semibold text-light-primary-text dark:text-dark-primary-text hover:bg-light-surface dark:hover:bg-dark-surface cursor-pointer">
                                                Logout
                                            </button>
                                        </SignOutButton>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <button
                                            onClick={() => setAuthMode("signin")}
                                            className="w-full rounded-lg bg-light-primary text-white px-4 py-2 text-sm font-semibold shadow-sm hover:bg-light-primary-dark transition">
                                            Sign In
                                        </button>
                                        <button
                                            onClick={() => setAuthMode("signup")}
                                            className="w-full rounded-lg border border-light-primary text-light-primary px-4 py-2 text-sm font-semibold shadow-sm hover:bg-light-bg transition">
                                            Sign Up
                                        </button>
                                        {authMode === "signin" && <SignIn />}
                                        {authMode === "signup" && <SignUp />}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </DialogPanel>
            </Dialog>
        </header>
    );
}
