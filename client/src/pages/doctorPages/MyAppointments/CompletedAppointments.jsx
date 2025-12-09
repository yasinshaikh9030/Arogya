import React, { useEffect, useMemo, useState } from "react";
import { useUser, useAuth } from "@clerk/clerk-react";
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
    Pill,
    X,
} from "lucide-react";

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
    const { getToken } = useAuth();
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [prescriptionModalOpen, setPrescriptionModalOpen] = useState(false);
    const [prescriptionSaving, setPrescriptionSaving] = useState(false);
    const [prescriptionError, setPrescriptionError] = useState("");
    const [editingAppointment, setEditingAppointment] = useState(null);
    const [prescriptionItems, setPrescriptionItems] = useState([
        { medicine: "", dosage: "", frequency: "", notes: "" },
    ]);

    useEffect(() => {
        if (!user) return;
        let mounted = true;
        (async () => {
            try {
                setLoading(true);
                const token = await getToken();
                const res = await axios.get(
                    `${import.meta.env.VITE_SERVER_URL}/api/appointment/doctor/${user.id}`,
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
    }, [user, getToken]);

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

    const openPrescriptionEditor = (appt) => {
        const existing = Array.isArray(appt.prescription)
            ? appt.prescription
            : [];
        setEditingAppointment(appt);
        setPrescriptionItems(
            existing.length > 0
                ? existing.map((item) => ({
                      medicine: item.medicine || "",
                      dosage: item.dosage || "",
                      frequency: item.frequency || "",
                      notes: item.notes || "",
                  }))
                : [{ medicine: "", dosage: "", frequency: "", notes: "" }]
        );
        setPrescriptionError("");
        setPrescriptionModalOpen(true);
    };

    const updatePrescriptionItem = (index, field, value) => {
        setPrescriptionItems((prev) => {
            const copy = [...prev];
            copy[index] = { ...copy[index], [field]: value };
            return copy;
        });
    };

    const addPrescriptionRow = () => {
        setPrescriptionItems((prev) => [
            ...prev,
            { medicine: "", dosage: "", frequency: "", notes: "" },
        ]);
    };

    const removePrescriptionRow = (index) => {
        setPrescriptionItems((prev) =>
            prev.filter((_, idx) => idx !== index)
        );
    };

    const handleSavePrescription = async () => {
        if (!editingAppointment) return;
        try {
            setPrescriptionSaving(true);
            setPrescriptionError("");

            const cleaned = prescriptionItems
                .map((item) => ({
                    medicine: (item.medicine || "").trim(),
                    dosage: (item.dosage || "").trim(),
                    frequency: (item.frequency || "").trim(),
                    notes: (item.notes || "").trim(),
                }))
                .filter((item) => item.medicine);

            const token = await getToken();
            const res = await axios.put(
                `${import.meta.env.VITE_SERVER_URL}/api/appointment/${
                    editingAppointment._id
                }/prescription`,
                { prescription: cleaned },
                token
                    ? { headers: { Authorization: `Bearer ${token}` } }
                    : undefined
            );

            const updatedAppt = res.data?.data;
            if (updatedAppt) {
                setAppointments((prev) =>
                    (prev || []).map((a) =>
                        a._id === updatedAppt._id ? { ...a, ...updatedAppt } : a
                    )
                );
            }

            setPrescriptionModalOpen(false);
            setEditingAppointment(null);
        } catch (err) {
            console.error(err?.response?.data || err);
            setPrescriptionError(
                err?.response?.data?.message || "Failed to save prescription"
            );
        } finally {
            setPrescriptionSaving(false);
        }
    };

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
                                                    <div className="mt-3 flex flex-wrap gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                openPrescriptionEditor(
                                                                    appt
                                                                )
                                                            }
                                                            className="inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium bg-light-primary/10 text-light-primary hover:bg-light-primary/20 dark:bg-dark-primary/20 dark:text-dark-primary dark:hover:bg-dark-primary/30"
                                                        >
                                                            <Pill className="w-3.5 h-3.5" />
                                                            {Array.isArray(
                                                                appt.prescription
                                                            ) &&
                                                            appt.prescription
                                                                .length > 0
                                                                ? "Edit Prescription"
                                                                : "Add Prescription"}
                                                        </button>
                                                    </div>
                                                )}
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
            {prescriptionModalOpen && editingAppointment && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-3xl max-h-[85vh] overflow-auto rounded-2xl bg-light-surface dark:bg-dark-bg p-4 shadow-lg">
                        <div className="flex items-center justify-between mb-3">
                            <div>
                                <h4 className="text-lg font-semibold text-light-primary-text dark:text-dark-primary-text">
                                    {Array.isArray(editingAppointment.prescription) &&
                                    editingAppointment.prescription.length > 0
                                        ? "Edit Prescription"
                                        : "Add Prescription"}
                                </h4>
                                <p className="text-xs text-light-secondary-text dark:text-dark-secondary-text">
                                    For patient {editingAppointment?.patientId?.fullName || ""}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    setPrescriptionModalOpen(false);
                                    setEditingAppointment(null);
                                }}
                                className="px-2 py-1 rounded text-light-primary-text dark:text-dark-primary-text hover:bg-light-bg dark:hover:bg-dark-surface"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {prescriptionError && (
                            <div className="mb-3 rounded border border-light-fail/60 bg-light-fail/20 px-3 py-2 text-xs text-light-primary-text dark:border-dark-fail/60 dark:bg-dark-fail/10 dark:text-dark-primary-text">
                                {prescriptionError}
                            </div>
                        )}

                        <div className="space-y-3">
                            {prescriptionItems.map((item, index) => (
                                <div
                                    key={index}
                                    className="rounded-lg border border-light-secondary-text/20 dark:border-dark-secondary-text/20 p-3 flex flex-col gap-2"
                                >
                                    <div className="flex flex-col sm:flex-row gap-2">
                                        <div className="flex-1">
                                            <label className="block text-xs text-light-secondary-text dark:text-dark-secondary-text mb-1">
                                                Medicine
                                            </label>
                                            <input
                                                type="text"
                                                value={item.medicine}
                                                onChange={(e) =>
                                                    updatePrescriptionItem(
                                                        index,
                                                        "medicine",
                                                        e.target.value
                                                    )
                                                }
                                                className="w-full rounded border border-light-secondary-text/30 dark:border-dark-secondary-text/30 bg-transparent px-2 py-1 text-sm text-light-primary-text dark:text-dark-primary-text focus:outline-none focus:ring-1 focus:ring-light-primary dark:focus:ring-dark-primary"
                                                placeholder="Medicine name"
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <label className="block text-xs text-light-secondary-text dark:text-dark-secondary-text mb-1">
                                                Dosage
                                            </label>
                                            <input
                                                type="text"
                                                value={item.dosage}
                                                onChange={(e) =>
                                                    updatePrescriptionItem(
                                                        index,
                                                        "dosage",
                                                        e.target.value
                                                    )
                                                }
                                                className="w-full rounded border border-light-secondary-text/30 dark:border-dark-secondary-text/30 bg-transparent px-2 py-1 text-sm text-light-primary-text dark:text-dark-primary-text focus:outline-none focus:ring-1 focus:ring-light-primary dark:focus:ring-dark-primary"
                                                placeholder="e.g. 1 tablet"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex flex-col sm:flex-row gap-2">
                                        <div className="flex-1">
                                            <label className="block text-xs text-light-secondary-text dark:text-dark-secondary-text mb-1">
                                                Frequency
                                            </label>
                                            <input
                                                type="text"
                                                value={item.frequency}
                                                onChange={(e) =>
                                                    updatePrescriptionItem(
                                                        index,
                                                        "frequency",
                                                        e.target.value
                                                    )
                                                }
                                                className="w-full rounded border border-light-secondary-text/30 dark:border-dark-secondary-text/30 bg-transparent px-2 py-1 text-sm text-light-primary-text dark:text-dark-primary-text focus:outline-none focus:ring-1 focus:ring-light-primary dark:focus:ring-dark-primary"
                                                placeholder="e.g. twice a day"
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <label className="block text-xs text-light-secondary-text dark:text-dark-secondary-text mb-1">
                                                Notes
                                            </label>
                                            <input
                                                type="text"
                                                value={item.notes}
                                                onChange={(e) =>
                                                    updatePrescriptionItem(
                                                        index,
                                                        "notes",
                                                        e.target.value
                                                    )
                                                }
                                                className="w-full rounded border border-light-secondary-text/30 dark:border-dark-secondary-text/30 bg-transparent px-2 py-1 text-sm text-light-primary-text dark:text-dark-primary-text focus:outline-none focus:ring-1 focus:ring-light-primary dark:focus:ring-dark-primary"
                                                placeholder="Additional instructions"
                                            />
                                        </div>
                                    </div>
                                    {prescriptionItems.length > 1 && (
                                        <div className="flex justify-end">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    removePrescriptionRow(index)
                                                }
                                                className="text-xs text-light-secondary-text dark:text-dark-secondary-text hover:text-light-primary dark:hover:text-dark-primary flex items-center gap-1"
                                            >
                                                <X className="w-3 h-3" />
                                                Remove
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                            <button
                                type="button"
                                onClick={addPrescriptionRow}
                                className="mt-1 inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium bg-light-bg text-light-primary-text hover:bg-light-primary/10 dark:bg-dark-surface dark:text-dark-primary-text dark:hover:bg-dark-primary/20"
                            >
                                + Add another medicine
                            </button>
                        </div>

                        <div className="mt-4 flex items-center justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => {
                                    setPrescriptionModalOpen(false);
                                    setEditingAppointment(null);
                                }}
                                className="px-3 py-1.5 text-xs rounded-md border border-light-secondary-text/40 text-light-secondary-text hover:bg-light-bg dark:border-dark-secondary-text/40 dark:text-dark-secondary-text dark:hover:bg-dark-surface"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleSavePrescription}
                                disabled={prescriptionSaving}
                                className="px-4 py-1.5 text-xs rounded-md bg-light-primary text-dark-primary-text hover:bg-light-primary-hover disabled:opacity-60 dark:bg-dark-primary dark:text-dark-primary-text dark:hover:bg-dark-primary-hover"
                            >
                                {prescriptionSaving ? "Saving..." : "Save Prescription"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CompletedAppointments;
