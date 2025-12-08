import { useAuth } from "../../context/AuthContext";
import { logout } from "../../components/auth/authFunctions";

export default function UserButton() {
    const { user } = useAuth();

    if (!user) return null;

    return (
        <div className="user-menu">
            <img
                src={user.photoURL || "/default-avatar.png"}
                alt="Profile"
                className="user-avatar"
            />
            <div className="dropdown">
                <p>{user.email || user.phoneNumber}</p>
                <button onClick={logout}>Logout</button>
            </div>
        </div>
    );
}
