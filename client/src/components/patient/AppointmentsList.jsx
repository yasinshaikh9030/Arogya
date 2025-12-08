import React, { useState } from "react";
import {
    Stethoscope,
    Calendar,
    IndianRupee,
    CheckCircle2,
    Clock,
    Mail,
    Phone,
    Star,
    Link as LinkIcon,
    FileText,
    User2,
    ThumbsUp,
    ThumbsDown,
    Info,
    XCircle,
    CreditCard,
    Receipt,
    StarIcon,
    X,
    Pill,
} from "lucide-react";
import Drawer from "../main/Drawer";
import toast from "react-hot-toast";
import axios from "axios";
import { useRazorpay } from "react-razorpay";
import { useUser } from '../../context/UserContext';

const AppointmentsList = ({ appointments }) => {
    const [open, setOpen] = useState(false);
    const [selectedDoctor, setSelectedDoctor] = useState(null);
    const [processingPaymentId, setProcessingPaymentId] = useState(null);

    const { user } = useUser();
    const [viewerOpen, setViewerOpen] = useState(false);
    const [viewingUrl, setViewingUrl] = useState(null);
    const [viewingType, setViewingType] = useState(null); // 'pdf' | 'image' | 'unknown'
    const [prescriptionOpen, setPrescriptionOpen] = useState(false);
    const [prescriptionItems, setPrescriptionItems] = useState([]);
    const [prescriptionMeta, setPrescriptionMeta] = useState({
        doctorName: "",
        date: "",
    });

    // Inline rating form state
    const [formRating, setFormRating] = useState({}); // appointmentId -> rating (1-5)
    const [formReview, setFormReview] = useState({}); // appointmentId -> string
    const [submitting, setSubmitting] = useState({}); // appointmentId -> bool
    const [submitted, setSubmitted] = useState({}); // appointmentId -> bool
    const [errMsg, setErrMsg] = useState({}); // appointmentId -> error

    const { Razorpay } = useRazorpay();

    const savePaymentEntry = async ({
        appointmentId,
        status,
        orderId,
        paymentId,
    }) => {
        const response = await axios.post(
            `${import.meta.env.VITE_SERVER_URL}/api/payment/save-payment`,
            {
                appointmentId,
                status,
                orderId,
                paymentId,
            }
        );
        if (!response.data?.success) {
            throw new Error(response.data?.message || "Unable to save payment");
        }
        // Payment entry saved successfully
        toast.success("Payment successful!");
        // it should rerender with updated payment status from parent component
        setProcessingPaymentId(null);
        return response.data.data;
    };

    const paymentClickHandler = async (appointmentId, amount) => {
        try {
            const res = await axios.post(
                `${import.meta.env.VITE_SERVER_URL}/api/payment/create-order`,
                { amount },
                { headers: { "Content-Type": "application/json" } }
            );

            var options = {
                key: import.meta.env.VITE_RAZORPAY_KEY_ID,
                amount: res.data.data.amount,
                currency: "INR",
                name: "Arogya",
                description: "Test Transaction",
                image: "https://res.cloudinary.com/dcwoprlbv/image/upload/v1764779031/arogya-logo_oysqew.png",
                order_id: res.data.data.id,
                handler: (res) =>
                    savePaymentEntry({
                        appointmentId,
                        status: "paid",
                        orderId: res.razorpay_order_id,
                        paymentId: res.razorpay_payment_id,
                    }),
                prefill: {
                    //We recommend using the prefill parameter to auto-fill customer's contact information, especially their phone number
                    name: "Gaurav Kumar", //your customer's name
                    email: "gaurav.kumar@example.com",
                    contact: "+919876543210", //Provide the customer's phone number for better conversion rates
                },
                notes: {
                    address: "Razorpay Corporate Office",
                },
                theme: {
                    color: "#3399cc",
                },
            };

            var rzp1 = new Razorpay(options);

            rzp1.on("payment.failed", function (response) {
                alert(response.error.code);
                alert(response.error.description);
                alert(response.error.source);
                alert(response.error.step);
                alert(response.error.reason);
                alert(response.error.metadata.order_id);
                alert(response.error.metadata.payment_id);
            });
            setProcessingPaymentId(appointmentId);
            rzp1.open();
        } catch (error) {
            console.error("Error creating payment order:", error);
            toast.error("Error creating payment order");
        }
    };

    // Inline Submit Handler
    const handleInlineRatingSubmit = async (appointment) => {
        const rating = formRating[appointment._id] || 5;
        const review = formReview[appointment._id] || "";
        setSubmitting((p) => ({ ...p, [appointment._id]: true }));
        setErrMsg((e) => ({ ...e, [appointment._id]: null }));

        console.log(
            user.uid,
            appointment.doctorId?._id || appointment.doctorId,
            rating,
            review
        );
        try {
            await axios.post(
                `${import.meta.env.VITE_SERVER_URL}/api/appointment/${
                    appointment._id
                }/rating`,
                {
                    patientId: user.uid,
                    doctorId: appointment.doctorId?._id || appointment.doctorId,
                    rating,
                    review,
                }
            );
            setSubmitted((p) => ({ ...p, [appointment._id]: true }));
            setTimeout(() => window.location.reload(), 800);
        } catch (err) {
            setErrMsg((e) => ({
                ...e,
                [appointment._id]: "Failed to submit rating.",
            }));
        } finally {
            setSubmitting((p) => ({ ...p, [appointment._id]: false }));
        }
    };

    return (
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            {appointments.map((appt) => {
                const doc = appt.doctorId;
                const date = new Date(appt.scheduledAt);
                return (
                    <div
                        key={appt._id}
                        className="rounded-2xl dark:bg-dark-bg bg-light-surface p-5 shadow-md border border-light-primary/10 dark:border-dark-primary/10 flex flex-col gap-3">
                        {/* Header */}
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-light-primary/10 dark:bg-dark-primary/10 flex items-center justify-center">
                                <Stethoscope className="w-6 h-6 text-light-primary dark:text-dark-primary" />
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <h3 className="text-lg font-bold text-light-primary-text dark:text-dark-primary-text">
                                            Dr. {doc?.fullName || "Unknown"}
                                        </h3>
                                        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                                            <CheckCircle2 className="w-3.5 h-3.5" />{" "}
                                            Appointment
                                        </span>
                                    </div>
                                    {doc?.rating?.average &&
                                        appt.status !== "completed" && (
                                            <div className="flex items-center gap-1 px-2 py-1 rounded-full dark:text-yellow-300 text-sm">
                                                <Star
                                                    className="fill-amber-400"
                                                    size={26}
                                                    color="amber-400"
                                                />
                                                <div className="flex gap-1 items-center">
                                                    <span className="text-xl font-medium">
                                                        {(
                                                            doc.rating
                                                                ?.average ?? 0
                                                        ).toFixed(1)}
                                                    </span>
                                                    <span className="text-xs text-light-secondary-text dark:text-dark-secondary-text">
                                                        (
                                                        {doc.rating?.count ?? 0}
                                                        )
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                </div>
                                <div className="flex gap-2 mt-1">
                                    {doc?.qualifications && (
                                        <p className="text-xs text-light-secondary-text dark:text-dark-secondary-text">
                                            | {doc.qualifications}
                                        </p>
                                    )}
                                    {doc?.id && (
                                        <p className="text-xs text-light-secondary-text dark:text-dark-secondary-text">
                                            ID: {doc.id}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                        {/* Report Viewer Modal */}
                        {viewerOpen && viewingUrl && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                                <div className="w-full max-w-4xl max-h-[90vh] overflow-auto rounded-2xl bg-light-surface dark:bg-dark-bg p-4 shadow-lg">
                                    <div className="flex items-start justify-between mb-3">
                                        <h4 className="text-lg font-semibold text-light-primary-text dark:text-dark-primary-text">
                                            Report Preview
                                        </h4>
                                        <button
                                            onClick={() => {
                                                setViewerOpen(false);
                                                setViewingUrl(null);
                                                setViewingType(null);
                                            }}
                                            className="px-2 py-1 rounded text-light-primary-text dark:text-dark-primary-text hover:bg-light-bg dark:hover:bg-dark-surface">
                                            <X />
                                        </button>
                                    </div>
                                    <div className="w-full">
                                        {viewingType === "pdf" && (
                                            <iframe
                                                title="report-pdf"
                                                src={viewingUrl}
                                                className="w-full h-[70vh]"
                                            />
                                        )}
                                        {viewingType === "image" && (
                                            <img
                                                src={viewingUrl}
                                                alt="report"
                                                className="w-full object-contain max-h-[70vh]"
                                            />
                                        )}
                                        {viewingType === "unknown" && (
                                            <div>
                                                <p className="mb-2">
                                                    File preview not available.
                                                </p>
                                                <a
                                                    href={viewingUrl}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="text-blue-600 underline">
                                                    Open in a new tab
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                        <hr className="my-1 border-light-secondary-text/10 dark:border-dark-secondary-text/10" />
                        {/* Appointment Info */}
                        <div className="flex flex-wrap justify-between items-center gap-4">
                            <div className="flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-blue-500" />
                                <span className="text-md font-medium text-light-primary-text dark:text-dark-primary-text">
                                    {date.toLocaleDateString()}{" "}
                                    {date.toLocaleTimeString([], {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                    })}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                {appt.status === "pending" && (
                                    <span className="flex items-center gap-1 text-sm capitalize px-2 py-1 rounded-md bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 font-semibold">
                                        <Clock className="w-4 h-4 text-yellow-500" />{" "}
                                        Pending
                                    </span>
                                )}
                                {appt.status === "confirmed" && (
                                    <span className="flex items-center gap-1 text-sm capitalize px-2 py-1 rounded-md bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 font-semibold">
                                        <CheckCircle2 className="w-4 h-4 text-blue-500" />{" "}
                                        Confirmed
                                    </span>
                                )}
                                {appt.status === "completed" && (
                                    <span className="flex items-center gap-1 text-sm capitalize px-2 py-1 rounded-md bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 font-semibold">
                                        <CheckCircle2 className="w-4 h-4 text-green-500" />{" "}
                                        Completed
                                    </span>
                                )}
                                {appt.status === "cancelled" && (
                                    <span className="flex items-center gap-1 text-sm capitalize px-2 py-1 rounded-md bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 font-semibold">
                                        <XCircle className="w-4 h-4 text-red-500" />{" "}
                                        Cancelled
                                    </span>
                                )}
                                {[
                                    "pending",
                                    "confirmed",
                                    "completed",
                                    "cancelled",
                                ].indexOf(appt.status) === -1 && (
                                    <span className="flex items-center gap-1 text-sm capitalize px-2 py-0.5 rounded bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300 font-semibold">
                                        <Clock className="w-4 h-4 text-gray-500" />{" "}
                                        {appt.status}
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-1">
                                <IndianRupee className="w-5 h-5 text-emerald-600" />
                                <span className="text-2xl text-light-primary-text dark:text-dark-primary-text font-semibold">
                                    {doc?.consultationFee ?? appt.amount ?? 0}
                                </span>
                                <span className="text-xs text-light-secondary-text dark:text-dark-secondary-text">
                                    /consultation
                                </span>
                            </div>
                        </div>

                        <hr className="my-1 border-light-secondary-text/10 dark:border-dark-secondary-text/10" />

                        {/* Doctor Contact */}
                        <div className="flex flex-col gap-2">
                            <div className="flex flex-wrap gap-6 items-center mt-1">
                                {doc?.email && (
                                    <span className="flex items-center gap-1 text-xs text-light-secondary-text dark:text-dark-secondary-text">
                                        <Mail className="w-4 h-4 mr-1" />{" "}
                                        {doc.email}
                                    </span>
                                )}
                                {doc?.phone && (
                                    <span className="flex items-center gap-1 text-xs text-light-secondary-text dark:text-dark-secondary-text">
                                        <Phone className="w-4 h-4 mr-1" />{" "}
                                        {doc.phone}
                                    </span>
                                )}
                            </div>

                            {/* Payment Info */}
                            {appt.payment && (
                                <div className="flex flex-col gap-2 mt-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <CreditCard className="w-4 h-4 text-emerald-500" />
                                        <span className="text-xs font-medium text-light-primary-text dark:text-dark-primary-text">
                                            Payment Status:
                                        </span>
                                        {appt.payment.status === "paid" && (
                                            <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-md bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 font-semibold">
                                                <CheckCircle2 className="w-3 h-3" />
                                                Paid
                                            </span>
                                        )}
                                        {appt.payment.status === "pending" && (
                                            <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-md bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 font-semibold">
                                                <Clock className="w-3 h-3" />
                                                Pending
                                            </span>
                                        )}
                                        {appt.payment.status === "failed" && (
                                            <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-md bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 font-semibold">
                                                <XCircle className="w-3 h-3" />
                                                Failed
                                            </span>
                                        )}
                                        {![
                                            "paid",
                                            "pending",
                                            "failed",
                                        ].includes(appt.payment.status) && (
                                            <span className="text-xs px-2 py-0.5 rounded-md bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300 font-semibold capitalize">
                                                {appt.payment.status}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex flex-col gap-1 ml-6">
                                        {appt.payment.orderId && (
                                            <div className="flex items-center gap-1 text-xs text-light-secondary-text dark:text-dark-secondary-text">
                                                <Receipt className="w-3.5 h-3.5 mr-0.5" />
                                                <span>
                                                    Order ID:{" "}
                                                    {appt.payment.orderId}
                                                </span>
                                            </div>
                                        )}
                                        {appt.payment.paymentId && (
                                            <div className="flex items-center gap-1 text-xs text-light-secondary-text dark:text-dark-secondary-text">
                                                <CreditCard className="w-3.5 h-3.5 mr-0.5" />
                                                <span>
                                                    Payment ID:{" "}
                                                    {appt.payment.paymentId}
                                                </span>
                                            </div>
                                        )}
                                        {appt.payment.paidAt && (
                                            <div className="flex items-center gap-1 text-xs text-light-secondary-text dark:text-dark-secondary-text">
                                                <Calendar className="w-3.5 h-3.5 mr-0.5" />
                                                <span>
                                                    Paid on:{" "}
                                                    {new Date(
                                                        appt.payment.paidAt
                                                    ).toLocaleDateString(
                                                        "en-IN",
                                                        {
                                                            day: "numeric",
                                                            month: "short",
                                                            year: "numeric",
                                                            hour: "2-digit",
                                                            minute: "2-digit",
                                                        }
                                                    )}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                            {/* Review/Rating */}
                            {(appt.rating || appt.review) && (
                                <div className="flex items-center gap-1 mt-1">
                                    <ThumbsUp className="w-4 h-4 text-green-500" />
                                    {appt.rating && (
                                        <span className="text-xs">
                                            Rated: {appt.rating} / 5
                                        </span>
                                    )}
                                    {appt.review && (
                                        <span className="text-xs italic text-light-secondary-text dark:text-dark-secondary-text">
                                            "{appt.review}"
                                        </span>
                                    )}
                                </div>
                            )}
                            {/* Meta Info */}
                            <div className="flex flex-wrap gap-1 items-center mt-2 text-xs text-light-secondary-text dark:text-dark-secondary-text">
                                <Info className="w-4 h-4" />
                                <span>Appointment ID: {appt._id}</span>
                            </div>
                        </div>

                        {/* Inline Rating/Review Form if not rated */}
                        {appt.status === "completed" &&
                            !appt.ratingId &&
                            !submitted[appt._id] && (
                                <div className="mt-4 rounded-xl border border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-950/40 px-4 py-2 shadow-sm">
                                    <form
                                        onSubmit={(e) => {
                                            e.preventDefault();
                                            handleInlineRatingSubmit(appt);
                                        }}
                                        className="space-y-2">
                                        <div className="flex items-center gap-2 justify-between">
                                            <span className="font-semibold mr-2 text-light-primary-text dark:text-dark-primary-text">
                                                Rate your experience
                                            </span>
                                            <div className="flex items-center gap-1">
                                                {[1, 2, 3, 4, 5].map((star) => (
                                                    <button
                                                        type="button"
                                                        key={star}
                                                        className={
                                                            (formRating[
                                                                appt._id
                                                            ] || 5) >= star
                                                                ? "text-yellow-400 fill-yellow-400"
                                                                : "text-gray-200 fill-gray-200"
                                                        }
                                                        onClick={() =>
                                                            setFormRating(
                                                                (p) => ({
                                                                    ...p,
                                                                    [appt._id]:
                                                                        star,
                                                                })
                                                            )
                                                        }
                                                        disabled={
                                                            submitting[appt._id]
                                                        }>
                                                        <StarIcon className="w-5 h-5 fill-current" />
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <textarea
                                                className="w-full outline-none text-light-primary-text dark:text-dark-primary-text rounded p-2 min-h-[60px] text-sm"
                                                placeholder="Write a review (optional)"
                                                value={
                                                    formReview[appt._id] || ""
                                                }
                                                onChange={(e) =>
                                                    setFormReview((p) => ({
                                                        ...p,
                                                        [appt._id]:
                                                            e.target.value,
                                                    }))
                                                }
                                                disabled={submitting[appt._id]}
                                            />
                                            <button
                                                type="submit"
                                                className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-60"
                                                disabled={submitting[appt._id]}>
                                                {submitting[appt._id]
                                                    ? "Submitting..."
                                                    : "Submit"}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            )}
                        {/* Review/Rating BELOW the card IF completed and has ratingId */}
                        {appt.status === "completed" && appt.ratingId && (
                            <div className="mt-4 rounded-lg bg-light-surface dark:bg-dark-surface px-5 py-3 shadow-sm flex flex-col gap-2">
                                <div className="flex items-center gap-2 mb-0.5">
                                    <div className="flex items-center gap-1">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                type="button"
                                                key={star}
                                                className={
                                                    (appt.ratingId.rating ||
                                                        5) >= star
                                                        ? "text-yellow-400 fill-yellow-400"
                                                        : "text-gray-200 fill-gray-200"
                                                }>
                                                <StarIcon className="w-5 h-5 fill-current" />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                {appt.ratingId.review && (
                                    <div className="text-light-secondary-text dark:text-dark-secondary-text">
                                        {appt.ratingId.review}
                                    </div>
                                )}
                            </div>
                        )}
                        <div className="flex items-center justify-between">
                            {/* Meeting Link */}
                            {appt.meetingLink &&
                                appt.status !== "completed" && (
                                    <div className="flex w-40 items-center gap-1">
                                        <LinkIcon className="w-4 h-4 text-blue-500" />
                                        <a
                                            href={appt.meetingLink}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs text-blue-600 break-all">
                                            Join Meeting
                                        </a>
                                    </div>
                                )}
                            <div className="w-full flex items-center gap-3 justify-end">
                                {appt.status === "confirmed" &&
                                    appt.payment?.status !== "paid" && (
                                        <button
                                            onClick={() =>
                                                paymentClickHandler(
                                                    appt._id,
                                                    appt.amount ??
                                                        doc?.consultationFee ??
                                                        0
                                                )
                                            }
                                            disabled={
                                                processingPaymentId === appt._id
                                            }
                                            className="bg-light-primary hover:bg-light-primary-hover cursor-pointer dark:bg-dark-primary dark:hover:bg-dark-primary-hover  py-2 px-4 rounded-md text-dark-primary-text">
                                            {processingPaymentId ===
                                            appt._id ? (
                                                "Processing..."
                                            ) : (
                                                <span className="flex items-center text-dark-primary-text font-semibold gap-1">
                                                    <IndianRupee size={20} />
                                                    <p>Pay Now</p>
                                                </span>
                                            )}
                                        </button>
                                    )}

                                <div>
                                    {appt.cloudinaryFileUrl && (
                                        <button
                                            onClick={async () => {
                                                try {
                                                    // If URL is already present, use it; otherwise fetch appointment
                                                    let url =
                                                        appt.cloudinaryFileUrl;
                                                    if (!url) {
                                                        const resp =
                                                            await axios.get(
                                                                `${
                                                                    import.meta
                                                                        .env
                                                                        .VITE_SERVER_URL
                                                                }/api/appointment/${
                                                                    appt._id
                                                                }`
                                                            );
                                                        url =
                                                            resp.data?.data
                                                                ?.cloudinaryFileUrl;
                                                    }
                                                    if (!url) {
                                                        toast.error(
                                                            "No report file available for this appointment."
                                                        );
                                                        return;
                                                    }

                                                    // Guess type by file extension
                                                    const lower =
                                                        url.toLowerCase();
                                                    if (lower.endsWith(".pdf"))
                                                        setViewingType("pdf");
                                                    else if (
                                                        lower.match(
                                                            /\.(jpg|jpeg|png|gif|webp)$/
                                                        )
                                                    )
                                                        setViewingType("image");
                                                    else
                                                        setViewingType(
                                                            "unknown"
                                                        );

                                                    setViewingUrl(url);
                                                    setViewerOpen(true);
                                                } catch (err) {
                                                    console.error(err);
                                                    toast.error(
                                                        "Failed to load report"
                                                    );
                                                }
                                            }}
                                            className="inline-flex items-center gap-1 py-2 px-4 rounded-md  font-medium text-light-primary-text dark:text-dark-primary-text hover:bg-light-primary/10 dark:hover:bg-dark-primary/10 ml-2 bg-light-surface dark:bg-dark-surface">
                                            <FileText size={20} />
                                            View Report
                                        </button>
                                    )}
                                    {appt.prescription &&
                                        appt.prescription.length > 0 && (
                                            <button
                                                onClick={() => {
                                                    setPrescriptionItems(
                                                        appt.prescription || []
                                                    );
                                                    setPrescriptionMeta({
                                                        doctorName:
                                                            doc?.fullName || "",
                                                        date:
                                                            appt.createdAt ||
                                                            appt.scheduledAt,
                                                    });
                                                    setPrescriptionOpen(true);
                                                }}
                                                className="inline-flex items-center gap-1 py-2 px-4 rounded-md  font-medium text-light-primary-text dark:text-dark-primary-text hover:bg-light-primary/10 dark:hover:bg-dark-primary/10 ml-2 bg-light-surface dark:bg-dark-surface">
                                                <Pill size={20} />
                                                <p>Prescriptions</p>
                                            </button>
                                        )}
                                </div>
                                {appt.payment?.status === "paid" &&
                                    appt.status !== "cancelled" &&
                                    appt.status !== "completed" && (
                                        <span className="flex items-center gap-1 text-base px-3 py-2 rounded-md bg-light-success text-dark-primary-text dark:bg-dark-success dark:text-dark-primary-text font-semibold">
                                            <CheckCircle2 size={22} />
                                            Paid
                                        </span>
                                    )}
                                <button
                                    className="bg-light-primary dark:bg-dark-primary hover:bg-light-primary-hover dark:hover:bg-dark-primary-hover text-dark-primary-text font-semibold py-2 px-4 rounded-md"
                                    onClick={() => {
                                        setSelectedDoctor(doc);
                                        setOpen(true);
                                    }}>
                                    View Doctor
                                </button>
                            </div>
                        </div>
                        {open && selectedDoctor && (
                            <Drawer
                                open={open}
                                setOpen={setOpen}
                                doctor={selectedDoctor}
                            />
                        )}
                        {/* Prescription Modal */}
                        {prescriptionOpen && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                                <div className="w-full max-w-3xl max-h-[85vh] overflow-auto rounded-2xl bg-light-surface dark:bg-dark-bg p-4 shadow-lg">
                                    <div className="flex items-center justify-between mb-3">
                                        <div>
                                            <h4 className="text-lg font-semibold text-light-primary-text dark:text-dark-primary-text">
                                                Prescription
                                            </h4>
                                            <p className="text-xs text-light-secondary-text dark:text-dark-secondary-text">
                                                Prescribed by{" "}
                                                {prescriptionMeta.doctorName ||
                                                    "Doctor"}{" "}
                                                {prescriptionMeta.date
                                                    ? `on ${new Date(
                                                          prescriptionMeta.date
                                                      ).toLocaleString()}`
                                                    : ""}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() =>
                                                    setPrescriptionOpen(false)
                                                }
                                                className="px-2 py-1 rounded text-light-primary-text dark:text-dark-primary-text hover:bg-light-bg dark:hover:bg-dark-surface">
                                                <X />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        {prescriptionItems &&
                                        prescriptionItems.length > 0 ? (
                                            prescriptionItems.map(
                                                (item, idx) => (
                                                    <div
                                                        key={idx}
                                                        className="rounded-lg p-3 bg-light-surface dark:bg-dark-surface">
                                                        <div className="flex items-start justify-between gap-3">
                                                            <div className="flex-1 text-light-primary-text dark:text-dark-primary-text">
                                                                <div className="text-md font-semibold">
                                                                    {item.medicine ||
                                                                        "Unknown medicine"}
                                                                </div>
                                                                {item.notes && (
                                                                    <div className="text-sm text-light-secondary-text dark:text-dark-secondary-text mt-1">
                                                                        {
                                                                            item.notes
                                                                        }
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="text-right text-sm text-light-primary-text dark:text-dark-primary-text">
                                                                <div className="font-medium">
                                                                    {item.dosage ||
                                                                        "-"}
                                                                </div>
                                                                <div className="text-light-secondary-text dark:text-dark-secondary-text mt-2">
                                                                    {item.frequency ||
                                                                        "-"}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )
                                            )
                                        ) : (
                                            <div className="text-sm text-light-secondary-text dark:text-dark-secondary-text">
                                                No prescriptions available.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default AppointmentsList;
