// client/src/pages/patientPages/GetAppointment/GetAppointmentContent.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
// import { useAuth, useUser } from "@clerk/clerk-react";
import { useUser } from '../../../context/UserContext';
import {
    Stethoscope,
    Star,
    Phone,
    Mail,
    MapPin,
    DollarSign,
    Clock,
    CheckCircle2,
    Calendar,
    User2,
    IndianRupee,
    X,
    Plus,
    UserCircle,
} from "lucide-react";
import { toast } from "react-hot-toast";
import Loader from "../../../components/main/Loader";
import { auth } from "../../../config/config";

const COMMON_SYMPTOMS = [
    "Fever",
    "Cough",
    "Headache",
    "Stomach Pain",
    "Cold/Flu",
    "Back Pain",
    "Fatigue",
    "Chest Pain",
    "Shortness of Breath",
    "Skin Rash",
    "Joint Pain",
    "Sore Throat",
    "Nausea",
    "Dizziness",
];

function buildDiagnosisPrompt(userMeta = {}, symptoms = [], id = "") {
    const joinOrNone = (arr) =>
        Array.isArray(arr) && arr.length ? arr.join(", ") : "None";
    const dobOrAge = userMeta.dob
        ? `${userMeta.dob} (age: ${Math.max(
            0,
            Math.floor(
                (Date.now() - new Date(userMeta.dob)) /
                (365.25 * 24 * 60 * 60 * 1000)
            )
        )})`
        : userMeta.age
            ? `${userMeta.age} years`
            : "N/A";

    const patientBlock = [
        `Name: ${userMeta.fullName || "N/A"}`,
        `DOB / Age: ${dobOrAge}`,
        `Gender: ${userMeta.gender || "N/A"}`,
        `Allergies: ${joinOrNone(userMeta.alergies)}`,
        `Prior operations/surgeries: ${joinOrNone(userMeta.operations)}`,
        `Ongoing medications: ${joinOrNone(userMeta.ongoingMedications)}`,
        `Long-term medications: ${joinOrNone(userMeta.permanentMedications)}`,
        `Major chronic diseases: ${joinOrNone(userMeta.majorDiseases)}`,
        `Past medical notes: ${userMeta.medicalHistory || "N/A"}`,
    ].join("\n- ");

    const symptomsBlock =
        Array.isArray(symptoms) && symptoms.length
            ? symptoms.join(", ")
            : "N/A";

    return `You are a physician receiving a patient handover. Use ONLY the patient data and presenting symptoms provided below. Do NOT provide any treatments, management plans, prescriptions, or practical suggestions.

Patient data:
- ${patientBlock}

Presenting symptoms:
${symptomsBlock}

Required output (strict):
1) Brief case synopsis (one or two sentences).
2) Primary clinical impression (one clear sentence).
3) Top 3 differential diagnoses (ranked) — for each, one-line clinical rationale tied to the supplied facts.
4) Urgent red flags / alarm features (bullet list) that would raise concern given the data.
5) Three focused history questions that would most help distinguish the differentials.

Formatting rules:
- Output only the five sections above, labeled 1–5.
- Keep answer succinct and clinical (target ~150–250 words).
- Do NOT provide investigations, tests to order, management advice, prescriptions, or patient-facing explanations.
- Do NOT invent findings or new test results — when uncertain, use language like “consider” or “possible.”`;
}

const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.readAsDataURL(file); // Converts file → data URI base64
        reader.onload = () => resolve(reader.result);
        reader.onerror = (error) => reject(error);
    });
};

const GetAppointmentContent = () => {
    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { user } = useUser();
    const [selectedDoctor, setSelectedDoctor] = useState(null);
    const [bookingModalOpen, setBookingModalOpen] = useState(false);
    const [appointmentForm, setAppointmentForm] = useState({
        date: "",
        time: "",
        appointmentType: "online",
        symptomInput: "",
        symptoms: [],
        reports: "",
        reportFile: null,
    });
    const [availableSlots, setAvailableSlots] = useState([]);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [userMetadata, setUserMetadata] = useState(user.metadata || {});
    const [isBooking, setIsBooking] = useState(false);
    const today = new Date().toISOString().split("T")[0];

    useEffect(() => {
        if (!user) return;
        let mounted = true;

        (async () => {
            try {
                setLoading(true);
                const token = await auth.currentUser.getIdToken();
                const res = await axios.get(
                    `${import.meta.env.VITE_SERVER_URL
                    }/api/doctor/verified-doctors`,
                    {
                        headers: { Authorization: `Bearer ${token}` },
                    }
                );
                if (!mounted) return;
                setDoctors(res.data?.data || []);
            } catch (err) {
                setError("Failed to load doctors");
                console.error(err?.response?.data || err);
            } finally {
                if (mounted) setLoading(false);
            }
        })();

        return () => {
            mounted = false;
        };

        // No pre-click revalidation; rely on 5s refresh and conflict removal on booking
    }, [user]);

    const validateAppointmentDate = (date, time) => {
        if (!date || !time)
            return { ok: false, msg: "Please select date and a slot." };
        const inputValue = `${date}T${time}`;
        const d = new Date(inputValue);
        if (isNaN(d.getTime()))
            return { ok: false, msg: "Invalid date/time selected." };
        const now = new Date();
        const oneHourMs = 60 * 60 * 1000;
        if (d.getTime() < now.getTime()) {
            return { ok: false, msg: "Selected time is in the past." };
        }
        if (d.getTime() < now.getTime() + oneHourMs) {
            return {
                ok: false,
                msg: "Please choose a time at least 1 hour from now.",
            };
        }
        const mins = d.getMinutes();
        if (mins % 20 !== 0) {
            return {
                ok: false,
                msg: "Please select a 20-minute slot (:00, :20, :40).",
            };
        }
        return { ok: true, date: d, inputValue };
    };

    const handleBook = async () => {
        if (!selectedDoctor) {
            toast.error("Please select a doctor before booking.");
            return;
        }

        const v = validateAppointmentDate(
            appointmentForm.date,
            appointmentForm.time
        );
        if (!v.ok) {
            toast.error(v.msg);
            return;
        }

        await toast.promise(
            (async () => {
                try {
                    setIsBooking(true);
                    const prompt = buildDiagnosisPrompt(
                        userMetadata,
                        appointmentForm.symptoms
                    );
                    const summary = await axios.get(
                        `${import.meta.env.VITE_SERVER_URL
                        }/api/ai/generate-questions`,
                        {
                            params: { prompt },
                        }
                    );
                    const aiSummary = summary.data.content;

                    const formData = new FormData();
                    formData.append("doctorId", selectedDoctor._id);
                    formData.append("patientId", user.id);
                    formData.append("scheduledAt", v.inputValue);
                    formData.append(
                        "amount",
                        selectedDoctor.consultationFee ?? 0
                    );
                    formData.append(
                        "appointmentType",
                        appointmentForm.appointmentType
                    );
                    formData.append(
                        "symptoms",
                        JSON.stringify(appointmentForm.symptoms)
                    );
                    formData.append("reports", appointmentForm.reports.trim());
                    formData.append("aiSummary", aiSummary);
                    formData.append("reportFile", appointmentForm.reportFile);

                    const token = await auth.currentUser.getIdToken();
                    const res = await axios.post(
                        `${import.meta.env.VITE_SERVER_URL
                        }/api/appointment/create-appointment`,
                        formData,
                        token
                            ? {
                                headers: {
                                    Authorization: `Bearer ${token}`,
                                    "Content-Type": "multipart/form-data",
                                },
                            }
                            : undefined
                    );
                    closeBookingModal();
                } catch (e) {
                    console.log(e);
                    // If a time was selected, treat as a slot conflict: silently remove from UI and refresh slots
                    const msg =
                        e.response?.data?.message ||
                        "Failed to create appointment.";
                    if (appointmentForm.time) {
                        try {
                            const failedSlot = appointmentForm.time;
                            setAvailableSlots((prev) =>
                                prev.filter((s) => s !== failedSlot)
                            );
                            setAppointmentForm((prev) => ({
                                ...prev,
                                time: "",
                            }));
                            const token2 = await auth.currentUser.getIdToken();
                            const res2 = await axios.get(
                                `${import.meta.env.VITE_SERVER_URL
                                }/api/doctor/${selectedDoctor._id}/slots`,
                                {
                                    params: { date: appointmentForm.date },
                                    headers: token2
                                        ? { Authorization: `Bearer ${token2}` }
                                        : undefined,
                                }
                            );
                            setAvailableSlots(res2.data?.data || []);
                        } catch (_) {
                            // ignore
                        }
                    } else {
                        // Silent fail for other errors as well (no popup)
                        console.warn(msg);
                    }
                } finally {
                    setIsBooking(false);
                }
            })(),
            {
                loading: "Booking your appointment...",
                success: (data) =>
                    `Appointment booked successfully!`,
                error: () => `Failed to book appointment.`,
            }
        );
    };

    // Clear selected time if it's no longer in available slots (prevents selecting booked slot)
    useEffect(() => {
        if (
            appointmentForm.time &&
            !availableSlots.includes(appointmentForm.time)
        ) {
            setAppointmentForm((prev) => ({ ...prev, time: "" }));
        }
    }, [availableSlots]);

    const openBookingModal = async (doctor) => {
        setSelectedDoctor(doctor);
        setBookingModalOpen(true);
        setAvailableSlots([]);
        setAppointmentForm((prev) => ({ ...prev, date: "", time: "" }));
    };

    const closeBookingModal = () => {
        setBookingModalOpen(false);
        setSelectedDoctor(null);
        setAppointmentForm({
            date: "",
            time: "",
            appointmentType: "offline",
            symptomInput: "",
            symptoms: [],
            reports: "",
        });
    };

    const handleAppointmentFormChange = async (field, value) => {
        setAppointmentForm((prev) => ({ ...prev, [field]: value }));
        if (field === "date" && selectedDoctor) {
            try {
                setLoadingSlots(true);
                const token = await auth.currentUser.getIdToken();
                const res = await axios.get(
                    `${import.meta.env.VITE_SERVER_URL}/api/doctor/${selectedDoctor._id
                    }/slots`,
                    {
                        params: { date: value },
                        headers: token
                            ? { Authorization: `Bearer ${token}` }
                            : undefined,
                    }
                );
                setAvailableSlots(res.data?.data || []);
                // reset time when date changes
                setAppointmentForm((prev) => ({ ...prev, time: "" }));
            } catch (e) {
                console.error(e);
                setAvailableSlots([]);
                toast.error("Failed to load slots");
            } finally {
                setLoadingSlots(false);
            }
        }
    };

    // Auto-refresh slots periodically while booking modal is open to remove booked slots from UI
    useEffect(() => {
        if (!bookingModalOpen || !selectedDoctor || !appointmentForm.date)
            return;
        let cancelled = false;
        const tick = async () => {
            try {
                const token = await auth.currentUser.getIdToken();
                const res = await axios.get(
                    `${import.meta.env.VITE_SERVER_URL}/api/doctor/${selectedDoctor._id
                    }/slots`,
                    {
                        params: { date: appointmentForm.date },
                        headers: token
                            ? { Authorization: `Bearer ${token}` }
                            : undefined,
                    }
                );
                if (!cancelled) setAvailableSlots(res.data?.data || []);
            } catch (_) { }
        };
        // initial fetch to sync
        tick();
        const id = setInterval(tick, 5000); // 5s
        return () => {
            cancelled = true;
            clearInterval(id);
        };
    }, [bookingModalOpen, selectedDoctor, appointmentForm.date]);

    const handleAddSymptom = () => {
        const value = appointmentForm.symptomInput.trim();
        if (!value) return;
        setAppointmentForm((prev) => ({
            ...prev,
            symptoms: prev.symptoms.includes(value)
                ? prev.symptoms
                : [...prev.symptoms, value],
            symptomInput: "",
        }));
    };

    const handleSymptomKeyDown = (event) => {
        if (event.key === "Enter") {
            event.preventDefault();
            handleAddSymptom();
        }
    };

    const removeSymptom = (symptom) => {
        setAppointmentForm((prev) => ({
            ...prev,
            symptoms: prev.symptoms.filter((item) => item !== symptom),
        }));
    };

    if (loading) {
        return <Loader />;
    }

    if (error) {
        return (
            <div className="max-w-3xl mx-auto p-6">
                <p className="text-red-600 dark:text-red-400">{error}</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-light-background to-light-background-secondary dark:from-dark-background dark:to-dark-background-secondary">
            <div className="max-w-4xl mx-auto px-4 py-4 sm:px-6 sm:py-6">
                <div className="mb-4 sm:mb-6">
                    <h1 className="text-2xl sm:text-3xl font-bold text-light-primary-text dark:text-dark-primary-text">
                        Find a Verified Doctor
                    </h1>
                    <p className="mt-1 text-sm sm:text-base text-light-secondary-text dark:text-dark-secondary-text">
                        All doctors listed below are identity-verified and
                        available for appointments.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {doctors.map((doc) => (
                        <div
                            key={doc._id}
                            className="rounded-2xl bg-light-surface dark:bg-dark-bg p-4 shadow-md hover:shadow-xl transition-all duration-200 border border-transparent hover:border-light-primary/20 dark:hover:border-dark-primary/20">
                            <div className="grid grid-cols-9 gap-4 items-center">
                                <div className="col-span-2 flex items-center">
                                    <div className="w-full aspect-square rounded-full bg-gradient-to-br from-light-primary/20 to-light-primary/10 dark:from-dark-primary/20 dark:to-dark-primary/10 flex items-center justify-center text-xl font-semibold text-light-primary dark:text-dark-primary">
                                        {doc.fullName
                                            ? doc.fullName
                                                .split(" ")
                                                .map((n) => n[0])
                                                .slice(0, 2)
                                                .join("")
                                            : "DR"}
                                    </div>
                                </div>

                                <div className="col-span-5">
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-base sm:text-lg font-semibold text-light-primary-text dark:text-dark-primary-text">
                                            Dr. {doc.fullName}
                                        </h3>
                                        {doc.specialty && (
                                            <span className="text-xs text-white bg-light-secondary px-2 py-1 rounded-2xl ml-2">
                                                {doc.specialty}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs sm:text-sm text-[var(--color-light-secondary-text)] dark:text-[var(--color-dark-secondary-text)] mt-1">
                                        {doc.bio
                                            ? doc.bio.length > 120
                                                ? doc.bio.slice(0, 120) + "..."
                                                : doc.bio
                                            : "Board certified physician with patient-focused care."}
                                    </p>

                                    <div className="mt-3 flex items-center gap-2 flex-wrap">
                                        <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full dark:text-yellow-300 text-xs sm:text-sm">
                                            <Star
                                                className="fill-amber-400"
                                                size={28}
                                                color="amber-400"
                                            />
                                            <div className="flex gap-1 items-center">
                                                <span className="font-medium">
                                                    {(
                                                        doc.rating?.average ?? 0
                                                    ).toFixed(1)}
                                                </span>
                                                <span className="text-xs text-light-secondary-text dark:text-dark-secondary-text">
                                                    ({doc.rating?.count ?? 0})
                                                </span>
                                            </div>
                                        </div>

                                        <div className="text-xs sm:text-sm text-light-secondary-text bg-light-bg dark:bg-dark-surface px-3 py-1 rounded-full dark:text-dark-secondary-text">
                                            {doc.experience
                                                ? `${doc.experience} yrs`
                                                : "N/A"}{" "}
                                            experience
                                        </div>
                                        <div className="flex gap-1">
                                            {doc.languages?.length > 0 &&
                                                doc.languages.map((l, i) => (
                                                    <span
                                                        key={i}
                                                        className="px-2 py-0.5 rounded-full bg-light-primary/10 dark:bg-dark-primary/10 text-xs text-light-primary dark:text-dark-primary">
                                                        {l}
                                                    </span>
                                                ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="col-span-2 h-full flex flex-col justify-between gap-3">
                                    <div className="text-right">
                                        <div className="text-xl sm:text-2xl font-semibold text-light-primary-text dark:text-dark-primary-text">
                                            ₹{doc.consultationFee ?? 0}
                                        </div>
                                        <div className="text-xs text-light-secondary-text dark:text-dark-secondary-text">
                                            / consultation
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => openBookingModal(doc)}
                                        className="w-full px-3 py-2 rounded-md bg-light-primary dark:bg-dark-primary text-white font-medium hover:bg-light-primary-dark dark:hover:bg-dark-primary-dark transition">
                                        Book
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {doctors.length === 0 && (
                    <div className="mt-8 text-center text-light-secondary-text dark:text-dark-secondary-text">
                        No verified doctors available yet.
                    </div>
                )}
            </div>

            {bookingModalOpen && selectedDoctor && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div
                        style={{ scrollbarWidth: "none" }}
                        className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl bg-light-surface dark:bg-dark-bg p-6 shadow-xl">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm uppercase tracking-[0.2em] text-light-secondary-text dark:text-dark-secondary-text">
                                    Booking with
                                </p>
                                <h3 className="text-2xl font-semibold text-light-primary-text dark:text-dark-primary-text">
                                    Dr. {selectedDoctor.fullName}
                                </h3>
                                <p className="text-sm text-light-secondary-text dark:text-dark-secondary-text">
                                    {selectedDoctor.specialty ||
                                        "General Practice"}
                                </p>
                            </div>
                            <button
                                onClick={closeBookingModal}
                                className="rounded-full p-2 hover:bg-light-primary/10 dark:hover:bg-dark-primary/10 transition">
                                <X className="h-5 w-5 text-light-secondary-text dark:text-dark-secondary-text" />
                            </button>
                        </div>

                        <div className="mt-6 space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm font-medium text-light-primary-text dark:text-dark-primary-text">
                                        Appointment Date
                                    </p>
                                    <input
                                        type="date"
                                        min={today}
                                        value={appointmentForm.date}
                                        onChange={(e) =>
                                            handleAppointmentFormChange(
                                                "date",
                                                e.target.value
                                            )
                                        }
                                        className="mt-2 w-full rounded-lg border border-light-secondary-text/20 dark:border-dark-secondary-text/20 bg-light-background dark:bg-dark-background px-3 py-2 text-light-primary-text dark:text-dark-primary-text focus:outline-none focus:ring-2 focus:ring-light-primary dark:focus:ring-dark-primary"
                                    />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-light-primary-text dark:text-dark-primary-text">
                                        Available Slots (20-min)
                                    </p>
                                    <div className="mt-2 min-h-[44px]">
                                        {loadingSlots ? (
                                            <div className="text-sm text-light-secondary-text dark:text-dark-secondary-text">
                                                Loading slots...
                                            </div>
                                        ) : appointmentForm.date ? (
                                            availableSlots.length > 0 ? (
                                                <div className="flex flex-wrap gap-2">
                                                    {availableSlots.map((s) => (
                                                        <button
                                                            key={s}
                                                            disabled={isBooking}
                                                            onClick={() =>
                                                                !isBooking &&
                                                                setAppointmentForm(
                                                                    (p) => ({
                                                                        ...p,
                                                                        time: s,
                                                                    })
                                                                )
                                                            }
                                                            className={`px-3 py-2 rounded-md text-sm border transition ${appointmentForm.time ===
                                                                s
                                                                ? "bg-light-primary text-white border-light-primary"
                                                                : "bg-light-bg dark:bg-dark-surface text-light-primary-text dark:text-dark-primary-text border-light-secondary-text/20 dark:border-dark-secondary-text/20"
                                                                } ${isBooking
                                                                    ? "opacity-60 cursor-not-allowed"
                                                                    : "hover:opacity-90"
                                                                }`}>
                                                            {s}
                                                        </button>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="text-sm text-light-secondary-text dark:text-dark-secondary-text">
                                                    No slots available for this
                                                    date.
                                                </div>
                                            )
                                        ) : (
                                            <div className="text-sm text-light-secondary-text dark:text-dark-secondary-text">
                                                Select a date to see slots.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-light-primary-text dark:text-dark-primary-text">
                                    Appointment Type
                                </p>
                                <div className="mt-3 flex gap-3">
                                    {["online", "offline"].map((type) => {
                                        const selected =
                                            appointmentForm.appointmentType ===
                                            type;
                                        return (
                                            <button
                                                key={type}
                                                onClick={() =>
                                                    handleAppointmentFormChange(
                                                        "appointmentType",
                                                        type
                                                    )
                                                }
                                                className={`flex-1 rounded-xl border px-4 py-3 text-sm font-semibold capitalize transition ${selected
                                                    ? "border-transparent bg-light-primary text-white dark:bg-dark-primary"
                                                    : "border-light-secondary-text/30 dark:border-dark-secondary-text/30 text-light-primary-text dark:text-dark-primary-text"
                                                    }`}>
                                                {type}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-light-primary-text dark:text-dark-primary-text">
                                    Symptoms
                                </p>
                                <p className="text-xs text-light-secondary-text dark:text-dark-secondary-text">
                                    Select common symptoms or add your own.
                                </p>
                                <div className="mt-3 flex flex-wrap gap-2">
                                    {COMMON_SYMPTOMS.map((symptom) => {
                                        const active =
                                            appointmentForm.symptoms.includes(
                                                symptom
                                            );
                                        return (
                                            <button
                                                type="button"
                                                key={symptom}
                                                onClick={() =>
                                                    active
                                                        ? removeSymptom(symptom)
                                                        : setAppointmentForm(
                                                            (prev) => ({
                                                                ...prev,
                                                                symptoms: [
                                                                    ...prev.symptoms,
                                                                    symptom,
                                                                ],
                                                            })
                                                        )
                                                }
                                                className={`rounded-full px-3 py-1 text-sm capitalize transition ${active
                                                    ? "bg-light-primary text-white dark:bg-dark-primary"
                                                    : "bg-light-primary/10 text-light-primary dark:bg-dark-primary/10 dark:text-dark-primary"
                                                    }`}>
                                                {symptom}
                                            </button>
                                        );
                                    })}
                                </div>
                                <div className="mt-3 flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="e.g. fever, headache"
                                        value={appointmentForm.symptomInput}
                                        onChange={(e) =>
                                            handleAppointmentFormChange(
                                                "symptomInput",
                                                e.target.value
                                            )
                                        }
                                        onKeyDown={handleSymptomKeyDown}
                                        className="flex-1 rounded-lg border border-light-secondary-text/20 dark:border-dark-secondary-text/20 bg-light-background dark:bg-dark-background px-3 py-2 text-light-primary-text dark:text-dark-primary-text focus:outline-none focus:ring-2 focus:ring-light-primary dark:focus:ring-dark-primary"
                                    />
                                    <button
                                        onClick={handleAddSymptom}
                                        className="inline-flex items-center gap-2 rounded-lg bg-light-primary px-4 py-2 text-white hover:bg-light-primary-dark dark:bg-dark-primary dark:hover:bg-dark-primary-dark">
                                        <Plus className="h-4 w-4" />
                                        Add
                                    </button>
                                </div>
                                {appointmentForm.symptoms.length > 0 && (
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        {appointmentForm.symptoms.map(
                                            (symptom) => (
                                                <span
                                                    key={symptom}
                                                    className="inline-flex items-center gap-2 rounded-full bg-light-primary/10 px-3 py-1 text-sm text-light-primary dark:bg-dark-primary/20 dark:text-dark-primary">
                                                    {symptom}
                                                    <button
                                                        onClick={() =>
                                                            removeSymptom(
                                                                symptom
                                                            )
                                                        }
                                                        className="rounded-full p-1 hover:bg-light-primary/20 dark:hover:bg-dark-primary/20">
                                                        <X className="h-3 w-3" />
                                                    </button>
                                                </span>
                                            )
                                        )}
                                    </div>
                                )}
                            </div>
                            <div>
                                <p className="text-sm font-medium text-light-primary-text dark:text-dark-primary-text">
                                    Reports / Previous Diagnosis (Optional)
                                </p>
                                <textarea
                                    rows={3}
                                    value={appointmentForm.reports}
                                    onChange={(e) =>
                                        handleAppointmentFormChange(
                                            "reports",
                                            e.target.value
                                        )
                                    }
                                    className="mt-2 w-full rounded-lg border border-light-secondary-text/20 dark:border-dark-secondary-text/20 bg-light-background dark:bg-dark-background px-3 py-2 text-light-primary-text dark:text-dark-primary-text focus:outline-none focus:ring-2 focus:ring-light-primary dark:focus:ring-dark-primary"
                                    placeholder="Share any important medical history, lab results, or recent observations."
                                />
                            </div>

                            <div className="col-span-full">
                                <p
                                    htmlFor="patient-report"
                                    className="block text-sm/6 font-medium text-light-primary-text dark:text-dark-primary-text">
                                    Upload Relevant Medical File (Optional)
                                </p>
                                <div className="mt-1">
                                    <div className="flex justify-center rounded-lg border border-dashed border-light-secondary-text/25 dark:border-dark-secondary-text/25 px-6 py-10">
                                        <div className="text-center">
                                            <UserCircle
                                                aria-hidden="true"
                                                className="mx-auto size-12 text-light-secondary-text dark:text-dark-secondary-text"
                                            />
                                            <div className="mt-4 flex text-sm/6 text-light-secondary-text dark:text-dark-secondary-text">
                                                <label
                                                    htmlFor="patient-report"
                                                    className="relative cursor-pointer rounded-md bg-transparent font-semibold text-light-primary dark:text-dark-primary">
                                                    <span className="text-light-secondary dark:text-dark-secondary font-bold">
                                                        Upload Relevant Medical
                                                        File
                                                    </span>
                                                    <input
                                                        id="patient-report"
                                                        name="patient-report"
                                                        type="file"
                                                        accept=".jpg,.jpeg,.png"
                                                        onChange={(e) =>
                                                            setAppointmentForm({
                                                                ...appointmentForm,
                                                                reportFile:
                                                                    e.target
                                                                        .files[0],
                                                            })
                                                        }
                                                        className="sr-only"
                                                        required
                                                    />
                                                </label>
                                            </div>
                                            <p className="text-xs/5 text-light-secondary-text dark:text-dark-secondary-text">
                                                PDF, JPG, PNG up to 10MB
                                            </p>
                                            {appointmentForm.reportFile && (
                                                <p className="mt-2 text-sm text-light-success dark:text-dark-success">
                                                    Selected:{" "}
                                                    {
                                                        appointmentForm
                                                            .reportFile.name
                                                    }
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <div className="text-sm text-light-secondary-text dark:text-dark-secondary-text">
                                Consultation Fee:{" "}
                                <span className="font-semibold ml-2 text-2xl text-light-primary-text dark:text-dark-primary-text">
                                    ₹{selectedDoctor.consultationFee ?? 0}
                                </span>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={closeBookingModal}
                                    className="rounded-lg border border-light-secondary-text/30 px-4 py-2 text-sm font-semibold text-light-secondary-text hover:bg-light-secondary-text/10 dark:border-dark-secondary-text/30 dark:text-dark-secondary-text dark:hover:bg-dark-secondary-text/10">
                                    Cancel
                                </button>
                                <button
                                    onClick={handleBook}
                                    className="rounded-lg bg-light-primary px-4 py-2 text-sm font-semibold text-white hover:bg-light-primary-dark dark:bg-dark-primary dark:hover:bg-dark-primary-dark">
                                    Confirm Booking
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GetAppointmentContent;
