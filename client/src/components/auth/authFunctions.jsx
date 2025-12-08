import {
    signInWithPopup,
    signOut,
} from "firebase/auth";
import {
    auth,
    googleProvider,
    setupRecaptcha,
    sendOTP,
} from "../../config/config";

// GOOGLE LOGIN (optional)
export const googleLogin = () => signInWithPopup(auth, googleProvider);

// LOGOUT
export const logout = () => signOut(auth);

// PHONE OTP (Send) -> returns confirmationResult
export const phoneSendOTP = async (
    phone,
    recaptchaId = "recaptcha-container"
) => {
    const recaptcha = setupRecaptcha(recaptchaId);
    return await sendOTP(phone, recaptcha);
};

// PHONE OTP Confirm
export const phoneConfirmOTP = async (confirmationResult, code) => {
    if (!confirmationResult) throw new Error("OTP not requested yet");
    const res = await confirmationResult.confirm(code);
    return res;
};
