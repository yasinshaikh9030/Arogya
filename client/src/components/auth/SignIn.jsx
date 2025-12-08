import { useState } from "react";
import { phoneSendOTP, phoneConfirmOTP, googleLogin } from "./authFunctions";

export default function SignIn() {
    const [phone, setPhone] = useState("");
    const [otp, setOtp] = useState("");
    const [step, setStep] = useState("phone"); // phone | otp
    const [loading, setLoading] = useState(false);
    const [confirmationResult, setConfirmationResult] = useState(null);
    const [error, setError] = useState("");

    const handleSendOTP = async (e) => {
        e.preventDefault();
        setError("");
        if (!phone) {
            setError("Enter phone number with country code (e.g. +91...)");
            return;
        }
        setLoading(true);
        try {
            const result = await phoneSendOTP(
                phone,
                "recaptcha-container-signin"
            );
            setConfirmationResult(result);
            setStep("otp");
        } catch (err) {
            setError(err?.message || "Failed to send OTP");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        setError("");
        if (!otp) {
            setError("Enter the OTP sent to your phone");
            return;
        }
        setLoading(true);
        try {
            await phoneConfirmOTP(confirmationResult, otp);
            setStep("done");
        } catch (err) {
            setError(err?.message || "Invalid OTP");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container flex flex-col gap-3">
            <h2 className="font-semibold text-lg">Sign In with Phone</h2>

            {error && <div className="text-red-600 text-sm">{error}</div>}

            {step === "phone" && (
                <form onSubmit={handleSendOTP} className="space-y-2">
                    <input
                        type="tel"
                        placeholder="+91 98765 43210"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full rounded border px-3 py-2"
                    />
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full rounded bg-emerald-600 text-white py-2 disabled:opacity-60">
                        {loading ? "Sending..." : "Send OTP"}
                    </button>
                </form>
            )}

            {step === "otp" && (
                <form onSubmit={handleVerifyOtp} className="space-y-2">
                    <input
                        type="text"
                        placeholder="Enter OTP"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        className="w-full rounded border px-3 py-2"
                    />
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full rounded bg-emerald-600 text-white py-2 disabled:opacity-60">
                        {loading ? "Verifying..." : "Verify OTP"}
                    </button>
                </form>
            )}

            {step === "done" && (
                <div className="text-emerald-600 text-sm">
                    Signed in successfully.
                </div>
            )}

            <div className="flex items-center gap-2 pt-2">
                <div className="flex-1 border-t" />
                <span className="text-xs text-gray-500">or</span>
                <div className="flex-1 border-t" />
            </div>

            <button
                onClick={googleLogin}
                className="w-full rounded border border-gray-300 py-2 text-sm">
                Sign in with Google
            </button>

            <div id="recaptcha-container-signin" />
        </div>
    );
}
