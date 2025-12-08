import { useState } from "react";
import { phoneSendOTP } from "../../utils/authFunctions";

export default function PhoneLogin() {
    const [phone, setPhone] = useState("");
    const [confirmation, setConfirmation] = useState(null);
    const [otp, setOtp] = useState("");

    const sendOTP = async () => {
        const result = await phoneSendOTP(`+91${phone}`);
        setConfirmation(result);
    };

    const verifyOTP = async () => {
        await confirmation.confirm(otp);
    };

    return (
        <div className="auth-container">
            <h2>Phone Login</h2>

            <div id="recaptcha-container"></div>

            {!confirmation ? (
                <>
                    <input
                        type="tel"
                        placeholder="Phone Number (without +91)"
                        onChange={(e) => setPhone(e.target.value)}
                    />
                    <button onClick={sendOTP}>Send OTP</button>
                </>
            ) : (
                <>
                    <input
                        type="number"
                        placeholder="Enter OTP"
                        onChange={(e) => setOtp(e.target.value)}
                    />
                    <button onClick={verifyOTP}>Verify OTP</button>
                </>
            )}
        </div>
    );
}
