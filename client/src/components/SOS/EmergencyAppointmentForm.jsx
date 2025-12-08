import React, { useState, useEffect } from "react";
import {
    X,
    Phone,
    User,
    AlertCircle,
    Calendar,
    Clock,
    FileText,
    Send,
} from "lucide-react";
import { useAuth } from "@clerk/clerk-react";
import axios from "axios";
import { toast } from "react-hot-toast";

const EmergencyAppointmentForm = ({
    isOpen,
    onClose,
    userLocation,
    userId,
}) => {
    const [formData, setFormData] = useState({
        phone: "",
        fullName: "",
    });
    const [loading, setLoading] = useState(false);
    const { getToken } = useAuth();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation
        // if (!formData.phone || !formData.fullName) {
        //     toast.error("Please fill in all required fields");
        //     return;
        // }

        if (
            !formData.phone.match(
                /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/
            )
        ) {
            toast.error("Please enter a valid phone number");
            return;
        }

        try {
            setLoading(true);
            const token = await getToken();

            // Gather required appointment data for emergency API
            const appointmentData = {
                // fullName: formData.fullName,
                phone: formData.phone,
                location: {
                    latitude: userLocation?.latitude || null,
                    longitude: userLocation?.longitude || null,
                },
            };

            const response = await axios.post(
                `${import.meta.env.VITE_SERVER_URL}/api/emergency/`,
                appointmentData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            if (response.data.success) {
                toast.success(
                    "Location has been shared, Doctor will get back to you"
                );
                onClose();
                // Reset form
                setFormData({
                    phone: "",
                    fullName: "",
                });
            } else {
                toast.error(
                    response.data.message ||
                        "Failed to create emergency appointment"
                );
            }
        } catch (error) {
            console.error("Error creating emergency appointment:", error);
            toast.error(
                error.response?.data?.message ||
                    "Failed to create emergency appointment. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-4">
            <div className="bg-white dark:bg-dark-surface rounded-2xl shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-red-600 text-white p-6 rounded-t-2xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <AlertCircle className="w-6 h-6" />
                        <h2 className="text-2xl font-bold">
                            Emergency Appointment Request
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-red-700 rounded-full transition">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Patient Information */}
                    <div className="space-y-4">
                        {/* <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                            <User className="w-5 h-5" />
                            Patient Information
                        </h3> */}

                        {/* <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Full Name{" "}
                                <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="fullName"
                                value={formData.fullName}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-dark-bg dark:text-white"
                                placeholder="Enter your full name"
                            />
                        </div> */}

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Phone Number{" "}
                                <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="tel"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-dark-bg dark:text-white"
                                placeholder="+91 9876543210"
                            />
                        </div>
                    </div>

                    {/* Submit Button */}
                    <div className="flex gap-3 pt-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition">
                            {loading ? (
                                "Submitting..."
                            ) : (
                                <>
                                    <Send className="w-5 h-5" />
                                    Send Emergency Request
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EmergencyAppointmentForm;
