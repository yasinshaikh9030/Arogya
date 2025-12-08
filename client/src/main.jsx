import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles/index.css";
import App from "./App.jsx";
import { ThemeProvider } from "./context/ThemeProvider.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { UserProvider } from "./context/UserContext.jsx";
import { Toaster } from "react-hot-toast";
import { ClerkProvider } from "@clerk/clerk-react";

createRoot(document.getElementById("root")).render(
    <ThemeProvider>
        <UserProvider>
            <AuthProvider>
                <ClerkProvider publishableKey={'pk_test_YWN0dWFsLWtpdC0zOC5jbGVyay5hY2NvdW50cy5kZXYk'}>
                    <App />
                    <Toaster position="top-center" reverseOrder={false} />
                </ClerkProvider>
            </AuthProvider>
        </UserProvider>
    </ThemeProvider>
);
