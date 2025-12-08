import { useAuth } from "../context/AuthContext";

export const SignedOut = ({ children }) => {
    const { user } = useAuth();
    return !user ? children : null;
};
