import {
    ArrowRight,
    Book,
    Brain,
    ChartColumnIncreasing,
    DollarSign,
    File,
    FileText,
    Headset,
    LayoutDashboard,
    Phone,
    Pill,
    Settings,
    Stethoscope,
    Venus,
    Search,
    Megaphone,
    Album,
    Calendar,
    Map,
    PackageSearch,
    FilePlus2,
    History,
    MapPin,
    Settings2,
    AlertTriangle,
} from "lucide-react";
import { useUser } from "./context/UserContext";
import { useEffect } from "react";
import {
    BrowserRouter,
    Navigate,
    Route,
    Routes,
    useNavigate,
} from "react-router-dom";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import RoleRedirect from "./components/auth/RoleRedirect";
import LandingPage from "./pages/LandingPage";
import Onboarding from "./pages/auth/Onboarding";
import PostDetail from "./pages/community/PostDetail";
import AccountEarning from "./pages/doctorPages/AccountEarnings/AccountEarning";
import DoctorArticles from "./pages/doctorPages/DoctorArticles/DoctorArticles";
import MyAppointments from "./pages/doctorPages/MyAppointments/MyAppointments";
import PatientCommunity from "./pages/patientPages/CommunityHealth/PatientCommunity";
import GetAppointment from "./pages/patientPages/GetAppointment/GetAppointment";
import MenstrualHealth from "./pages/patientPages/MenstrualHealth/MenstrualHealth";
import PatientDashboard from "./pages/patientPages/PatientDashboard/PatientDashboard";
import SheReads from "./pages/patientPages/SheReads/SheReads";
import SymptomChecker from "./pages/patientPages/SymptomChecker/SymptomChecker";
import PharmacyDashboard from "./pages/pharmacyPages/PharmacyDashboard/PharmacyDashboard";
import VideoAppointment from "./components/Doctor/VideoAppointment";
import MedicineSearch from "./pages/patientPages/MedicineSearch/MedicineSearch";
import AdminDashboard from "./pages/adminPages/Dashboard/AdminDashboard";
import ManageDoctors from "./pages/adminPages/ManageDoctors/ManageDoctors";
import AdminAppointments from "./pages/adminPages/AdminAppointments/AdminAppointments";
import LocationMap from "./pages/adminPages/LocationMap/LocationMap";
import Emergencies from "./pages/adminPages/Emergencies/Emergencies";
import EmergencyVideo from "./pages/adminPages/Emergencies/EmergencyVideo";
import Doc from "./pages/doctorPages/Doc/Doc"

const patientTabs = [
    {
        id: 1,
        name: "Dashboard",
        icon: LayoutDashboard,
        path: "/patient/dashboard",
    },
    {
        id: 2,
        name: "Symptoms Checker",
        icon: Pill,
        path: "/patient/symptom-checker",
    },
    {
        id: 3,
        name: "SheReads",
        icon: Album,
        path: "/patient/she-reads",
    },
    {
        id: 4,
        name: "Menstrual Health",
        icon: Venus,
        path: "/patient/menstrual-health",
    },
    {
        id: 5,
        name: "Get Appointment",
        icon: Stethoscope,
        path: "/patient/get-appointment",
    },
    {
        id: 6,
        name: "Search Medicine",
        icon: Search,
        path: "/patient/medicine-search",
    },
    {
        id: 7,
        name: "Community Health",
        icon: Megaphone,
        path: "/patient/community",
    },
];

const doctorTabs = [
    {
        id: 1,
        name: "Dashboard",
        icon: LayoutDashboard,
        path: "/doctor/dashboard",
    },
    {
        id: 2,
        name: "Account & Earning",
        icon: DollarSign,
        path: "/doctor/account-earning",
    },
    {
        id: 3,
        name: "My Appointment",
        icon: Stethoscope,
        path: "/doctor/my-appointments",
    },
    {
        id: 4,
        name: "Community Health",
        icon: File,
        path: "/doctor/articles",
    },
];

const pharmacyTabs = [
    {
        id: 1,
        name: "Dashboard",
        icon: LayoutDashboard,
        path: "/pharmacy/dashboard",
    },
    {
        id: 2,
        name: "Manage Inventory",
        icon: PackageSearch, // inventory icon
        path: "/pharmacy/manage-inventory",
    },
    {
        id: 3,
        name: "Create Bill",
        icon: FilePlus2, // bill creation icon
        path: "/pharmacy/create-bill",
    },
    {
        id: 4,
        name: "Billing History",
        icon: History, // history icon
        path: "/pharmacy/billing-history",
    },
    {
        id: 5,
        name: "My Location",
        icon: MapPin, // map/location icon
        path: "/pharmacy/my-location",
    },
];

const adminTabs = [
    {
        id: 1,
        name: "Dashboard",
        icon: ChartColumnIncreasing,
        path: "/admin/dashboard",
    },
    {
        id: 2,
        name: "Manage Doctors",
        icon: Headset,
        path: "/admin/manage-doctors",
    },
    {
        id: 3,
        name: "Appointments",
        icon: Calendar,
        path: "/admin/appointments",
    },
    {
        id: 4,
        name: "Location Map",
        icon: Map,
        path: "/admin/location-map",
    },
    {
        id: 5,
        name: "Emergencies",
        icon: AlertTriangle,
        path: "/admin/emergencies",
    },
];

const VideoAppointmentEntry = () => {
    const { user, isLoaded } = useUser();
    console.log("user", user);
    const navigate = useNavigate();

    useEffect(() => {
        if (!isLoaded) return;

        if (!user) {
            navigate("/", { replace: true });
            return;
        }

        const role = (
            user.metadata?.role ||
            user.metadata?.role ||
            "patient"
        ).toString();
        const normalized = role.toLowerCase();

        // Preserve query parameters (like roomID) when redirecting
        const searchParams = new URLSearchParams(window.location.search);
        const queryString = searchParams.toString();
        const redirectUrl = `/video-appointment/${encodeURIComponent(
            normalized
        )}${queryString ? `?${queryString}` : ""}`;

        navigate(redirectUrl, {
            replace: true,
        });
    }, [isLoaded, user, navigate]);

    return null;
};

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<LandingPage />} />

                {/* Onboarding */}
                <Route path="/onboarding" element={<Onboarding />} />

                {/* Dashboards */}
                <Route
                    path="/dashboard"
                    element={
                        <ProtectedRoute>
                            <RoleRedirect />
                        </ProtectedRoute>
                    }
                />

                {/* TODO: PATIENTS */}
                <Route
                    path="/patient/dashboard"
                    element={
                        <ProtectedRoute requiredRole="Patient">
                            <PatientDashboard tabs={patientTabs} />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/patient/symptom-checker"
                    element={
                        <ProtectedRoute requiredRole="Patient">
                            <SymptomChecker tabs={patientTabs} />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/patient/she-reads"
                    element={
                        <ProtectedRoute requiredRole="Patient">
                            <SheReads tabs={patientTabs} />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/patient/menstrual-health"
                    element={
                        <ProtectedRoute requiredRole="Patient">
                            <MenstrualHealth tabs={patientTabs} />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/patient/get-appointment"
                    element={
                        <ProtectedRoute requiredRole="Patient">
                            <GetAppointment tabs={patientTabs} />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/patient/community"
                    element={
                        <ProtectedRoute requiredRole="Patient">
                            <PatientCommunity tabs={patientTabs} />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/community/post/:id"
                    element={
                        <ProtectedRoute>
                            <PostDetail />
                        </ProtectedRoute>
                    }
                />

                {/* TODO: DOCTORS */}
                <Route
                    path="/patient/medicine-search"
                    element={
                        <ProtectedRoute requiredRole="Patient">
                            <MedicineSearch tabs={patientTabs} />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/doctor/account-earning"
                    element={
                        <ProtectedRoute requiredRole="Doctor">
                            <AccountEarning tabs={doctorTabs} />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/doctor/dashboard"
                    element={
                        <ProtectedRoute requiredRole="Doctor">
                            <Doc tabs={doctorTabs} />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/doctor/my-appointments"
                    element={
                        <ProtectedRoute requiredRole="Doctor">
                            <MyAppointments tabs={doctorTabs} />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/video-appointment/:role"
                    element={<VideoAppointment />}
                />
                <Route
                    path="/doctor/articles"
                    element={
                        <ProtectedRoute requiredRole="Doctor">
                            <DoctorArticles tabs={doctorTabs} />
                        </ProtectedRoute>
                    }
                />

                {/* TODO: PHARMACIES */}
                <Route
                    path="/pharmacy/dashboard"
                    element={
                        <ProtectedRoute requiredRole="Pharmacy">
                            <PharmacyDashboard tabs={pharmacyTabs} />
                        </ProtectedRoute>
                    }
                />

                {/* Pharmacy subpages - use dedicated routes */}
                <Route
                    path="/pharmacy/manage-inventory"
                    element={
                        <ProtectedRoute requiredRole="Pharmacy">
                            <PharmacyDashboard
                                tabs={pharmacyTabs}
                                view="inventory"
                            />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/pharmacy/create-bill"
                    element={
                        <ProtectedRoute requiredRole="Pharmacy">
                            <PharmacyDashboard
                                tabs={pharmacyTabs}
                                view="create-bill"
                            />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/pharmacy/billing-history"
                    element={
                        <ProtectedRoute requiredRole="Pharmacy">
                            <PharmacyDashboard
                                tabs={pharmacyTabs}
                                view="bills"
                            />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/pharmacy/my-location"
                    element={
                        <ProtectedRoute requiredRole="Pharmacy">
                            <PharmacyDashboard
                                tabs={pharmacyTabs}
                                view="location"
                            />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/admin/dashboard" 
                    element={
                        <ProtectedRoute requiredRole="Admin">
                            <AdminDashboard tabs={adminTabs} />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/admin/manage-doctors"
                    element={
                        <ProtectedRoute requiredRole="Admin">
                            <ManageDoctors tabs={adminTabs} />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/admin/appointments"
                    element={
                        <ProtectedRoute requiredRole="Admin">
                            <AdminAppointments tabs={adminTabs} />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/admin/location-map"
                    element={
                        <ProtectedRoute requiredRole="Admin">
                            <LocationMap tabs={adminTabs} />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/admin/emergencies"
                    element={
                        <ProtectedRoute requiredRole="Admin">
                            <Emergencies tabs={adminTabs} />
                        </ProtectedRoute>
                    }
                />
                
                <Route
                    path="/emergency-appointment"
                    element={<EmergencyVideo />}
                />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
