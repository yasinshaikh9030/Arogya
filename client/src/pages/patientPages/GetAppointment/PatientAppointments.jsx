import axios from "axios";
import React, { useEffect, useState } from "react";
import Loader from "../../../components/main/Loader";
import AppointmentsList from "../../../components/patient/AppointmentsList";
import { useUser } from '../../../context/UserContext';
import { auth } from "../../../config/config";

const PatientAppointments = () => {
    const { user } = useUser();
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

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
                
                // Filter to only show confirmed appointments
                const allAppointments = res.data?.data || [];
                const confirmedAppointments = allAppointments.filter(
                    (appt) => appt.status === "confirmed" || appt.status === "pending"
                );
                setAppointments(confirmedAppointments);
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
                No appointments found.
            </div>
        );
    }

    return (
        <AppointmentsList appointments={appointments}/>
    );
};

export default PatientAppointments;
