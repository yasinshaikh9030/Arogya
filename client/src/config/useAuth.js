// src/firebase/useAuth.js

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./config"; // adjust path if needed

export function useAuth() {
    const [user, setUser] = useState(null);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (firebaseUser) => {
            setUser(firebaseUser);
            setIsLoaded(true);
        });

        return () => unsub();
    }, []);

    const getToken = async (forceRefresh = false) => {
        if (!auth.currentUser) return null;
        return await auth.currentUser.getIdToken(forceRefresh);
    };

    return {
        user,
        isLoaded,
        isSignedIn: !!user,
        isSignedOut: !user,
        getToken,
    };
}
