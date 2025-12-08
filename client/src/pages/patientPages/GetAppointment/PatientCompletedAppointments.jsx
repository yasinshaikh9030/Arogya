import React, { useEffect, useState } from "react";
import axios from "axios";
import { useUser } from '../../../context/UserContext';
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
    Info,
} from "lucide-react";
import AppointmentsList from "../../../components/patient/AppointmentsList";
import RatingDialog from "../../../components/patient/RatingDialog";
import Loader from "../../../components/main/Loader";
import { auth } from "../../../config/config";

const PatientCompletedAppointments = () => {
    const { user } = useUser();
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    // new for rating dialog
    const [showRatingModal, setShowRatingModal] = useState(false);
    const [selectedRatingAppt, setSelectedRatingAppt] = useState(null);

    useEffect(() => {
        if (!user) return;
        let mounted = true;
        (async () => {
            try {
                setLoading(true);
                const token = await auth.currentUser.getIdToken();
                const res = await axios.get(
                    `${import.meta.env.VITE_SERVER_URL}/api/appointment/patient/${user.uid}`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                if (!mounted) return;
                // Fix: always set to array of completed appointments
                const completed = Array.isArray(res.data?.data)
                    ? res.data.data.filter(
                        (appt) =>
                            appt.status === "completed" ||
                            appt.status === "cancelled"
                    )
                    : [];
                setAppointments(completed);

                // rating popup logic
                const unrated = completed.find(
                  appt => appt.status === "completed" && (!appt.rating && !appt.review)
                );
                if (unrated) {
                  setSelectedRatingAppt(unrated);
                  setShowRatingModal(true);
                }
            } catch (err) {
                setError("Failed to load completed appointments");
                console.error(err?.response?.data || err);
            } finally {
                if (mounted) setLoading(false);
            }
        })();
        return () => {
            mounted = false;
        };
    }, [user]);

    const handleRatingSubmit = async (rating, review) => {
      try {
        await axios.post(`${import.meta.env.VITE_SERVER_URL}/api/appointment/${selectedRatingAppt._id}/rating`, {
          patientId: user.uid,
          doctorId: selectedRatingAppt.doctorId?._id || selectedRatingAppt.doctorId,
          rating,
          review,
        });
        setShowRatingModal(false);
        // Optionally: reload appointments to update UI
        window.location.reload();
      } catch (err) {
        alert("Failed to submit rating. Please try again.");
      }
    };

    if (loading) {
        return <Loader/>;
    }
    if (error) {
        return (
            <div className="p-6 text-red-600 dark:text-red-400">{error}</div>
        );
    }
    if (appointments.length === 0) {
        return (
            <div className="p-6 text-light-secondary-text dark:text-dark-secondary-text">
                No completed appointments found.
            </div>
        );
    }

    return <>
        <AppointmentsList appointments={appointments} />
        {/* Rating dialog */}
        {/* {showRatingModal && selectedRatingAppt && (
          <RatingDialog
            appointment={selectedRatingAppt}
            onSubmit={handleRatingSubmit}
            onClose={() => setShowRatingModal(false)}
          />
        )} */}
    </>;
};

export default PatientCompletedAppointments;
