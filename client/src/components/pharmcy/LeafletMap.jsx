import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Leaflet map used on Pharmacy dashboard
// Props:
// - latitude, longitude: initial coordinates
// - pharmacyName, address: initial text
// - onLocationChange(updatedLocation): callback to parent (saves to DB)
// - height: CSS height of the map
// - clickable: if true, clicking map moves marker
// - showAddLocation: if true, show "+ Add Location" button and form

export default function LeafletMap({
    latitude,
    longitude,
    pharmacyName,
    address,
    onLocationChange,
    height = "400px",
    clickable = false,
    showAddLocation = false,
}) {
    const mapRef = useRef(null);
    const map = useRef(null);
    const marker = useRef(null);

    // Default to Mumbai-style coordinates if nothing is passed in
    const initialLat = latitude ?? 19.0760;
    const initialLng = longitude ?? 72.8777;

    const [currentLocation, setCurrentLocation] = useState({
        lat: initialLat,
        lng: initialLng,
    });

    const [isAddingLocation, setIsAddingLocation] = useState(false);
    const [showLocationForm, setShowLocationForm] = useState(false);

    const [formData, setFormData] = useState({
        name: pharmacyName || "",
        address: address || "",
        latitude: initialLat,
        longitude: initialLng,
    });

    // Sync when parent props change
    useEffect(() => {
        const lat = latitude || initialLat;
        const lng = longitude || initialLng;

        setCurrentLocation({ lat, lng });
        setFormData((prev) => ({
            ...prev,
            name: pharmacyName || "",
            address: address || "",
            latitude: lat,
            longitude: lng,
        }));
    }, [latitude, longitude, pharmacyName, address]);

    const updateFromCoords = (lat, lng, triggerCallback = true) => {
        setCurrentLocation({ lat, lng });
        setFormData((prev) => ({
            ...prev,
            latitude: lat,
            longitude: lng,
        }));

        if (marker.current) {
            marker.current.setLatLng([lat, lng]);
        }

        if (triggerCallback && onLocationChange) {
            // Only send coords here; full data (name/address) is sent on Save
            console.log("[LeafletMap] location changed from map interaction", {
                latitude: lat,
                longitude: lng,
            });
            onLocationChange({ latitude: lat, longitude: lng });
        }
    };

    // On first render, if no coordinates are provided via props, try to use
    // the browser's real-time geolocation. Mumbai is kept as a final
    // fallback when GPS is unavailable or fails.
    useEffect(() => {
        const hasLatProp = typeof latitude === "number";
        const hasLngProp = typeof longitude === "number";

        if (hasLatProp && hasLngProp) {
            // Props explicitly provide coordinates; do not override them.
            return;
        }

        if (!navigator.geolocation) {
            console.warn("[LeafletMap] Geolocation not supported; using default Mumbai fallback");
            return;
        }

        console.log("[LeafletMap] requesting current position for initial load");
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const { latitude: lat, longitude: lng } = pos.coords;
                console.log("[LeafletMap] received current position", { lat, lng });
                // Re-use existing logic so marker, map and callback stay consistent.
                updateFromCoords(lat, lng, true);
            },
            (err) => {
                console.warn(
                    "[LeafletMap] geolocation failed; keeping default Mumbai fallback",
                    err
                );
            }
        );
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleMapClick = (e) => {
        if (!isAddingLocation && !clickable) return;
        const { lat, lng } = e.latlng;
        console.log("[LeafletMap] map click", { lat, lng });
        updateFromCoords(lat, lng, true);
    };

    const handleMarkerDrag = (e) => {
        const pos = e.target.getLatLng();
        console.log("[LeafletMap] marker dragend", pos);
        updateFromCoords(pos.lat, pos.lng, true);
    };

    const handleAddLocation = () => {
        console.log("[LeafletMap] Add Location button clicked");
        setIsAddingLocation(true);
        setShowLocationForm(true);
    };

    const handleCancelLocation = () => {
        console.log("[LeafletMap] cancel location edit");
        setIsAddingLocation(false);
        setShowLocationForm(false);
        // Reset to original props
        setFormData({
            name: pharmacyName || "",
            address: address || "",
            latitude: latitude || initialLat,
            longitude: longitude || initialLng,
        });
        setCurrentLocation({
            lat: latitude || initialLat,
            lng: longitude || initialLng,
        });
    };

    const handleUseBrowserLocation = () => {
        if (!navigator.geolocation) {
            alert("Geolocation is not supported by your browser.");
            return;
        }

        console.log("[LeafletMap] requesting current position from Use my current location button");
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const { latitude: lat, longitude: lng } = pos.coords;
                console.log("[LeafletMap] received current position", { lat, lng });
                updateFromCoords(lat, lng, true);
            },
            (err) => {
                console.warn("[LeafletMap] failed to get current position", err);
            }
        );
    };

    const handleSaveLocation = () => {
        if (!formData.name || !formData.address) {
            alert("Please fill in name and address before saving.");
            return;
        }

        console.log("[LeafletMap] save location", formData);

        if (onLocationChange) {
            try {
                onLocationChange({
                    latitude: formData.latitude,
                    longitude: formData.longitude,
                    name: formData.name,
                    address: formData.address,
                });
            } catch (err) {
                console.error("[LeafletMap] onLocationChange threw error", err);
            }
        }

        setIsAddingLocation(false);
        setShowLocationForm(false);
    };

    // Initialize map once
    useEffect(() => {
        if (!mapRef.current || map.current) return;

        console.log("[LeafletMap] initializing map", currentLocation);

        // Fix default marker icons
        delete L.Icon.Default.prototype._getIconUrl;
        L.Icon.Default.mergeOptions({
            iconRetinaUrl:
                "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
            iconUrl:
                "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
            shadowUrl:
                "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
        });

        map.current = L.map(mapRef.current).setView(
            [currentLocation.lat, currentLocation.lng],
            15
        );

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: "&copy; OpenStreetMap contributors",
        }).addTo(map.current);

        marker.current = L.marker(
            [currentLocation.lat, currentLocation.lng],
            {
                draggable: !!onLocationChange,
            }
        ).addTo(map.current);

        marker.current.bindPopup(
            `<b>${formData.name || "Pharmacy"}</b><br />${formData.address || "No address set"}
            `
        );

        // Show company/pharmacy name on marker as soon as the page loads
        marker.current.openPopup();

        marker.current.on("dragend", handleMarkerDrag);
        map.current.on("click", handleMapClick);

        // Ensure map renders correctly when container becomes visible
        const invalidate = () => {
            if (map.current) {
                map.current.invalidateSize();
            }
        };
        // call twice to catch late layout
        setTimeout(invalidate, 50);
        requestAnimationFrame(invalidate);
        window.addEventListener("resize", invalidate);

        return () => {
            console.log("[LeafletMap] destroying map");
            window.removeEventListener("resize", invalidate);
            if (map.current) {
                map.current.off("click", handleMapClick);
                map.current.remove();
                map.current = null;
            }
            marker.current = null;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Keep marker / view / popup in sync with state
    useEffect(() => {
        if (!map.current || !marker.current) return;

        marker.current.setLatLng([currentLocation.lat, currentLocation.lng]);
        map.current.setView([currentLocation.lat, currentLocation.lng]);

        marker.current.setPopupContent(
            `<b>${formData.name || "Pharmacy"}</b><br />${formData.address || "No address set"
            }`
        );

        if (marker.current.dragging) {
            if (onLocationChange) {
                marker.current.dragging.enable();
            } else {
                marker.current.dragging.disable();
            }
        }

        // Recalculate size in case parent layout changed after state update
        map.current.invalidateSize();
    }, [currentLocation, formData.name, formData.address, onLocationChange]);

    return (
        <div className="space-y-4">
            {/* Header with Add Location */}
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-[var(--color-light-primary-text)] dark:text-[var(--color-dark-primary-text)]">
                    Pharmacy Location
                </h3>
                {showAddLocation && !showLocationForm && (
                    <button
                        onClick={handleAddLocation}
                        className="px-4 py-2 rounded-md text-sm bg-[var(--color-light-primary)] dark:bg-[var(--color-dark-primary)] text-white hover:opacity-90"
                    >
                        + Add Location
                    </button>
                )}
            </div>

            {/* Map */}
            <div
                ref={mapRef}
                style={{ height }}
                className="rounded-md border border-gray-300 dark:border-gray-700 overflow-hidden"
            />

            {/* Location summary below the map */}
            <div className="mt-3 p-3 rounded-md bg-light-surface dark:bg-dark-bg border border-gray-200 dark:border-gray-700 text-xs space-y-1">
                <div className="font-semibold text-[var(--color-light-primary-text)] dark:text-[var(--color-dark-primary-text)]">
                    My Location Summary
                </div>
                <div className="text-[var(--color-light-primary-text)] dark:text-[var(--color-dark-primary-text)]">
                    <span className="font-medium">Name:</span> {formData.name || "Pharmacy"}
                </div>
                <div className="text-[var(--color-light-primary-text)] dark:text-[var(--color-dark-primary-text)]">
                    <span className="font-medium">Address:</span> {formData.address || "No address set"}
                </div>
                <div className="text-[var(--color-light-primary-text)] dark:text-[var(--color-dark-primary-text)]">
                    <span className="font-medium">Latitude:</span> {formData.latitude.toFixed(6)}
                </div>
                <div className="text-[var(--color-light-primary-text)] dark:text-[var(--color-dark-primary-text)]">
                    <span className="font-medium">Longitude:</span> {formData.longitude.toFixed(6)}
                </div>
            </div>

            {/* Location form */}
            {showLocationForm && (
                <div className="bg-light-surface dark:bg-dark-bg border border-[var(--color-light-primary)]/40 dark:border-[var(--color-dark-primary)]/40 p-4 rounded-lg shadow-md space-y-4">
                    <div className="flex justify-between items-center mb-2">
                        <h4 className="font-semibold text-[var(--color-light-primary-text)] dark:text-[var(--color-dark-primary-text)]">
                            {isAddingLocation ? "Add Pharmacy Location" : "Update Pharmacy Location"}
                        </h4>
                        <span className="text-xs px-2 py-1 rounded bg-[var(--color-light-primary)]/10 dark:bg-[var(--color-dark-primary)]/20 text-[var(--color-light-primary)] dark:text-[var(--color-dark-primary)]">
                            {isAddingLocation ? "Adding" : "Editing"}
                        </span>
                    </div>

                    <div className="space-y-3">
                        <div>
                            <label className="block text-xs font-medium mb-1 text-[var(--color-light-primary-text)] dark:text-[var(--color-dark-primary-text)]">
                                Location Name
                            </label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) =>
                                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                                }
                                className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-dark-surface text-sm text-[var(--color-light-primary-text)] dark:text-[var(--color-dark-primary-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-light-primary)] dark:focus:ring-[var(--color-dark-primary)]"
                                placeholder="e.g. Chelekar Medical Store"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium mb-1 text-[var(--color-light-primary-text)] dark:text-[var(--color-dark-primary-text)]">
                                Address
                            </label>
                            <input
                                type="text"
                                value={formData.address}
                                onChange={(e) =>
                                    setFormData((prev) => ({ ...prev, address: e.target.value }))
                                }
                                className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-dark-surface text-sm text-[var(--color-light-primary-text)] dark:text-[var(--color-dark-primary-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-light-primary)] dark:focus:ring-[var(--color-dark-primary)]"
                                placeholder="Full address"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-medium mb-1 text-[var(--color-light-primary-text)] dark:text-[var(--color-dark-primary-text)]">
                                    Latitude
                                </label>
                                <input
                                    type="text"
                                    value={formData.latitude.toFixed(6)}
                                    readOnly
                                    className="w-full px-3 py-2 rounded-md border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-dark-surface text-xs text-gray-700 dark:text-[var(--color-dark-primary-text)]"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium mb-1 text-[var(--color-light-primary-text)] dark:text-[var(--color-dark-primary-text)]">
                                    Longitude
                                </label>
                                <input
                                    type="text"
                                    value={formData.longitude.toFixed(6)}
                                    readOnly
                                    className="w-full px-3 py-2 rounded-md border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-dark-surface text-xs text-gray-700 dark:text-[var(--color-dark-primary-text)]"
                                />
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={handleUseBrowserLocation}
                            className="mt-2 inline-flex items-center px-3 py-1.5 rounded-md text-xs bg-[var(--color-light-primary)]/10 dark:bg-[var(--color-dark-primary)]/20 text-[var(--color-light-primary)] dark:text-[var(--color-dark-primary)] hover:bg-[var(--color-light-primary)]/20 dark:hover:bg-[var(--color-dark-primary)]/30"
                        >
                            Use my current location
                        </button>

                        <p className="text-xs text-gray-600 dark:text-gray-300 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 rounded-md px-3 py-2">
                            Click on the map or drag the marker to update coordinates, then save.
                        </p>

                        <div className="flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={handleCancelLocation}
                                className="px-4 py-2 text-xs rounded-md border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-[var(--color-dark-primary-text)] hover:bg-gray-50 dark:hover:bg-dark-surface"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleSaveLocation}
                                className="px-4 py-2 text-xs rounded-md bg-[var(--color-light-primary)] dark:bg-[var(--color-dark-primary)] text-white hover:opacity-90"
                            >
                                Save Location
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="text-xs text-gray-600 dark:text-gray-300">
                {isAddingLocation || clickable
                    ? "Click on the map or drag the marker to choose the pharmacy location."
                    : "Location is read-only. Enable Add Location from the dashboard to change it."}
            </div>
        </div>
    );
}

