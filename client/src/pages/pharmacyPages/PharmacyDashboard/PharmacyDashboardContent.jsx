import { useAuth, useUser } from "@clerk/clerk-react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import {
    Bell,
    Building2,
    CheckCircle,
    ChevronRight,
    Clock,
    FileText as FileTextIcon,
    Package,
    Plus,
    Settings,
    ShoppingBag,
    Star,
    Users,
    MapPin,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import Loader from "../../../components/main/Loader";
import InventoryManagement from "../../../components/pharmcy/InventoryManagement";
import LeafletMap from "../../../components/pharmcy/LeafletMap";
import BillHistory from "../../../components/pharmcy/BillHistory";
import CreateBill from "../../../components/pharmcy/CreateBill";

const PharmacyDashboardContent = (props) => {
    const [pharmacyData, setPharmacyData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [locationData, setLocationData] = useState({
        latitude: 19.076,
        longitude: 72.8777,
        name: "",
        address: "",
    });

    const { user } = useUser();
    const { getToken } = useAuth();
    const navigate = useNavigate();
    const routerLocation = useLocation();
    const searchParams = new URLSearchParams(routerLocation.search);

    const view = props?.viewOverride || searchParams.get("view") || "overview";

    useEffect(() => {
        fetchPharmacyData();
    }, [user, getToken]);

    const fetchPharmacyData = async () => {
        if (!user) return;
        try {
            setLoading(true);
            const token = await getToken();
            const response = await axios.get(
                `${import.meta.env.VITE_SERVER_URL}/api/pharmacy/get-pharmacy/${user.id
                }`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data.success) {
                const pharmacy = response.data.data;
                setPharmacyData(pharmacy);

                const baseLocation = {
                    latitude: 19.076,
                    longitude: 72.8777,
                    name: pharmacy.pharmacyName || "",
                    address: pharmacy.address || "",
                };

                setLocationData(baseLocation);

                try {
                    const locationRes = await axios.get(
                        `${import.meta.env.VITE_SERVER_URL
                        }/api/pharmacyLocation/${pharmacy._id}/location`,
                        { headers: { Authorization: `Bearer ${token}` } }
                    );

                    if (
                        locationRes.data?.success &&
                        locationRes.data.data?.location
                    ) {
                        const loc = locationRes.data.data.location;
                        const [lng, lat] = loc.coordinates || [];

                        if (lat && lng) {
                            setLocationData({
                                latitude: lat,
                                longitude: lng,
                                name:
                                    locationRes.data.data.name ||
                                    baseLocation.name,
                                address:
                                    locationRes.data.data.address ||
                                    baseLocation.address,
                            });
                        }
                    }
                } catch { }

                console.log("Fetched pharmacy data:", pharmacy);
            }
        } catch (error) {
            console.log("Error:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleLocationChange = async (payload) => {
        if (!pharmacyData?._id) return;

        const { latitude, longitude, name, address } = payload || {};
        if (typeof latitude !== "number" || typeof longitude !== "number") {
            console.warn("[PharmacyDashboard] Invalid coordinates from LeafletMap", payload);
            return;
        }

        try {
            const token = await getToken();
            await axios.put(
                `${import.meta.env.VITE_SERVER_URL}/api/pharmacyLocation/${pharmacyData._id}/location`,
                {
                    latitude,
                    longitude,
                    name: name || pharmacyData.pharmacyName || "",
                    address: address || pharmacyData.address || "",
                },
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            setLocationData((prev) => ({
                ...prev,
                latitude,
                longitude,
                name: name || prev.name || pharmacyData.pharmacyName || "",
                address: address || prev.address || pharmacyData.address || "",
            }));
        } catch (error) {
            console.error(
                "[PharmacyDashboard] Failed to update pharmacy location:",
                error.response?.data || error.message
            );
        }
    };

    const formatDate = (date) => {
        if (!date) return "N/A";
        return new Date(date).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };

    const getGreeting = () => {
        const hour = currentTime.getHours();
        if (hour < 12) return "Good morning";
        if (hour < 17) return "Good afternoon";
        return "Good evening";
    };

    if (loading) return <Loader />;

    if (!pharmacyData) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-light-primary-text dark:text-dark-primary-text mb-2">
                        Pharmacy Not Found
                    </h2>
                    <p className="text-light-secondary-text dark:text-dark-secondary-text">
                        Please complete your pharmacy registration first.
                    </p>
                </div>
            </div>
        );
    }

    // ------------------------------
    //       MAIN LAYOUT VIEWS
    // ------------------------------

    if (view === "create-bill")
        return (
            <div className="w-full mx-auto py-6">
                <button
                    onClick={() => navigate("/pharmacy/dashboard")}
                    className="mb-4 px-4 py-2 rounded-md bg-blue-600 text-white">
                    Back
                </button>

                <div className="rounded-xl bg-light-surface dark:bg-dark-bg p-6 shadow-md">
                    <CreateBill
                        ownerId={pharmacyData._id}
                        pharmacyName={pharmacyData.pharmacyName}
                    />
                </div>
            </div>
        );

    if (view === "inventory")
        return (
            <div className="w-full mx-auto py-6">
                <button
                    onClick={() => navigate("/pharmacy/dashboard")}
                    className="mb-4 px-4 py-2 rounded-md bg-blue-600 text-white">
                    Back
                </button>

                <div className="rounded-xl bg-light-surface dark:bg-dark-bg p-6 shadow-md">
                    <InventoryManagement ownerId={pharmacyData._id} />
                </div>
            </div>
        );

    if (view === "bills")
        return (
            <div className="w-full mx-auto py-6">
                <button
                    onClick={() => navigate("/pharmacy/dashboard")}
                    className="mb-4 px-4 py-2 rounded-md bg-blue-600 text-white">
                    Back
                </button>

                <div className="rounded-xl bg-light-surface dark:bg-dark-bg p-6 shadow-md">
                    <BillHistory ownerId={pharmacyData._id} />
                </div>
            </div>
        );

    if (view === "location")
        return (
            <div className="w-full mx-auto py-6">
                <div className="flex justify-between items-center mb-4">
                    <h1 className="text-xl font-semibold text-light-primary-text dark:text-dark-primary-text">
                        Manage Pharmacy Location
                    </h1>
                    <button
                        onClick={() => navigate("/pharmacy/dashboard")}
                        className="px-4 py-2 rounded-md bg-blue-600 text-white">
                        Back
                    </button>
                </div>

                <div className="rounded-xl bg-light-surface dark:bg-dark-bg p-6 shadow-md">
                    <LeafletMap
                        latitude={locationData.latitude}
                        longitude={locationData.longitude}
                        pharmacyName={locationData.name}
                        address={locationData.address}
                        height="500px"
                        clickable={true}
                        showAddLocation={true}
                        onLocationChange={handleLocationChange}
                    />
                </div>
            </div>
        );

    return (
        <div className="w-full h-screen mx-auto space-y-6">
            {/* HEADER SECTION */}
            <div className="rounded-3xl p-6 bg-light-surface dark:bg-dark-bg shadow-md">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
                    {/* LEFT: Greeting + Icon */}
                    <div className="flex items-center gap-4">
                        <div className="w-24 h-24 bg-light-primary dark:bg-dark-primary rounded-full flex items-center justify-center">
                            <Building2 className="w-12 h-12 text-white" />
                        </div>

                        <div>
                            <h1 className="text-3xl font-bold text-light-primary-text dark:text-dark-primary-text">
                                {getGreeting()}, {pharmacyData.ownerName}!
                            </h1>

                            <p className="text-light-secondary-text dark:text-dark-secondary-text">
                                {pharmacyData.pharmacyName}
                            </p>

                            <div className="flex items-center gap-3 mt-2">
                                <span className="text-sm text-light-secondary-text dark:text-dark-secondary-text">
                                    {formatDate(currentTime)}
                                </span>

                                <span className="px-3 py-1 text-xs rounded-full bg-gray-800 text-gray-200">
                                    New
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT: Stats */}
                    <div className="flex gap-4 lg:justify-end">
                        <div className="bg-light-bg dark:bg-dark-surface p-4 rounded-xl text-center">
                            <Star className="w-7 h-7 mx-auto text-yellow-500" />
                            <p className="text-sm text-light-secondary-text dark:text-dark-secondary-text">
                                Rating
                            </p>
                            <h2 className="text-2xl font-bold text-light-primary-text dark:text-dark-primary-text">
                                {pharmacyData.rating?.average || "0.0"}
                            </h2>
                        </div>

                        <div className="bg-light-bg dark:bg-dark-surface p-4 rounded-xl text-center">
                            <Package className="w-7 h-7 mx-auto text-light-primary dark:text-dark-primary" />
                            <p className="text-sm text-light-secondary-text dark:text-dark-secondary-text">
                                Services
                            </p>
                            <h2 className="text-2xl font-bold text-light-primary-text dark:text-dark-primary-text">
                                {pharmacyData.services?.length || 0}
                            </h2>
                        </div>
                    </div>
                </div>
            </div>

            {/* GRID: INFO CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {/* Pharmacy Information Card */}
                <div className="w-full rounded-2xl p-6 shadow-md bg-light-surface dark:bg-dark-bg">
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-light-primary-text dark:text-dark-primary-text">
                        <Building2 className="w-5 h-5 text-light-primary dark:text-dark-primary" />
                        Pharmacy Information
                    </h2>

                    <div className="space-y-2 text-sm text-light-primary-text dark:text-dark-primary-text">
                        <p>
                            <strong className="text-light-primary-text dark:text-dark-primary-text">
                                Name:
                            </strong>{" "}
                            {pharmacyData.pharmacyName}
                        </p>
                        <p>
                            <strong className="text-light-primary-text dark:text-dark-primary-text">
                                Owner:
                            </strong>{" "}
                            {pharmacyData.ownerName}
                        </p>
                        <p>
                            <strong className="text-light-primary-text dark:text-dark-primary-text">
                                Email:
                            </strong>{" "}
                            {pharmacyData.email}
                        </p>
                        <p>
                            <strong className="text-light-primary-text dark:text-dark-primary-text">
                                Phone:
                            </strong>{" "}
                            {pharmacyData.phone}
                        </p>
                        <p>
                            <strong className="text-light-primary-text dark:text-dark-primary-text">
                                Address:
                            </strong>{" "}
                            {pharmacyData.address}
                        </p>
                    </div>
                </div>
                <div className="w-full rounded-2xl p-6 shadow-md bg-light-surface dark:bg-dark-bg">
                    {/* Quick Actions */}
                    <h3 className="font-bold mb-3 flex items-center gap-2 text-light-primary-text dark:text-dark-primary-text">
                        <Plus className="w-5 h-5 text-light-primary dark:text-dark-primary" />
                        Quick Actions
                    </h3>

                    <div className="space-y-2">
                        {[
                            {
                                label: "Manage Inventory",
                                view: "inventory",
                                color: "bg-blue-500",
                                icon: ShoppingBag,
                            },
                            {
                                label: "Create Bill",
                                view: "create-bill",
                                color: "bg-green-500",
                                icon: FileTextIcon,
                            },
                            {
                                label: "Billing History",
                                view: "bills",
                                color: "bg-purple-500",
                                icon: FileTextIcon,
                            },
                            {
                                label: "Manage Location",
                                view: "location",
                                color: "bg-orange-500",
                                icon: Package,
                            },
                        ].map((item, index) => (
                            <button
                                key={index}
                                onClick={() =>
                                    navigate(
                                        `/pharmacy/${item.view === "inventory"
                                            ? "manage-inventory"
                                            : item.view === "create-bill"
                                                ? "create-bill"
                                                : item.view === "bills"
                                                    ? "billing-history"
                                                    : "my-location"
                                        }`
                                    )
                                }
                                className="w-full flex items-center gap-3 bg-light-background dark:bg-dark-background p-3 rounded-xl hover:bg-light-primary/10 dark:hover:bg-dark-primary/10 transition">
                                <div
                                    className={`w-8 h-8 ${item.color} text-white rounded-lg flex items-center justify-center`}>
                                    <item.icon className="w-4 h-4" />
                                </div>

                                <span className="font-medium text-light-primary-text dark:text-dark-primary-text">
                                    {item.label}
                                </span>

                                <ChevronRight className="ml-auto w-4 h-4 text-light-primary-text dark:text-dark-primary-text" />
                            </button>
                        ))}
                    </div>
                </div>

                {/* Business Details */}
                <div className="w-full rounded-2xl bg-light-surface dark:bg-dark-bg p-6 shadow-md">
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-light-primary-text dark:text-dark-primary-text">
                        <FileTextIcon className="w-5 h-5 text-light-primary dark:text-dark-primary" />
                        Business Details
                    </h2>

                    <div className="space-y-2 text-sm text-light-primary-text dark:text-dark-primary-text">
                        <p>
                            <strong className="text-light-primary-text dark:text-dark-primary-text">
                                Registration:
                            </strong>{" "}
                            {pharmacyData.registrationType}
                        </p>

                        {pharmacyData.gstNumber && (
                            <p>
                                <strong className="text-light-primary-text dark:text-dark-primary-text">
                                    GST:
                                </strong>{" "}
                                {pharmacyData.gstNumber}
                            </p>
                        )}

                        <p className="flex items-center gap-2">
                            <strong className="text-light-primary-text dark:text-dark-primary-text">
                                Status:
                            </strong>{" "}
                            <span className="px-3 py-1 text-xs rounded-full bg-gray-800 text-gray-200">
                                {pharmacyData.verificationStatus}
                            </span>
                        </p>

                        {pharmacyData.description && (
                            <p>
                                <strong className="text-light-primary-text dark:text-dark-primary-text">
                                    Description:
                                </strong>{" "}
                                {pharmacyData.description}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PharmacyDashboardContent;
