import WomenHealthCalendar from '../../../components/patient/WomenHealthCalendar';
import { useUser } from '../../../context/UserContext';
import axios from 'axios';
import React, { useEffect, useState } from 'react';
import WomenHealthHistory from '../../../components/patient/WomenHealthHistory';
import Loader from '../../../components/main/Loader';
import { auth } from '../../../config/config';

const MenstrualHealthContent = () => {
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const { user } = useUser();


    useEffect(() => {
        const fetchUserData = async () => {
            if (!user) return;
            try {
                setLoading(true);
                const token = await auth.currentUser.getIdToken();

                const response = await axios.get(
                    `${import.meta.env.VITE_SERVER_URL}/api/patient/get-patient/${auth.currentUser.uid}`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );
                setUserData(response.data);
            } catch (error) {
                console.error('Error fetching user data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchUserData();
    }, [user]);

    if (loading) return <Loader/>;

    return (
        <div>
            <h1 className="text-3xl font-bold text-light-primary-text mb-4 dark:text-dark-primary-text">
                Women Health Content
            </h1>
            {userData && <WomenHealthCalendar patientId={user.uid} />}
            {userData && <WomenHealthHistory patientId={user.uid} />}
        </div>
    );
};

export default MenstrualHealthContent;
