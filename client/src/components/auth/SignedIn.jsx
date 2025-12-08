import { useAuth } from "../context/AuthContext";

export const SignedIn = ({ children }) => {
  const { user } = useAuth();
  return user ? children : null;
};
