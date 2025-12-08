import React, { useEffect, useMemo, useState } from "react";
import { useUser } from "../../../context/UserContext";
import axios from "axios";
import {
    CalendarClock,
    User2,
    Mail,
    Phone,
    MapPin,
    IndianRupee,
    Clock,
    Video,
    ExternalLink,
    Info,
    Eye,
} from "lucide-react";
import PatientDetailsDialog from "../../../components/Doctor/PatientDetailsDialog";
import { auth } from "../../../config/config";

const formatDateTime = (iso) => {
    try {
        const d = new Date(iso);
        const date = d.toLocaleDateString(undefined, {
            weekday: "short",
            year: "numeric",
            month: "short",
            day: "numeric",
        });
        const time = d.toLocaleTimeString(undefined, {
            hour: "2-digit",
            minute: "2-digit",
        });
        return { date, time, raw: d };
    } catch {
        return { date: "-", time: "-", raw: null };
    }
};

const timeUntil = (date) => {
    if (!date) return "-";
    const diffMs = date.getTime() - Date.now();
    if (diffMs <= 0) return "Now";
    const mins = Math.floor(diffMs / 60000);
    const hrs = Math.floor(mins / 60);
    const remMin = mins % 60;
    if (hrs >= 24) {
        const days = Math.floor(hrs / 24);
        const remHrs = hrs % 24;
        return `${days}d ${remHrs}h`;
    }
    if (hrs > 0) return `${hrs}h ${remMin}m`;
    return `${remMin}m`;
};

const getMinutesUntil = (date) => {
    if (!date) return Infinity;
    const diffMs = date.getTime() - Date.now();
    if (diffMs <= 0) return 0;
    return Math.floor(diffMs / 60000);
};

const Badge = ({ children }) => (
    <span
        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 text-xs font-medium bg-light-bg text-light-secondary-text dark:bg-dark-surface dark:text-dark-secondary-text`}>
        {children}
    </span>
);

const InfoRow = ({ icon: Icon, label, value }) => (
    <div className="flex items-start gap-2 text-sm">
        <Icon className="w-4 h-4 text-light-secondary-text dark:text-dark-secondary-text mt-0.5" />
        <div className="text-light-primary-text dark:text-dark-primary-text">
            <div className="text-light-secondary-text dark:text-dark-secondary-text">
                {label}
            </div>
            <div className="font-medium">{value || "-"}</div>
        </div>
    </div>
);

const UpcomingAppointments = () => {
    const { user } = useUser();
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    
    useEffect(() => {
        if (!user) return;
        let mounted = true;
        (async () => {
            try {
                setLoading(true);
                const token = await auth.currentUser.getIdToken();
                const res = await axios.get(
                    `${import.meta.env.VITE_SERVER_URL}/api/appointment/doctor/${user.uid}`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                if (!mounted) return;
                setAppointments(res.data?.data || []);
            } catch (err) {
                setError("Failed to load appointments");
                console.error(err?.response?.data || err);
            } finally {
                if (mounted) setLoading(false);
            }
        })();
        return () => {
            mounted = false;
        };
    }, [user]);

    // Only confirmed and in the future
    const upcoming = useMemo(() => {
        return (appointments || [])
            .filter((a) => a.status === "confirmed")
            .filter((a) => new Date(a.scheduledAt).getTime() > Date.now())
            .sort(
                (a, b) =>
                    new Date(a.scheduledAt).getTime() -
                    new Date(b.scheduledAt).getTime()
            );
    }, [appointments]);

    const startAppointmentHandler = (apptId) => {
        // Navigate with role in the URL path and roomID as query parameter
        window.location.href = `/video-appointment/doctor?roomID=${apptId}`;
    };

    if (loading) {
        return <div className="p-6">Loading appointments…</div>;
    }

    if (error) {
        return (
            <div className="p-4 rounded-lg border border-red-200 bg-red-50 text-red-700">
                {error}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Status Banner */}
            <div className="relative overflow-hidden rounded-xl border border-light-success/40 dark:border-dark-success/40 bg-light-surface dark:bg-dark-bg">
                <div className="p-4 sm:p-6 flex items-start gap-3 sm:gap-4">
                    <div className="p-2 rounded-lg bg-light-success dark:bg-dark-success dark:text-light-primary-text text-dark-primary-text">
                        <CalendarClock className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                        <div className="text-sm font-semibold text-light-primary-text dark:text-dark-primary-text">
                            Appointments are being scheduled
                        </div>
                        <div className="text-sm text-light-secondary-text dark:text-dark-secondary-text mt-0.5">
                            You have {upcoming.length} upcoming appointment
                            {upcoming.length === 1 ? "" : "s"}. We’ll notify you
                            when it’s time.
                        </div>
                    </div>
                </div>
            </div>

            {/* Appointments list */}
            {upcoming.length === 0 ? (
                <div className="p-10 text-center rounded-xl bg-light-surface dark:bg-dark-bg">
                    <div className="mx-auto w-10 h-10 rounded-full bg-light-bg dark:bg-dark-surface flex items-center justify-center mb-3">
                        <Info className="w-5 h-5 text-light-secondary-text dark:text-dark-secondary-text" />
                    </div>
                    <div className="text-light-primary-text dark:text-dark-primary-text font-semibold">
                        No upcoming appointments
                    </div>
                    <div className="text-light-secondary-text dark:text-dark-secondary-text text-sm mt-1">
                        Confirm new appointments to see them here.
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {upcoming.map((appt) => {
                        const { date, time, raw } = formatDateTime(
                            appt.scheduledAt
                        );
                        const startsIn = timeUntil(raw);
                        const minutesUntil = getMinutesUntil(raw);
                        const showStartButton = minutesUntil <= 1000000;
                        return (
                            <div
                                key={appt._id}
                                className="rounded-xl bg-light-surface dark:bg-dark-bg overflow-hidden shadow-sm">
                                {/* Header */}
                                <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-light-secondary-text/20 dark:border-dark-secondary-text/20 bg-light-surface dark:bg-dark-bg">
                                    <div className="flex items-center gap-2">
                                        <Badge>
                                            <Clock className="w-3.5 h-3.5" />
                                            Scheduled • Starts in {startsIn}
                                        </Badge>
                                    </div>
                                    {appt.meetingLink ? (
                                        <a
                                            href={appt.meetingLink}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex items-center gap-1.5 text-light-success-text hover:text-light-success-hover text-sm font-medium"
                                            title="Open meeting link">
                                            <Video className="w-4 h-4" /> Start
                                            call
                                            <ExternalLink className="w-3.5 h-3.5" />
                                        </a>
                                    ) : (
                                        <span className="text-xs text-light-secondary-text dark:text-dark-secondary-text">
                                            Meeting link will appear when
                                            available
                                        </span>
                                    )}
                                </div>

                                {/* Body */}
                                <div className="p-4 sm:p-6">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        {/* Patient */}
                                        <div className="space-y-3">
                                            <div className="text-xs uppercase tracking-wide text-light-secondary-text dark:text-dark-secondary-text">
                                                Patient
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-light-primary-text dark:bg-dark-primary-text flex items-center justify-center text-light-secondary-text dark:text-dark-secondary-text font-semibold">
                                                    {appt?.patientId?.fullName
                                                        ?.split(" ")
                                                        .map((p) => p[0])
                                                        .slice(0, 2)
                                                        .join("") || "P"}
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-light-primary-text dark:text-dark-primary-text">
                                                        {appt?.patientId
                                                            ?.fullName ||
                                                            "Unknown"}
                                                    </div>
                                                    <Badge>
                                                        ID:{" "}
                                                        {appt?.patientId?._id}
                                                    </Badge>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-1 gap-3">
                                                <InfoRow
                                                    icon={Mail}
                                                    label="Email"
                                                    value={
                                                        appt?.patientId?.email
                                                    }
                                                />
                                                <InfoRow
                                                    icon={Phone}
                                                    label="Phone"
                                                    value={
                                                        appt?.patientId?.phone
                                                    }
                                                />
                                                <InfoRow
                                                    icon={MapPin}
                                                    label="Location"
                                                    value={`${
                                                        appt?.patientId
                                                            ?.district || "-"
                                                    }, ${
                                                        appt?.patientId
                                                            ?.state || "-"
                                                    }`}
                                                />
                                            </div>
                                        </div>

                                        {/* Appointment */}
                                        <div className="space-y-3">
                                            <div className="text-xs uppercase tracking-wide text-light-secondary-text dark:text-dark-secondary-text">
                                                Appointment
                                            </div>
                                            <div className="grid grid-cols-1 gap-3">
                                                <InfoRow
                                                    icon={CalendarClock}
                                                    label="Scheduled for"
                                                    value={`${date} • ${time}`}
                                                />
                                                <InfoRow
                                                    icon={IndianRupee}
                                                    label="Consultation fee"
                                                    value={`${
                                                        appt?.amount?.amount ||
                                                        appt?.amount ||
                                                        0
                                                    }`}
                                                />
                                                <InfoRow
                                                    icon={Clock}
                                                    label="Status"
                                                    value={
                                                        <span className="inline-flex items-center gap-1">
                                                            <span className="relative flex h-2 w-2">
                                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-light-success opacity-75" />
                                                                <span className="relative inline-flex rounded-full h-2 w-2 bg-light-success" />
                                                            </span>
                                                            <span className="font-medium text-light-success-text dark:text-dark-success-text">
                                                                Confirmed
                                                            </span>
                                                        </span>
                                                    }
                                                />
                                            </div>
                                        </div>

                                        {/* Doctor */}
                                        <div className="space-y-3">
                                            <div className="text-xs uppercase tracking-wide text-light-secondary-text dark:text-dark-secondary-text">
                                                You (Doctor)
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-light-primary-text dark:bg-dark-primary-text flex items-center justify-center text-light-secondary-text dark:text-dark-secondary-text">
                                                    <User2 className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-light-primary-text dark:text-dark-primary-text">
                                                        {appt?.doctorId
                                                            ?.fullName ||
                                                            "Doctor"}
                                                    </div>
                                                    <div className="text-light-secondary-text dark:text-dark-secondary-text text-sm">
                                                        {appt?.doctorId
                                                            ?.specialty ||
                                                            "General"}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="w-full flex justify-end gap-3 mt-4">
                                        <button
                                            onClick={() => {
                                                setSelectedAppointment(appt);
                                                setIsDetailsOpen(true);
                                            }}
                                            className="w-fit bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2">
                                            <Eye className="w-4 h-4" />
                                            View Patient Details
                                        </button>

                                        {showStartButton && (
                                            <button
                                                onClick={() =>
                                                    startAppointmentHandler(
                                                        appt._id
                                                    )
                                                }
                                                className="w-fit bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2">
                                                <Video className="w-4 h-4" />
                                                Start Appointment
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Patient Details Dialog */}
            <PatientDetailsDialog
                appointment={selectedAppointment}
                isOpen={isDetailsOpen}
                onClose={() => {
                    setIsDetailsOpen(false);
                    setSelectedAppointment(null);
                }}
            />
        </div>
    );
};

export default UpcomingAppointments;
