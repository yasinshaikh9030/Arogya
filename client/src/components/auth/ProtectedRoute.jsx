import { Navigate, useLocation } from "react-router-dom";
import { useUser } from "../../context/UserContext";

export default function ProtectedRoute({ children, requiredRole }) {
	const location = useLocation();
	const { isLoaded, isSignedIn, user } = useUser();

	console.log(isLoaded, isSignedIn, user)

	if (!isLoaded) return null;
	if (!isSignedIn) {
		return <Navigate to="/" replace state={{ from: location }} />;
	}

	console.log(user.metadata);
	const rawRole = user?.metadata?.role || user?.metadata?.role || "";
	const role = typeof rawRole === "string" ? rawRole.trim().toLowerCase() : "";

	if (requiredRole) {
		const required = String(requiredRole).trim().toLowerCase();
		if (role !== required) {
			return <Navigate to="/dashboard" replace />;
		}
	}

	return children;
}


