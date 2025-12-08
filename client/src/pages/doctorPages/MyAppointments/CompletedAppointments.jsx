import React, { useEffect, useMemo, useState } from "react";
import { useUser } from "../../../context/UserContext";
import axios from "axios";
import {
    CheckCircle2,
    XCircle,
    CalendarClock,
    Star,
    User2,
    Mail,
    Phone,
    MapPin,
    IndianRupee,
    MessageSquareText,
} from "lucide-react";
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
        return `${date} • ${time}`;
    } catch {
        return "-";
    }
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

const Stars = ({ value = 0, outOf = 5 }) => (
    <div className="flex items-center gap-1">
        {Array.from({ length: outOf }).map((_, i) => (
            <Star
                key={i}
                className={`w-4 h-4 ${
                    i < value
                        ? "fill-amber-400 text-amber-400"
                        : "text-light-secondary-text dark:text-dark-secondary-text"
                }`}
            />
        ))}
        <span className="text-xs text-light-secondary-text dark:text-dark-secondary-text ml-1">
            {value}/{outOf}
        </span>
    </div>
);

const CompletedAppointments = () => {
    const { user } = useUser();
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    console.log(user);
    useEffect(() => {
        if (!user) return;
        let mounted = true;
        (async () => {
            try {
                setLoading(true);
                const token = await auth.currentUser.getIdToken();
                console.log(user.uid);
                const res = await axios.get(
                    `${import.meta.env.VITE_SERVER_URL}/api/appointment/doctor/${user.uid}`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                if (!mounted) return;
                console.log(res);
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

    // Completed or Cancelled
    const done = useMemo(() => {
        return (appointments || [])
            .filter((a) => a.status === "completed" || a.status === "cancelled")
            .sort(
                (a, b) =>
                    new Date(b.scheduledAt).getTime() -
                    new Date(a.scheduledAt).getTime()
            );
    }, [appointments]);

    if (loading) {
        return (
            <div className="space-y-4">
                <div className="animate-pulse h-24 rounded-xl bg-light-bg dark:bg-dark-bg" />
                <div className="animate-pulse h-40 rounded-xl bg-light-bg dark:bg-dark-bg" />
                <div className="animate-pulse h-40 rounded-xl bg-light-bg dark:bg-dark-bg" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 rounded-lg border border-light-fail dark:border-dark-fail bg-light-fail dark:bg-dark-fail text-light-primary-text dark:text-dark-primary-text">
                {error}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {done.length === 0 ? (
                <div className="p-10 text-center rounded-xl border border-light-secondary-text dark:border-dark-secondary-text bg-light-surface dark:bg-dark-bg">
                    <div className="text-light-primary-text dark:text-dark-primary-text font-semibold">
                        No completed or cancelled appointments
                    </div>
                    <div className="text-light-secondary-text dark:text-dark-secondary-text text-sm mt-1">
                        Completed appointments and their reviews will appear
                        here.
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {done.map((appt) => {
                        const isCompleted = appt.status === "completed";
                        const tone = isCompleted ? "emerald" : "rose";
                        const headerIcon = isCompleted ? (
                            <CheckCircle2 className="w-4 h-4 dark:text-dark-success text-light-success" />
                        ) : (
                            <XCircle className="w-4 h-4 dark:text-dark-fail text-light-fail" />
                        );
                        const statusText = isCompleted
                            ? "Completed"
                            : "Cancelled";
                        const when = formatDateTime(appt.scheduledAt);
                        const ratingValue = Number(appt?.rating || 0);

                        return (
                            <div
                                key={appt._id}
                                className="rounded-xl bg-light-surface dark:bg-dark-bg overflow-hidden shadow-sm">
                                {/* Header */}
                                <div
                                    className={`flex items-center justify-between gap-2 px-4 py-3 bg-light-surface dark:bg-dark-bg border-b border-light-secondary-text/20 dark:border-dark-secondary-text/20`}>
                                    <div
                                        className={`flex items-center gap-2 text-light-primary-text dark:text-dark-primary-text`}>
                                        <Badge>
                                            {headerIcon}
                                            {statusText}
                                        </Badge>
                                    </div>
                                    <div className="text-xs text-light-secondary-text dark:text-dark-secondary-text">
                                        <CalendarClock className="w-3.5 h-3.5 inline mr-1" />
                                        {when}
                                    </div>
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
                                                    <div className="text-light-secondary-text dark:text-dark-secondary-text text-sm">
                                                        {appt?.patientId?._id?.slice(
                                                            -6
                                                        )}
                                                    </div>
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
                                                    icon={IndianRupee}
                                                    label="Consultation fee"
                                                    value={`${
                                                        appt?.amount?.amount ||
                                                        appt?.amount ||
                                                        0
                                                    }`}
                                                />
                                                <div className="flex items-center gap-2">
                                                    <span className="text-light-secondary-text dark:text-dark-secondary-text text-sm">
                                                        Status:
                                                    </span>
                                                    <Badge tone={tone}>
                                                        {statusText}
                                                    </Badge>
                                                </div>
                                                {isCompleted && (
                                                    <div className="space-y-2">
                                                        <div className="text-xs uppercase tracking-wide text-light-secondary-text dark:text-dark-secondary-text">
                                                            Patient Feedback
                                                        </div>
                                                        <div className="flex items-start gap-3 rounded-lg bg-light-bg dark:bg-dark-bg">
                                                            <div>
                                                                <div className="text-light-primary-text dark:text-dark-primary-text text-xs">
                                                                    {appt?.review ||
                                                                        "No written review provided."}
                                                                </div>
                                                                <div className="mt-2">
                                                                    <Stars
                                                                        value={
                                                                            isNaN(
                                                                                ratingValue
                                                                            )
                                                                                ? 0
                                                                                : ratingValue
                                                                        }
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
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
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default CompletedAppointments;
