import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../config/config";

const UserContext = createContext(null);

export function UserProvider({ children }) {
    const [user, setUser] = useState(null);
    const [isLoaded, setIsLoaded] = useState(false);

    const loadProfile = (uid) => {
        if (!uid) return null;
        const data = localStorage.getItem(`arogya-profile-${uid}`);
        console.log(data);

        if (!data) return null;
        try {
            return JSON.parse(data);
        } catch (e) {
            console.warn("Failed to parse stored profile", e);
            return null;
        }
    };

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (firebaseUser) => {
            console.log(firebaseUser);
            if (firebaseUser) {
                const profile = loadProfile(firebaseUser.uid);
                const mergedUser = {
                    ...firebaseUser,
                    metadata: {
                        role: profile?.role || "",
                        onboardingCompleted: !!profile?.onboardingCompleted,
                        ...(profile?.patientData
                            ? { patientData: profile.patientData }
                            : {}),
                        ...(profile?.doctorData
                            ? { doctorData: profile.doctorData }
                            : {}),
                        ...(profile?.pharmacyData
                            ? { pharmacyData: profile.pharmacyData }
                            : {}),
                        ...(profile?.adminData
                            ? { adminData: profile.adminData }
                            : {}),
                    },
                };
                setUser(mergedUser);
            } else {
                setUser(null);
            }
            setIsLoaded(true);
        });

        return () => unsub();
    }, []);

    return (
        <UserContext.Provider
            value={{
                user,
                isLoaded,
                isSignedIn: !!user,
            }}>
            {children}
        </UserContext.Provider>
    );
}

export const useUser = () => useContext(UserContext);
