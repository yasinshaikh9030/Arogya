import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext(null);

export const ThemeProvider = ({ children }) => {
    const getInitialTheme = () => {
        const stored = localStorage.getItem("theme");

        if (stored === "colorblind") {
            return "colorblind";
        }

        return "light";
    };

    const [theme, setTheme] = useState(getInitialTheme());

    useEffect(() => {
        const root = document.documentElement;

        root.classList.remove("dark", "colorblind");

        if (theme === "colorblind") {
            root.classList.add("colorblind");
        }

        localStorage.setItem("theme", theme);
    }, [theme]);

    return (
        <ThemeContext.Provider value={{ theme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    return useContext(ThemeContext);
};