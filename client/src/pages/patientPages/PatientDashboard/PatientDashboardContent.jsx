import { useAuth, useUser } from "@clerk/clerk-react";
import axios from "axios";
import {
    Activity,
    AlertCircle,
    Bell,
    Calendar as CalendarIcon,
    CheckCircle,
    ChevronRight,
    FileText as FileTextIcon,
    Heart,
    Pill,
    PillIcon,
    Plus,
    Settings,
    Stethoscope,
    TabletIcon,
    TrendingUp,
    User,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import Calendar from "../../../components/Dashboard/Calendar";
import Loader from "../../../components/main/Loader";
import { useNavigate } from "react-router-dom";

const PatientDashboardContent = () => {
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [medOpen, setMedOpen] = useState(false);
    const [prescriptions, setPrescriptions] = useState([]); // unique list of prescribed items
    const [reminders, setReminders] = useState([]);
    const [savingMap, setSavingMap] = useState({});

    const { user } = useUser();
    const { getToken } = useAuth();
    const [locationSaved, setLocationSaved] = useState(false);

    const navigate = useNavigate();

    useEffect(() => {
        fetchUserData();
    }, [user, getToken]);

    // Save location once when component renders (only if not already saved)
    useEffect(() => {
        const saveLocation = async () => {
            // Only save if location hasn't been saved yet and user data is loaded
            if (locationSaved || !user || !userData) return;

            // Check if location already exists in userData
            if (userData.location?.latitude && userData.location?.longitude) {
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
                console.log("Location obtained:", latitude, longitude);

                // Save to backend
                const token = await getToken();
                await axios.put(
                    `${import.meta.env.VITE_SERVER_URL}/api/patient/${user.id
                    }/location`,
                    { latitude, longitude },
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            "Content-Type": "application/json",
                        },
                    }
                );

                console.log("Location saved successfully");
                setLocationSaved(true);

                // Update userData with new location
                setUserData((prev) => ({
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
                    console.error("Error saving location:", error);
                }
            }
        };

        // Only run if userData is loaded and location hasn't been saved
        if (userData && !locationSaved) {
            saveLocation();
        }
    }, [user, userData, locationSaved, getToken]);

    const fetchUserData = async () => {
        if (!user) return;
        try {
            setLoading(true);
            const token = await getToken();
            const response = await axios.get(
                `${import.meta.env.VITE_SERVER_URL}/api/patient/get-patient/${user.id
                }`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            setUserData(response.data);
        } catch (error) {
            console.error(
                "Error fetching user data:",
                error.response?.data || error.message
            );
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };

    const getGreeting = () => {
        const hour = currentTime.getHours();
        if (hour < 12) return "Good morning";
        if (hour < 17) return "Good afternoon";
        return "Good evening";
    };

    const calculateAge = (dob) => {
        if (!dob) return "";
        const birthDate = new Date(dob);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    };

    // Medication reminder modal state and helpers

    if (loading) return <Loader />;

    const openMedicationModal = async () => {
        setMedOpen(true);
        try {
            const token = await getToken();

            // Fetch appointments (to collect prescriptions)
            const apptRes = await axios.get(
                `${import.meta.env.VITE_SERVER_URL}/api/appointment/patient/${user.id
                }`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            const allAppts = apptRes.data?.data || [];

            console.log("All appointments:", allAppts);

            // Flatten prescriptions and deduplicate by medicine+dosage
            const flat = [];
            const seen = new Set();
            for (const a of allAppts) {
                if (Array.isArray(a.prescription)) {
                    for (const item of a.prescription) {
                        const key = `${item.medicine || ""}::${item.dosage || ""
                            }`;
                        if (!seen.has(key) && item.medicine) {
                            seen.add(key);
                            flat.push({
                                medicine: item.medicine,
                                dosage: item.dosage || "",
                                frequency: item.frequency || "",
                            });
                        }
                    }
                }
            }
            setPrescriptions(flat);

            // Fetch already saved reminders
            const rRes = await axios.get(
                `${import.meta.env.VITE_SERVER_URL}/api/patient/${user.id
                }/reminders`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            setReminders(rRes.data.reminders || []);
        } catch (err) {
            console.error(
                "Error loading medication data:",
                err?.response?.data || err.message || err
            );
        }
    };

    console.log(userData)

    return (
        <div className="min-h-screen bg-gradient-to-br from-light-background to-light-background-secondary dark:from-dark-background dark:to-dark-background-secondary">
            <div className="max-w-8xl mx-auto md:px-0 px-3">
                {/* Enhanced Header with Gradient */}
                <div className="relative mb-4 overflow-hidden rounded-3xl dark:bg-dark-bg bg-light-surface md:p-6 p-4 text-light-primary-text dark:text-dark-primary-text">
                    <div className="relative z-10 flex items-center gap-4 md:gap-6">
                        <div className="relative">
                            <img
                                src={user.imageUrl}
                                alt="Profile"
                                className="h-16 w-16 md:h-20 md:w-20 rounded-full object-cover border-4 border-white/30 shadow-lg"
                            />
                            <div className="absolute -bottom-0 -right-0 w-7 h-7 bg-dark-surface rounded-full flex items-center justify-center">
                                <CheckCircle className="w-4 h-4 text-white" />
                            </div>
                        </div>
                        <div className="flex flex-col gap-1">
                            <p className="text-xs md:text-sm text-light-secondary-text dark:text-dark-secondary-text">
                                Patient Profile
                            </p>
                            <h1 className="text-lg md:text-2xl font-semibold">
                                {userData.fullName}
                            </h1>
                            <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs md:text-sm text-light-secondary-text dark:text-dark-secondary-text">
                                {userData.dob && (
                                    <span>Age {calculateAge(userData.dob)}</span>
                                )}
                                {userData.gender && (
                                    <span className="capitalize">{userData.gender}</span>
                                )}
                                <span>{formatDate(currentTime)}</span>
                            </div>
                            <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs md:text-sm text-light-secondary-text dark:text-dark-secondary-text">
                                {userData.phone && <span>{userData.phone}</span>}
                                {userData.district && <span>{userData.district}</span>}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Dashboard Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 mb-4">
                    {/* Personal Information Card */}
                    <div className="hidden lg:col-span-2 dark:bg-dark-bg bg-light-surface rounded-2xl md:p-6 p-4 py-6 shadow-md hover:shadow-xl transition-all duration-200">
                        <div className="flex items-center justify-between md:mb-6 mb-3">
                            <h2 className="md:text-2xl text-xl font-bold flex items-center">
                                <User className="w-6 h-6 md:mr-3 mr-1 text-light-primary dark:text-dark-primary" />
                                <p className="text-light-primary-text dark:text-dark-primary-text">
                                    Personal Information
                                </p>
                            </h2>
                            {/* <button className="p-2 rounded-lg bg-light-primary/10 dark:bg-dark-primary/10 text-light-primary dark:text-dark-primary hover:bg-light-primary/20 dark:hover:bg-dark-primary/20 transition-colors">
                                <Edit3 className="w-4 h-4" />
                            </button> */}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 md:gap-4 gap-2">
                            <div className="flex items-center md:p-3 px-3 gap-1 rounded-xl">
                                <span className="md:text-sm text-xs font-medium text-light-secondary-text dark:text-dark-secondary-text">
                                    Full Name:
                                </span>
                                <span className="md:text-sm text-xs font-semibold text-light-primary-text dark:text-dark-primary-text">
                                    {userData.fullName}
                                </span>
                            </div>
                            <div className="flex items-center  md:p-3 px-3 gap-1 rounded-xl">
                                <span className="md:text-sm text-xs font-medium text-light-secondary-text dark:text-dark-secondary-text">
                                    DOB:
                                </span>
                                <span className="md:text-sm text-xs font-semibold text-light-primary-text dark:text-dark-primary-text">
                                    {formatDate(userData.dob)}
                                </span>
                            </div>
                            <div className="flex items-center md:p-3 px-3 gap-1 rounded-xl">
                                <span className="md:text-sm text-xs font-medium text-light-secondary-text dark:text-dark-secondary-text">
                                    Age:
                                </span>
                                <span className="md:text-sm text-xs font-semibold text-light-primary-text dark:text-dark-primary-text">
                                    {calculateAge(userData.dob)}
                                </span>
                            </div>
                            <div className="flex items-center md:p-3 px-3 gap-1 rounded-xl">
                                <span className="md:text-sm text-xs font-medium text-light-secondary-text dark:text-dark-secondary-text">
                                    Gender:
                                </span>
                                <span className="md:text-sm text-xs font-semibold capitalize text-light-primary-text dark:text-dark-primary-text">
                                    {userData.gender}
                                </span>
                            </div>
                            <div className="flex items-center md:p-3 px-3 gap-1 rounded-xl">
                                <span className="md:text-sm text-xs font-medium text-light-secondary-text dark:text-dark-secondary-text">
                                    Phone:
                                </span>
                                <span className="md:text-sm text-xs font-semibold text-light-primary-text dark:text-dark-primary-text">
                                    {userData.phone}
                                </span>
                            </div>
                            <div className="flex md:p-3 px-3 gap-1 rounded-xl">
                                <span className="md:text-sm text-xs font-medium text-light-secondary-text dark:text-dark-secondary-text">
                                    District:
                                </span>
                                <span className="md:text-sm text-xs font-semibold text-light-primary-text dark:text-dark-primary-text">
                                    {userData.district}
                                </span>
                            </div>
                        </div>
                        <div className="flex md:p-3 px-3 gap-1 md:mt-4 mt-2 rounded-xl">
                            <span className="md:text-sm text-xs font-medium text-light-secondary-text dark:text-dark-secondary-text">
                                Address:
                            </span>
                            <span className="md:text-sm text-xs font-semibold text-light-primary-text dark:text-dark-primary-text">
                                {userData.address}
                            </span>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="hidden dark:bg-dark-bg bg-light-surface rounded-2xl py-6 px-4 shadow-md hover:shadow-xl transition-all duration-300">
                        <h3 className="md:text-2xl text-xl font-bold text-light-primary-text dark:text-dark-primary-text md:mb-6 mb-4 flex items-center">
                            <Plus className="w-5 h-5 md:mr-3 mr-1 text-light-primary dark:text-dark-primary" />
                            Quick Actions
                        </h3>
                        <div className="md:space-y-3">
                            {[
                                {
                                    icon: CalendarIcon,
                                    label: "Book Appointment",
                                    color: "bg-blue-500",
                                    navigateTo: "/patient/get-appointment",
                                },
                                {
                                    icon: Stethoscope,
                                    label: "AI Symptom Check",
                                    color: "bg-green-500",
                                    navigateTo: "/patient/symptom-checker",
                                },
                                {
                                    icon: Pill,
                                    label: "Medication Reminder",
                                    color: "bg-orange-500",
                                },
                                {
                                    icon: TabletIcon,
                                    label: "Get Medicine",
                                    color: "bg-purple-500",
                                    navigateTo: "/patient/medicine-search",
                                },
                            ].map((action, index) => (
                                <button
                                    onClick={async () => {
                                        if (action.navigateTo) {
                                            navigate(action.navigateTo);
                                            return;
                                        }
                                        if (
                                            action.label ===
                                            "Medication Reminder"
                                        ) {
                                            await openMedicationModal();
                                        }
                                    }}
                                    key={index}
                                    className="w-full flex items-center space-x-3 p-3 rounded-xl bg-light-background dark:bg-dark-background hover:bg-light-primary/5 dark:hover:bg-dark-primary/5 transition-colors group">
                                    <div
                                        className={`w-8 h-8 ${action.color} rounded-lg flex items-center justify-center text-white`}>
                                        <action.icon className="w-4 h-4" />
                                    </div>
                                    <span className="text-sm font-medium text-light-primary-text dark:text-dark-primary-text group-hover:text-light-primary dark:group-hover:text-dark-primary">
                                        {action.label}
                                    </span>
                                    <ChevronRight className="w-4 h-4 text-light-secondary-text dark:text-dark-secondary-text ml-auto" />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Medication Reminder Modal */}
                    {medOpen && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                            <div
                                className="absolute inset-0 bg-black/40"
                                onClick={() => setMedOpen(false)}
                            />
                            <div className="relative z-10 w-full max-w-3xl bg-white dark:bg-dark-bg rounded-2xl shadow-xl p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-xl font-bold">
                                        Medication Reminders
                                    </h3>
                                    <button
                                        onClick={() => setMedOpen(false)}
                                        className="px-3 py-1 rounded-md bg-slate-100 dark:bg-slate-800">
                                        Close
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <p className="text-sm text-muted mb-2">
                                            Prescribed medicines (collected from
                                            your appointments)
                                        </p>
                                        {prescriptions.length === 0 ? (
                                            <p className="text-sm text-muted">
                                                No prescriptions found in your
                                                appointments.
                                            </p>
                                        ) : (
                                            prescriptions.map((item, idx) => (
                                                <div
                                                    key={idx}
                                                    className="p-3 rounded-lg bg-light-background dark:bg-dark-background flex items-center gap-3">
                                                    <div className="flex-1">
                                                        <div className="font-semibold">
                                                            {item.medicine}
                                                        </div>
                                                        <div className="text-xs text-muted">
                                                            {item.dosage}{" "}
                                                            {item.frequency &&
                                                                `· ${item.frequency}`}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <input
                                                            type="time"
                                                            id={`t-${idx}`}
                                                            className="p-2 rounded-md bg-white dark:bg-slate-800 text-sm border"
                                                        />
                                                        <button
                                                            onClick={async () => {
                                                                const el =
                                                                    document.getElementById(
                                                                        `t-${idx}`
                                                                    );
                                                                const time =
                                                                    el?.value ||
                                                                    "";
                                                                const token =
                                                                    await getToken();
                                                                setSavingMap(
                                                                    (s) => ({
                                                                        ...s,
                                                                        [idx]: true,
                                                                    })
                                                                );
                                                                try {
                                                                    await axios.post(
                                                                        `${import.meta
                                                                            .env
                                                                            .VITE_SERVER_URL
                                                                        }/api/patient/${user.id
                                                                        }/reminders`,
                                                                        {
                                                                            medicine:
                                                                                item.medicine,
                                                                            dosage: item.dosage,
                                                                            frequency:
                                                                                item.frequency,
                                                                            time,
                                                                        },
                                                                        {
                                                                            headers:
                                                                            {
                                                                                Authorization: `Bearer ${token}`,
                                                                            },
                                                                        }
                                                                    );

                                                                    // refresh reminders
                                                                    const rRes =
                                                                        await axios.get(
                                                                            `${import.meta
                                                                                .env
                                                                                .VITE_SERVER_URL
                                                                            }/api/patient/${user.id
                                                                            }/reminders`,
                                                                            {
                                                                                headers:
                                                                                {
                                                                                    Authorization: `Bearer ${token}`,
                                                                                },
                                                                            }
                                                                        );
                                                                    setReminders(
                                                                        rRes
                                                                            .data
                                                                            .reminders ||
                                                                        []
                                                                    );
                                                                } catch (err) {
                                                                    console.error(
                                                                        "Failed to save reminder:",
                                                                        err
                                                                            ?.response
                                                                            ?.data ||
                                                                        err.message ||
                                                                        err
                                                                    );
                                                                } finally {
                                                                    setSavingMap(
                                                                        (
                                                                            s
                                                                        ) => ({
                                                                            ...s,
                                                                            [idx]: false,
                                                                        })
                                                                    );
                                                                }
                                                            }}
                                                            className="px-3 py-1 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700">
                                                            {savingMap[idx]
                                                                ? "Saving..."
                                                                : "Add Reminder"}
                                                        </button>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>

                                    <div>
                                        <p className="text-sm text-muted mb-2">
                                            Your saved reminders
                                        </p>
                                        {reminders.length === 0 ? (
                                            <p className="text-sm text-muted">
                                                No reminders saved yet
                                            </p>
                                        ) : (
                                            reminders.map((r) => (
                                                <div
                                                    key={r._id}
                                                    className="p-3 rounded-lg bg-light-background dark:bg-dark-background flex items-center gap-3 justify-between">
                                                    <div>
                                                        <div className="font-semibold">
                                                            {r.medicine}
                                                        </div>
                                                        <div className="text-xs text-muted">
                                                            {r.dosage}{" "}
                                                            {r.frequency &&
                                                                `· ${r.frequency}`}
                                                        </div>
                                                        <div className="text-xs text-muted">
                                                            Time:{" "}
                                                            {r.time ||
                                                                "Not set"}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={async () => {
                                                                try {
                                                                    const token =
                                                                        await getToken();
                                                                    await axios.delete(
                                                                        `${import.meta
                                                                            .env
                                                                            .VITE_SERVER_URL
                                                                        }/api/patient/${user.id
                                                                        }/reminders/${r._id
                                                                        }`,
                                                                        {
                                                                            headers:
                                                                            {
                                                                                Authorization: `Bearer ${token}`,
                                                                            },
                                                                        }
                                                                    );
                                                                    setReminders(
                                                                        (
                                                                            prev
                                                                        ) =>
                                                                            prev.filter(
                                                                                (
                                                                                    x
                                                                                ) =>
                                                                                    x._id !==
                                                                                    r._id
                                                                            )
                                                                    );
                                                                } catch (err) {
                                                                    console.error(
                                                                        "Failed to delete reminder",
                                                                        err
                                                                            ?.response
                                                                            ?.data ||
                                                                        err.message ||
                                                                        err
                                                                    );
                                                                }
                                                            }}
                                                            className="px-3 py-1 rounded-md bg-red-100 text-red-700 text-sm hover:bg-red-200">
                                                            Remove
                                                        </button>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Health Reminders */}
                    <div className="dark:bg-dark-bg bg-light-surface rounded-2xl p-6 shadow-md hover:shadow-xl transition-all duration-300">
                        <h3 className="md:text-2xl text-xl font-bold text-light-primary-text dark:text-dark-primary-text mb-6 flex items-center">
                            <Bell className="w-5 h-5 md:mr-3 mr-1 text-light-primary dark:text-dark-primary" />
                            Health Reminders
                        </h3>
                        <div className="space-y-3"></div>
                    </div>
                </div>

                {/* Secondary Information Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-4">
                    {/* Medical Details */}
                    <div className="dark:bg-dark-bg bg-light-surface rounded-2xl md:p-4 p-3 shadow-md hover:shadow-xl transition-all duration-300">
                        <h3 className="md:text-2xl text-xl font-bold text-light-primary-text dark:text-dark-primary-text mb-4 flex items-center">
                            <Heart className="w-5 h-5 md:mr-3 mr-1 text-light-primary dark:text-dark-primary" />
                            Medical Details
                        </h3>
                        <div className="md:space-y-3 space-y-1.5">
                            <div className="flex md:flex-row flex-col md:items-center items-start md:justify-between justify-start py-2 px-3 rounded-xl bg-light-background dark:bg-dark-background">
                                <span className="text-sm font-medium text-light-secondary-text dark:text-dark-secondary-text">
                                    Medical History
                                </span>
                                <span className="text-sm font-semibold text-light-primary-text dark:text-dark-primary-text">
                                    {userData.medicalHistory}
                                </span>
                            </div>
                            <div className="flex items-center justify-between py-2 px-3 rounded-xl bg-light-background dark:bg-dark-background">
                                <span className="text-sm font-medium text-light-secondary-text dark:text-dark-secondary-text">
                                    Govt. ID Type
                                </span>
                                <span className="text-sm font-semibold text-light-primary-text dark:text-dark-primary-text">
                                    {userData.govIdType}
                                </span>
                            </div>
                            <div className="flex items-center justify-between p-3 rounded-xl bg-light-background dark:bg-dark-background">
                                <span className="text-sm font-medium text-light-secondary-text dark:text-dark-secondary-text">
                                    Govt. ID Number
                                </span>
                                <span className="text-sm font-semibold text-light-primary-text dark:text-dark-primary-text">
                                    {userData.govIdNumber}
                                </span>
                            </div>
                            <div className="flex items-center justify-between p-3 rounded-xl bg-light-background dark:bg-dark-background">
                                <span className="text-sm font-medium text-light-secondary-text dark:text-dark-secondary-text">
                                    Telemedicine Consent
                                </span>
                                <span className="text-sm font-semibold text-light-primary-text dark:text-dark-primary-text">
                                    <CheckCircle className="w-5 h-5 text-green-400" />
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Emergency Contact */}
                    <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 rounded-2xl md:p-6 p-4 shadow-lg border border-red-200 dark:border-red-800/30 hover:shadow-xl transition-all duration-300">
                        <h3 className="md:text-2xl text-xl font-bold text-red-800 dark:text-red-200 mb-6 flex items-center">
                            <AlertCircle className="w-5 h-5 mr-2 text-red-600 dark:text-red-400" />
                            Emergency Contact
                        </h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-3 rounded-xl bg-white/50 dark:bg-black/20">
                                <span className="text-sm font-medium text-red-700 dark:text-red-300">
                                    Name:
                                </span>
                                <span className="text-sm font-bold text-red-800 dark:text-red-200">
                                    {userData.emergencyContactName}
                                </span>
                            </div>
                            <div className="flex items-center justify-between p-3 rounded-xl bg-white/50 dark:bg-black/20">
                                <span className="text-sm font-medium text-red-700 dark:text-red-300">
                                    Phone:
                                </span>
                                <span className="text-sm font-bold text-red-800 dark:text-red-200">
                                    {userData.emergencyContactPhone}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Account Information */}
                    <div className="hidden dark:bg-dark-bg bg-light-surface rounded-2xl md:p-6 p-4 shadow-md hover:shadow-xl transition-all duration-300">
                        <h3 className="md:text-2xl text-xl font-bold text-light-primary-text dark:text-dark-primary-text md:mb-6 mb-4 flex items-center">
                            <Settings className="w-5 h-5 mr-2 text-light-primary dark:text-dark-primary" />
                            Account Information
                        </h3>
                        <div className="md:space-y-3">
                            <div className="p-3 rounded-xl bg-light-background dark:bg-dark-background">
                                <p className="text-xs font-medium text-light-secondary-text dark:text-dark-secondary-text mb-1">
                                    Patient ID:
                                </p>
                                <p className="text-sm font-semibold text-light-primary-text dark:text-dark-primary-text truncate">
                                    {userData._id}
                                </p>
                            </div>
                            <div className="p-3 rounded-xl bg-light-background dark:bg-dark-background">
                                <p className="text-xs font-medium text-light-secondary-text dark:text-dark-secondary-text mb-1">
                                    User ID:
                                </p>
                                <p className="text-sm font-semibold text-light-primary-text dark:text-dark-primary-text truncate">
                                    {user.id}
                                </p>
                            </div>
                            <div className="p-3 rounded-xl bg-light-background dark:bg-dark-background">
                                <p className="text-xs font-medium text-light-secondary-text dark:text-dark-secondary-text mb-1">
                                    Account Created:
                                </p>
                                <p className="text-sm font-semibold text-light-primary-text dark:text-dark-primary-text truncate">
                                    {formatDate(userData.createdAt)}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Professional Event Calendar */}
                <Calendar patientId={userData._id} />
            </div>
        </div>
    );
};

export default PatientDashboardContent;
