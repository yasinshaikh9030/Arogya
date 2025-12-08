import React, { useEffect, useState } from "react";
// import { useAuth, useUser } from "@clerk/clerk-react";
import {useAuth} from "../../../context/AuthContext";
import {useUser} from "../../../context/UserContext";
import axios from "axios";
import {
    User,
    Stethoscope,
    Mail,
    Phone,
    MapPin,
    Award,
    Clock,
    DollarSign,
    Star,
    CheckCircle,
    AlertCircle,
    XCircle,
    Calendar,
    Settings,
    Activity,
    TrendingUp,
    Users,
    FileText,
    Shield,
    Globe,
    Edit,
    Bell,
    GitGraph,
    GitBranchPlus,
    IndianRupee,
    CalendarClock,
    File,
} from "lucide-react";
import Loader from "../../../components/main/Loader";
import { auth } from "../../../config/config";

const DocContent = () => {
    const [doctorData, setDoctorData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currentTime, setCurrentTime] = useState(new Date());
    const { user } = useUser();
    const { getToken } = useAuth();
    const [manageOpen, setManageOpen] = useState(false);
    const [availabilityByDay, setAvailabilityByDay] = useState({});
    const [blackouts, setBlackouts] = useState([]);
    const [blackoutForm, setBlackoutForm] = useState({ date: "", startTime: "", endTime: "" });
    const [savingAvail, setSavingAvail] = useState(false);
    const [savingBlk, setSavingBlk] = useState(false);
    const [selectedDate, setSelectedDate] = useState(() => {
        const d = new Date();
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${y}-${m}-${day}`; // Local YYYY-MM-DD
    });
    const [previewSlots, setPreviewSlots] = useState([]);
    const [loadingPreview, setLoadingPreview] = useState(false);
    const [availValidationMsg, setAvailValidationMsg] = useState("");
    const [locationSaved, setLocationSaved] = useState(false);

    useEffect(() => {
        fetchDoctor();
    }, []);

    // Auto-open Manage Schedule if query param is present
    useEffect(() => {
        try {
            const params = new URLSearchParams(window.location.search);
            const flag = params.get("manageSchedule");
            if (flag === "1" || flag === "true") {
                openManageSchedule();
            }
        } catch (_) {}
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (manageOpen) {
            setBlackoutForm((p) => ({ ...p, date: selectedDate }));
        }
    }, [selectedDate, manageOpen]);

    useEffect(() => {
        const fetchPreview = async () => {
            if (!manageOpen || !doctorData?._id || !selectedDate) return;
            try {
                setLoadingPreview(true);
                const token = await auth.currentUser.getIdToken();
                console.log(token);
                const res = await axios.get(
                    `${import.meta.env.VITE_SERVER_URL}/api/doctor/${doctorData._id}/slots`,
                    {
                        params: { date: selectedDate },
                        headers: { Authorization: `Bearer ${token}` },
                    }
                );
                setPreviewSlots(res.data?.data || []);
            } catch (e) {
                console.log(e);
                setPreviewSlots([]);
            } finally {
                setLoadingPreview(false);
            }
        };
        fetchPreview();
    }, [manageOpen, doctorData?._id, selectedDate]);
    async function fetchDoctor() {
            try {
                const token = await auth.currentUser.getIdToken();
                console.log(token);
            const res = await axios.get(
                    `${import.meta.env.VITE_SERVER_URL}/api/doctor/get-doctor/${user.uid}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            console.log(res.data.data);
            setDoctorData(res.data.data);
            } catch (error) {
            console.log(error);
            } finally {
            setLoading(false);
            }
        }

    // Save location once when component renders (only if not already saved)
    useEffect(() => {
        const saveLocation = async () => {
            // Only save if location hasn't been saved yet and doctor data is loaded
            if (locationSaved || !user || !doctorData) return;

            // Check if location already exists in doctorData
            if (doctorData.location?.latitude && doctorData.location?.longitude) {
                setLocationSaved(true);
                return;
            }

            // Check if geolocation is available
            if (!navigator.geolocation) {
                console.warn("Geolocation is not supported by this browser.");
                return;
            }

            try {
                const position = await new Promise((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(resolve, reject, {
                        enableHighAccuracy: true,
                        timeout: 10000,
                        maximumAge: 0, // Don't use cached location
                    });
                });

                const { latitude, longitude } = position.coords;
                console.log("Doctor location obtained:", latitude, longitude);

                // Save to backend
                const token = await auth.currentUser.getIdToken();
                await axios.put(
                    `${import.meta.env.VITE_SERVER_URL}/api/doctor/${user.uid}/location`,
                    { latitude, longitude },
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            "Content-Type": "application/json",
                        },
                    }
                );

                console.log("Doctor location saved successfully");
                setLocationSaved(true);

                // Update doctorData with new location
                setDoctorData((prev) => ({
                    ...prev,
                    location: { latitude, longitude },
                }));
            } catch (error) {
                if (error.code === error.PERMISSION_DENIED) {
                    console.warn("User denied geolocation permission");
                } else if (error.code === error.POSITION_UNAVAILABLE) {
                    console.warn("Location information unavailable");
                } else if (error.code === error.TIMEOUT) {
                    console.warn("Location request timed out");
                } else {
                    console.error("Error saving doctor location:", error);
                }
            }
        };

        // Only run if doctorData is loaded and location hasn't been saved
        if (doctorData && !locationSaved) {
            saveLocation();
        }
    }, [user, doctorData, locationSaved, getToken]);

    const openManageSchedule = async () => {
        try {
            const token = await getToken();
            const res = await axios.get(`${import.meta.env.VITE_SERVER_URL}/api/doctor/availability`, {
                headers: { Authorization: `Bearer ${token}` },
                params: { clerkUserId: user.uid },
            });
            const arr = Array.isArray(res.data?.data) ? res.data.data : [];
            const map = {};
            for (const r of arr) {
                if (!map[r.day]) map[r.day] = [];
                map[r.day].push({ startTime: r.startTime, endTime: r.endTime });
            }
            setAvailabilityByDay(map);
            setBlackouts(doctorData?.blackouts || []);
            setManageOpen(true);
        } catch (e) {
            console.log(e);
            setAvailabilityByDay({});
            setBlackouts(doctorData?.blackouts || []);
            setManageOpen(true);
        }
    };

    // Helpers for next 7 days (display context only)
    const getNext7Days = () => {
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        const days = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(start);
            d.setDate(start.getDate() + i);
            const dayName = d.toLocaleDateString("en-US", { weekday: "long" });
            const dateStr = toLocalYMD(d); // Local YYYY-MM-DD
            days.push({ dayName, dateStr });
        }
        return days;
    };
    const formatShort = (dateStr) =>
        fromYMD(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });

    const toMinutesLocal = (hhmm) => {
        if (!hhmm || typeof hhmm !== "string") return NaN;
        const [h, m] = hhmm.split(":").map(Number);
        if (Number.isNaN(h) || Number.isNaN(m)) return NaN;
        return h * 60 + m;
    };

    const saveAvailability = async () => {
        try {
            setSavingAvail(true);
            const token = await getToken();
            const payload = [];
            const days = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
            // Validate ranges before building payload
            const invalid = [];
            for (const day of days) {
                const ranges = availabilityByDay[day] || [];
                for (const r of ranges) {
                    if (r?.startTime && r?.endTime) {
                        const s = toMinutesLocal(r.startTime);
                        const e = toMinutesLocal(r.endTime);
                        if (Number.isNaN(s) || Number.isNaN(e) || e <= s || e - s < 20) {
                            invalid.push({ day, startTime: r.startTime, endTime: r.endTime });
                        } else {
                            payload.push({ day, startTime: r.startTime, endTime: r.endTime });
                        }
                    }
                }
            }
            if (invalid.length > 0) {
                setAvailValidationMsg("Please fix invalid ranges (end must be after start, at least 20 minutes). No changes were saved.");
                return;
            }
            setAvailValidationMsg("");
            const res = await axios.post(`${import.meta.env.VITE_SERVER_URL}/api/doctor/availability`, { availableSlots: payload, clerkUserId: user.uid }, {
                headers: { Authorization: `Bearer ${token}` },
            });
            // Update local state from response (array of {day,startTime,endTime})
            const arr = Array.isArray(res.data?.data) ? res.data.data : [];
            const map = {};
            for (const r of arr) {
                if (!map[r.day]) map[r.day] = [];
                map[r.day].push({ startTime: r.startTime, endTime: r.endTime });
            }
            setAvailabilityByDay(map);
            // Close modal
            setManageOpen(false);
        } catch (e) {
            console.log(e);
        } finally {
            setSavingAvail(false);
        }
    };

    const addBlackout = async () => {
        if (!blackoutForm.date || !blackoutForm.startTime || !blackoutForm.endTime) return;
        try {
            setSavingBlk(true);
            const token = await getToken();
            const res = await axios.post(`${import.meta.env.VITE_SERVER_URL}/api/doctor/blackouts`, { ...blackoutForm, clerkUserId: user.uid }, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setBlackouts(res.data?.data || []);
            setBlackoutForm({ date: "", startTime: "", endTime: "" });
        } catch (e) {
            console.log(e);
        } finally {
            setSavingBlk(false);
        }
    };

    const removeBlackout = async (index) => {
        try {
            const token = await getToken();
            const res = await axios.delete(`${import.meta.env.VITE_SERVER_URL}/api/doctor/blackouts/${index}`, {
                headers: { Authorization: `Bearer ${token}` },
                params: { clerkUserId: user.uid },
            });
            setBlackouts(res.data?.data || []);
        } catch (e) {
            console.log(e);
        }
    };

    const getGreeting = () => {
        const hour = currentTime.getHours();
        if (hour < 12) return "Good morning";
        if (hour < 17) return "Good afternoon";
        return "Good evening";
    };

    // Local helpers to avoid UTC shifting
    const fromYMD = (s) => {
        if (s instanceof Date) return new Date(s);
        if (typeof s !== "string") return new Date();
        const [yy, mm, dd] = s.split("-").map(Number);
        return new Date(yy, (mm || 1) - 1, dd || 1);
    };
    const toLocalYMD = (d) => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${y}-${m}-${day}`;
    };

    const formatDate = (dateInput) => {
        const d = dateInput instanceof Date ? dateInput : fromYMD(dateInput);
        return d.toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };

    const getVerificationStatusColor = (status) => {
        switch (status) {
            case "verified":
                return "text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-300";
            case "pending":
                return "text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-300";
            case "rejected":
                return "text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-300";
            case "new":
                return "text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300";
            default:
                return "text-gray-600 bg-gray-100 dark:bg-gray-900/30 dark:text-gray-300";
        }
    };

    const getVerificationIcon = (status) => {
        switch (status) {
            case "verified":
                return <CheckCircle className="w-4 h-4" />;
            case "pending":
                return <Clock className="w-4 h-4" />;
            case "rejected":
                return <XCircle className="w-4 h-4" />;
            case "new":
                return <Bell className="w-4 h-4" />;
            default:
                return <AlertCircle className="w-4 h-4" />;
        }
    };

    if (loading) return <Loader />;

    if (!doctorData) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-light-background to-light-background-secondary dark:from-dark-background dark:to-dark-background-secondary">
                <div className="max-w-8xl mx-auto p-4">
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-light-primary-text dark:text-dark-primary-text mb-2">
                        Doctor Profile Not Found
                    </h3>
                    <p className="text-light-secondary-text dark:text-dark-secondary-text">
                        Please complete your doctor registration first.
                    </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-light-background to-light-background-secondary dark:from-dark-background dark:to-dark-background-secondary">
            <div className="max-w-8xl mx-auto">
                {/* Enhanced Header with Gradient */}
                <div className="relative mb-4 overflow-hidden rounded-3xl dark:bg-dark-bg bg-light-surface p-8 text-light-primary-text dark:text-dark-primary-text">
                    <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex items-center space-x-6 mb-6 lg:mb-0">
                            <div className="relative">
                                <img
                                    src={user.imageUrl}
                                    alt="Profile"
                                    className="w-30 h-30 rounded-full object-cover border-4 border-white/30 shadow-lg"
                                />
                                <div className="absolute -bottom-0 -right-0 w-8 h-8 bg-dark-surface rounded-full flex items-center justify-center">
                                    <Stethoscope className="w-5 h-5 text-white" />
                                </div>
                            </div>
                            <div>
                                <div className="flex flex-col">
                                    <h1 className="text-4xl font-bold">
                                        {getGreeting()}, Dr.{" "}
                                        {doctorData.fullName}!
                                </h1>
                                    <p className="text-light-secondary-text text-lg">
                                        Here's your practice overview today
                                </p>
                            </div>
                                <div className="flex items-center space-x-4 mt-4">
                                    <span className="text-sm">
                                        {formatDate(currentTime)}
                            </span>
                        </div>
                    </div>
                </div>
                        <div className="flex items-center space-x-4">
                            <div className="bg-light-bg dark:bg-dark-surface backdrop-blur-sm rounded-2xl p-4 text-center">
                                <Activity className="w-8 h-8 mx-auto mb-2" />
                                <p className="text-sm font-medium">Rating</p>
                                <p className="text-2xl font-bold">
                                        {doctorData.rating?.average || 0}
                                    </p>
                                </div>
                            <div className="bg-light-bg dark:bg-dark-surface backdrop-blur-sm rounded-2xl p-4 text-center">
                                <TrendingUp className="w-8 h-8 mx-auto mb-2" />
                                <p className="text-sm font-medium">
                                    Experience
                                </p>
                                <p className="text-2xl font-bold">
                                    {doctorData.experience}y
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Dashboard Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 mb-4">
                    {/* Professional Information Card */}
                    <div className="lg:col-span-2 dark:bg-dark-bg bg-light-surface rounded-2xl p-6 shadow-md hover:shadow-xl transition-all duration-200">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold flex items-center">
                                <User className="w-6 h-6 mr-3 text-light-primary dark:text-dark-primary" />
                                <p className="text-light-primary-text dark:text-dark-primary-text">
                                    Professional Information
                                </p>
                                </h2>
                            <button className="p-2 rounded-lg hover:bg-light-bg dark:hover:bg-dark-surface transition-colors">
                                <Edit className="w-5 h-5 text-light-secondary-text dark:text-dark-secondary-text" />
                            </button>
                            </div>
                                <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                    <label className="text-sm font-medium text-light-secondary-text dark:text-dark-secondary-text">
                                            Full Name
                                        </label>
                                    <p className="text-light-primary-text dark:text-dark-primary-text font-medium">
                                            Dr. {doctorData.fullName}
                                        </p>
                                    </div>
                                <div>
                                    <label className="text-sm font-medium text-light-secondary-text dark:text-dark-secondary-text">
                                        Specialty
                                    </label>
                                    <p className="text-light-primary-text dark:text-dark-primary-text capitalize">
                                        {doctorData.specialty}
                                    </p>
                                </div>
                                    <div>
                                    <label className="text-sm font-medium text-light-secondary-text dark:text-dark-secondary-text">
                                            Qualifications
                                        </label>
                                    <p className="text-light-primary-text dark:text-dark-primary-text">
                                            {doctorData.qualifications}
                                        </p>
                                    </div>
                                    <div>
                                    <label className="text-sm font-medium text-light-secondary-text dark:text-dark-secondary-text">
                                            Registration Number
                                        </label>
                                    <p className="text-light-primary-text dark:text-dark-primary-text font-mono">
                                            {doctorData.registrationNumber}
                                        </p>
                                    </div>
                                    <div>
                                    <label className="text-sm font-medium text-light-secondary-text dark:text-dark-secondary-text">
                                            Experience
                                        </label>
                                    <p className="text-light-primary-text dark:text-dark-primary-text">
                                            {doctorData.experience} years
                                        </p>
                                    </div>
                                    <div>
                                    <label className="text-sm font-medium text-light-secondary-text dark:text-dark-secondary-text">
                                            Affiliation
                                        </label>
                                    <p className="text-light-primary-text dark:text-dark-primary-text">
                                            {doctorData.affiliation ||
                                                "Not specified"}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                    {/* Contact Information Card */}
                    <div className="dark:bg-dark-bg bg-light-surface rounded-2xl p-6 shadow-md hover:shadow-xl transition-all duration-200">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold flex items-center">
                                <Mail className="w-5 h-5 mr-3 text-light-primary dark:text-dark-primary" />
                                <p className="text-light-primary-text dark:text-dark-primary-text">
                                    Contact
                                </p>
                                </h2>
                            </div>
                            <div className="space-y-4">
                            <div className="flex items-center space-x-3">
                                <Mail className="w-4 h-4 text-light-secondary-text dark:text-dark-secondary-text" />
                                <span className="text-light-primary-text dark:text-dark-primary-text text-sm">
                                        {doctorData.email}
                                    </span>
                                </div>
                            <div className="flex items-center space-x-3">
                                <Phone className="w-4 h-4 text-light-secondary-text dark:text-dark-secondary-text" />
                                <span className="text-light-primary-text dark:text-dark-primary-text text-sm">
                                        {doctorData.phone}
                                    </span>
                                </div>
                                {doctorData.address && (
                                <div className="flex items-start space-x-3">
                                    <MapPin className="w-4 h-4 text-light-secondary-text dark:text-dark-secondary-text mt-0.5" />
                                        <div>
                                        <p className="text-light-primary-text dark:text-dark-primary-text text-sm">
                                            {doctorData.address}
                                        </p>
                                        <p className="text-light-secondary-text dark:text-dark-secondary-text text-xs">
                                            {doctorData.district},{" "}
                                            {doctorData.state}
                                            </p>
                                        </div>
                                    </div>
                                )}
                        </div>
                    </div>

                    {/* Verification Status Card */}
                    <div className="dark:bg-dark-bg bg-light-surface rounded-2xl p-6 shadow-md hover:shadow-xl transition-all duration-200">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold flex items-center">
                                <Shield className="w-5 h-5 mr-3 text-light-primary dark:text-dark-primary" />
                                <p className="text-light-primary-text dark:text-dark-primary-text">
                                    Status
                                </p>
                            </h2>
                        </div>
                            <div className="text-center">
                                <div
                                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-3 ${getVerificationStatusColor(
                                        doctorData.verificationStatus
                                    )}`}>
                                    {getVerificationIcon(
                                        doctorData.verificationStatus
                                    )}
                                {doctorData.verificationStatus}
                                </div>
                            <p className="text-sm text-light-secondary-text dark:text-dark-secondary-text">
                                {doctorData.verificationStatus === "new" &&
                                    "Your profile is newly created. Please complete verification to start practicing."}
                                {doctorData.verificationStatus === "pending" &&
                                        "Your profile is under review. We'll notify you once verified."}
                                {doctorData.verificationStatus === "verified" &&
                                        "Your profile has been verified and is live."}
                                {doctorData.verificationStatus === "rejected" &&
                                        "Please check the verification notes and resubmit your documents."}
                                </p>
                            </div>
                        </div>
                </div>

                {/* Second Row */}
                {doctorData.verificationStatus === "new" ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                        {/* Quick Start Card */}
                        <div className="dark:bg-dark-bg bg-light-surface rounded-2xl p-6 shadow-lg border-l-4 border-blue-500">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                                    <Edit className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-light-primary-text dark:text-dark-primary-text">
                                        Get Started
                                    </h2>
                                    <p className="text-sm text-light-secondary-text dark:text-dark-secondary-text">
                                        Complete setup to start earning
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-4">
                                    <div className="font-semibold flex gap-2 items-center text-blue-800 dark:text-blue-200 mb-3">
                                        <GitBranchPlus/> <span>Start Earning in 3 Steps</span>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-sm">
                                            <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                                                <span className="text-white text-xs font-bold">
                                                    1
                                                </span>
                                            </div>
                                            <span className="text-blue-700 dark:text-blue-300">
                                                Add Account Details
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm">
                                            <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                                                <span className="text-white text-xs font-bold">
                                                    2
                                                </span>
                                            </div>
                                            <span className="text-blue-700 dark:text-blue-300">
                                                Set consultation fee
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm">
                                            <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                                                <span className="text-white text-xs font-bold">
                                                    3
                                                </span>
                                            </div>
                                            <span className="text-blue-700 dark:text-blue-300">
                                                Add availability
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                        <IndianRupee className="w-5 h-5 text-green-600 mx-auto mb-1" />
                                        <p className="text-sm font-bold text-green-800 dark:text-green-200">
                                            ₹50-1000
                                        </p>
                                        <p className="text-xs text-green-600 dark:text-green-400">
                                            per consultation
                                        </p>
                                    </div>
                                    <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                                        <Users className="w-5 h-5 text-purple-600 mx-auto mb-1" />
                                        <p className="text-sm font-bold text-purple-800 dark:text-purple-200">
                                            50+ patients
                                        </p>
                                        <p className="text-xs text-purple-600 dark:text-purple-400">
                                            monthly
                                        </p>
                                    </div>
                                </div>

                                <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors text-sm">
                                    Complete Setup
                                </button>
                            </div>
                        </div>

                        {/* Verification Info Card */}
                        <div className="dark:bg-dark-bg bg-light-surface rounded-2xl p-6 shadow-lg border-l-4 border-yellow-500">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center">
                                    <Clock className="w-5 h-5 text-yellow-600" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-light-primary-text dark:text-dark-primary-text">
                                        Verification
                                    </h2>
                                    <p className="text-sm text-light-secondary-text dark:text-dark-secondary-text">
                                        Takes 24 hours to verify
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
                                    <div className="font-semibold flex gap-2 items-center text-yellow-800 dark:text-yellow-200 mb-3">
                                        <CalendarClock/> <span>What happens next?</span>
                                    </div>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                                            <span className="text-yellow-700 dark:text-yellow-300">
                                                Add your Details
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                                            <span className="text-yellow-700 dark:text-yellow-300">
                                                We verify your credentials
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                                            <span className="text-yellow-700 dark:text-yellow-300">
                                                You're approved & can start
                                                earning
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-gray-50 dark:bg-gray-900/20 rounded-lg p-3">
                                    <h4 className="font-semibold flex gap-2 items-center text-gray-800 dark:text-gray-200 mb-2 text-sm">
                                        <File/> <span>You'll need:</span>
                                    </h4>
                                    <ul className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                                        <li>- Personal Details</li>
                                        <li>- Bank Details for payments</li>
                                    </ul>
                                </div>

                                <div className="flex items-center gap-2 text-xs text-yellow-700 dark:text-yellow-300 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-2">
                                    <Bell className="w-3 h-3" />
                                    <span>We'll notify you when ready</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-4">
                        {/* Rating & Reviews Card */}
                        <div className="dark:bg-dark-bg bg-light-surface rounded-2xl p-6 shadow-md hover:shadow-xl transition-all duration-200">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold flex items-center">
                                    <Star className="w-5 h-5 mr-3 text-light-primary dark:text-dark-primary" />
                                    <p className="text-light-primary-text dark:text-dark-primary-text">
                                        Rating & Reviews
                                    </p>
                                </h2>
                            </div>
                            <div className="text-center">
                                <div className="flex items-center justify-center gap-1 mb-2">
                                    <Star className="w-6 h-6 text-yellow-500 fill-current" />
                                    <span className="text-3xl font-bold text-light-primary-text dark:text-dark-primary-text">
                                        {doctorData.rating?.average || 0}
                                    </span>
                                </div>
                                <p className="text-light-secondary-text dark:text-dark-secondary-text text-sm mb-4">
                                    Based on {doctorData.rating?.count || 0}{" "}
                                    reviews
                                </p>
                                <div className="bg-light-bg dark:bg-dark-surface rounded-lg p-3">
                                    <p className="text-sm text-light-secondary-text dark:text-dark-secondary-text">
                                        No reviews yet
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Consultation Fee Card */}
                        <div className="dark:bg-dark-bg bg-light-surface rounded-2xl p-6 shadow-md hover:shadow-xl transition-all duration-200">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold flex items-center">
                                    <DollarSign className="w-5 h-5 mr-3 text-light-primary dark:text-dark-primary" />
                                    <p className="text-light-primary-text dark:text-dark-primary-text">
                                        Consultation Fee
                                    </p>
                                </h2>
                            </div>
                            <div className="text-center">
                                <p className="text-3xl font-bold text-light-primary-text dark:text-dark-primary-text mb-2">
                                    ₹{doctorData.consultationFee || 0}
                                </p>
                                <p className="text-light-secondary-text dark:text-dark-secondary-text text-sm">
                                    Per consultation
                                </p>
                                <button className="mt-4 px-4 py-2 bg-light-primary dark:bg-dark-primary text-white rounded-lg hover:bg-light-primary-dark dark:hover:bg-dark-primary-dark transition-colors text-sm">
                                    Update Fee
                                </button>
                            </div>
                        </div>

                        {/* Quick Actions Card */}
                        <div className="dark:bg-dark-bg bg-light-surface rounded-2xl p-6 shadow-md hover:shadow-xl transition-all duration-200">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold flex items-center">
                                    <Settings className="w-5 h-5 mr-3 text-light-primary dark:text-dark-primary" />
                                    <p className="text-light-primary-text dark:text-dark-primary-text">
                                        Quick Actions
                                    </p>
                                </h2>
                            </div>
                            <div className="space-y-3">
                                <button onClick={openManageSchedule} className="w-full flex items-center gap-3 p-3 rounded-lg bg-light-bg dark:bg-dark-surface hover:bg-light-primary/10 dark:hover:bg-dark-primary/10 transition-colors">
                                    <Calendar className="w-4 h-4 text-light-primary dark:text-dark-primary" />
                                    <span className="text-light-primary-text dark:text-dark-primary-text text-sm">
                                        Manage Schedule
                                    </span>
                                </button>
                                <button className="w-full flex items-center gap-3 p-3 rounded-lg bg-light-bg dark:bg-dark-surface hover:bg-light-primary/10 dark:hover:bg-dark-primary/10 transition-colors">
                                    <Users className="w-4 h-4 text-light-primary dark:text-dark-primary" />
                                    <span className="text-light-primary-text dark:text-dark-primary-text text-sm">
                                        View Patients
                                    </span>
                                </button>
                                <button className="w-full flex items-center gap-3 p-3 rounded-lg bg-light-bg dark:bg-dark-surface hover:bg-light-primary/10 dark:hover:bg-dark-primary/10 transition-colors">
                                    <Edit className="w-4 h-4 text-light-primary dark:text-dark-primary" />
                                    <span className="text-light-primary-text dark:text-dark-primary-text text-sm">
                                        Edit Profile
                                    </span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Third Row - Languages and Additional Info */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-4">
                    {/* Languages Card */}
                    <div className="dark:bg-dark-bg bg-light-surface rounded-2xl p-6 shadow-md hover:shadow-xl transition-all duration-200">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold flex items-center">
                                <Globe className="w-5 h-5 mr-3 text-light-primary dark:text-dark-primary" />
                                <p className="text-light-primary-text dark:text-dark-primary-text">
                                        Languages
                                </p>
                            </h2>
                        </div>
                                    <div className="flex flex-wrap gap-2">
                            {doctorData.languages &&
                            doctorData.languages.length > 0 ? (
                                doctorData.languages.map((language, index) => (
                                                <span
                                                    key={index}
                                        className="px-3 py-1 bg-light-primary/10 dark:bg-dark-primary/10 text-light-primary dark:text-dark-primary rounded-full text-sm">
                                                    {language}
                                                </span>
                                ))
                            ) : (
                                <p className="text-light-secondary-text dark:text-dark-secondary-text text-sm">
                                    No languages specified
                                </p>
                                        )}
                                    </div>
                                </div>

                    {/* Telemedicine Status Card */}
                    <div className="dark:bg-dark-bg bg-light-surface rounded-2xl p-6 shadow-md hover:shadow-xl transition-all duration-200">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold flex items-center">
                                <Stethoscope className="w-5 h-5 mr-3 text-light-primary dark:text-dark-primary" />
                                <p className="text-light-primary-text dark:text-dark-primary-text">
                                    Telemedicine
                                </p>
                            </h2>
                        </div>
                        <div className="text-center">
                            <div className="flex items-center justify-center gap-2 mb-3">
                                {doctorData.telemedicineConsent ? (
                                    <CheckCircle className="w-6 h-6 text-green-500" />
                                ) : (
                                    <XCircle className="w-6 h-6 text-red-500" />
                                )}
                                <span className="text-lg font-semibold text-light-primary-text dark:text-dark-primary-text">
                                    {doctorData.telemedicineConsent
                                        ? "Enabled"
                                        : "Disabled"}
                                </span>
                            </div>
                            <p className="text-light-secondary-text dark:text-dark-secondary-text text-sm">
                                {doctorData.telemedicineConsent
                                    ? "You can provide online consultations"
                                    : "Enable telemedicine to provide online consultations"}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
            {manageOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="w-full max-w-4xl rounded-2xl bg-light-surface dark:bg-dark-bg p-6 shadow-xl">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-semibold text-light-primary-text dark:text-dark-primary-text">Manage Schedule</h3>
                            <button onClick={() => setManageOpen(false)} className="rounded-full p-2 hover:bg-light-primary/10 dark:hover:bg-dark-primary/10">
                                <XCircle className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-4">
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-light-secondary-text dark:text-dark-secondary-text">Date</span>
                                <input
                                    type="date"
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                    className="rounded-md border border-light-secondary-text/20 dark:border-dark-secondary-text/20 bg-light-background dark:bg-dark-background px-2 py-1 text-sm"
                                />
                            </div>
                            <div className="text-sm font-medium text-light-primary-text dark:text-dark-primary-text">
                                {formatDate(selectedDate)}
                            </div>
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div>
                                <h4 className="font-semibold mb-3 text-light-primary-text dark:text-dark-primary-text">Weekly Availability</h4>
                                <div className="space-y-3">
                                    {getNext7Days().map(({ dayName, dateStr }) => (
                                        <div key={dateStr} className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <div className="text-sm font-medium text-light-secondary-text dark:text-dark-secondary-text w-48">
                                                    {dayName}
                                                    <span className="ml-2 text-xs text-light-secondary-text dark:text-dark-secondary-text">{formatShort(dateStr)}</span>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setAvailabilityByDay((p) => ({
                                                            ...p,
                                                            [dayName]: [...(p[dayName] || []), { startTime: "", endTime: "" }],
                                                        }))
                                                    }
                                                    className="text-xs px-2 py-1 rounded-md bg-light-bg dark:bg-dark-surface hover:bg-light-primary/10 dark:hover:bg-dark-primary/10"
                                                >
                                                    + Add range
                                                </button>
                                            </div>
                                            {(availabilityByDay[dayName] && availabilityByDay[dayName].length > 0
                                                ? availabilityByDay[dayName]
                                                : [{ startTime: "", endTime: "" }]
                                            ).map((row, idx) => (
                                                <div key={`${dayName}-${idx}`} className="flex items-center gap-2">
                                                    <input
                                                        type="time"
                                                        value={row.startTime || ""}
                                                        onChange={(e) =>
                                                            setAvailabilityByDay((p) => {
                                                                const list = [...(p[dayName] || Array(1).fill({ startTime: "", endTime: "" }))];
                                                                list[idx] = { ...list[idx], startTime: e.target.value };
                                                                return { ...p, [dayName]: list };
                                                            })
                                                        }
                                                        className="flex-1 rounded-md border border-light-secondary-text/20 dark:border-dark-secondary-text/20 bg-light-background dark:bg-dark-background px-2 py-1 text-sm"
                                                    />
                                                    <span className="text-sm">to</span>
                                                    <input
                                                        type="time"
                                                        value={row.endTime || ""}
                                                        onChange={(e) =>
                                                            setAvailabilityByDay((p) => {
                                                                const list = [...(p[dayName] || Array(1).fill({ startTime: "", endTime: "" }))];
                                                                list[idx] = { ...list[idx], endTime: e.target.value };
                                                                return { ...p, [dayName]: list };
                                                            })
                                                        }
                                                        className="flex-1 rounded-md border border-light-secondary-text/20 dark:border-dark-secondary-text/20 bg-light-background dark:bg-dark-background px-2 py-1 text-sm"
                                                    />
                                                    {(availabilityByDay[dayName]?.length || 0) > 0 && (
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                setAvailabilityByDay((p) => {
                                                                    const list = [...(p[dayName] || [])];
                                                                    list.splice(idx, 1);
                                                                    return { ...p, [dayName]: list };
                                                                })
                                                            }
                                                            className="text-xs px-2 py-1 rounded-md bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-300"
                                                        >
                                                            Remove
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-4">
                                    <button disabled={savingAvail} onClick={saveAvailability} className="px-4 py-2 rounded-md bg-light-primary text-white text-sm disabled:opacity-50">
                                        {savingAvail ? "Saving..." : "Save Availability"}
                                    </button>
                                    {availValidationMsg && (
                                        <div className="mt-2 text-xs text-red-600 dark:text-red-400">{availValidationMsg}</div>
                                    )}
                                </div>
                            </div>
                            <div>
                                <h4 className="font-semibold mb-3 text-light-primary-text dark:text-dark-primary-text">Preview (20‑min slots)</h4>
                                <div className="min-h-[44px] mb-6">
                                    {loadingPreview ? (
                                        <div className="text-sm text-light-secondary-text dark:text-dark-secondary-text">Loading slots...</div>
                                    ) : previewSlots.length > 0 ? (
                                        <div className="flex flex-wrap gap-2">
                                            {previewSlots.map((s) => (
                                                <span key={s} className="px-3 py-1 rounded-md text-sm bg-light-bg dark:bg-dark-surface border border-light-secondary-text/20 dark:border-dark-secondary-text/20 text-light-primary-text dark:text-dark-primary-text">{s}</span>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-sm text-light-secondary-text dark:text-dark-secondary-text">No slots for {formatDate(selectedDate)}</div>
                                    )}
                                </div>
                                <h4 className="font-semibold mb-3 text-light-primary-text dark:text-dark-primary-text">Blackout (Freeze) Windows</h4>
                                <div className="flex gap-2 mb-3">
                                    <input
                                        type="date"
                                        value={blackoutForm.date}
                                        onChange={(e) => setBlackoutForm((p) => ({ ...p, date: e.target.value }))}
                                        className="flex-1 rounded-md border border-light-secondary-text/20 dark:border-dark-secondary-text/20 bg-light-background dark:bg-dark-background px-2 py-1 text-sm"
                                    />
                                    <input
                                        type="time"
                                        value={blackoutForm.startTime}
                                        onChange={(e) => setBlackoutForm((p) => ({ ...p, startTime: e.target.value }))}
                                        className="w-28 rounded-md border border-light-secondary-text/20 dark:border-dark-secondary-text/20 bg-light-background dark:bg-dark-background px-2 py-1 text-sm"
                                    />
                                    <input
                                        type="time"
                                        value={blackoutForm.endTime}
                                        onChange={(e) => setBlackoutForm((p) => ({ ...p, endTime: e.target.value }))}
                                        className="w-28 rounded-md border border-light-secondary-text/20 dark:border-dark-secondary-text/20 bg-light-background dark:bg-dark-background px-2 py-1 text-sm"
                                    />
                                    <button disabled={savingBlk} onClick={addBlackout} className="px-3 py-1.5 rounded-md bg-light-primary text-white text-sm disabled:opacity-50">{savingBlk ? "Adding..." : "Add"}</button>
                                </div>
                                <div className="space-y-2 max-h-64 overflow-y-auto">
                                    {blackouts && blackouts.length > 0 ? (
                                        blackouts.map((b, i) => (
                                            <div key={`${b.date}-${b.startTime}-${i}`} className="flex items-center justify-between rounded-md border border-light-secondary-text/20 dark:border-dark-secondary-text/20 px-3 py-2">
                                                <div className="text-sm text-light-primary-text dark:text-dark-primary-text">
                                                    {b.date} • {b.startTime} - {b.endTime}
                                                </div>
                                                <button onClick={() => removeBlackout(i)} className="text-red-600 text-sm">Remove</button>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-sm text-light-secondary-text dark:text-dark-secondary-text">No blackouts added.</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );

}

export default DocContent;
