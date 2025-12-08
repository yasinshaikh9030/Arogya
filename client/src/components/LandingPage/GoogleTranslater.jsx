import React, { useEffect, useRef, useState } from "react";
import { Languages } from "lucide-react";
import { useUser, useAuth } from "@clerk/clerk-react";
import axios from "axios";

const GOOGLE_ELEMENT_URL = import.meta.env.VITE_GOOGLE_TRANSLATE_URL;
export default function GoogleTranslater() {
    const [open, setOpen] = useState(false);
    const wrapperRef = useRef(null);
    const scriptLoadedRef = useRef(false);
    const widgetMountedRef = useRef(false);

    const { user } = useUser();
    const { getToken } = useAuth();
    const userId = user?.id;

    const LANGS = [
        { code: "en", label: "English" },
        { code: "pa", label: "Punjabi" },
        { code: "bn", label: "Bengali" },
        { code: "te", label: "Telugu" },
        { code: "mr", label: "Marathi" },
        { code: "ta", label: "Tamil" },
        { code: "ur", label: "Urdu" },
        { code: "gu", label: "Gujarati" },
        { code: "kn", label: "Kannada" },
        { code: "ml", label: "Malayalam" },
        { code: "or", label: "Odia" },

        { code: "hi", label: "Hindi" },
        { code: "as", label: "Assamese" },
        { code: "ne", label: "Nepali" },
        { code: "sd", label: "Sindhi" },
        { code: "sa", label: "Sanskrit" }
    ];

    // Hide Google top bar completely
    useEffect(() => {
        const css = `
      .goog-te-banner-frame.skiptranslate {
        display:none !important;
      }
      .goog-te-menu-frame.skiptranslate {
        display:none !important;
      }
      body {
        top:0 !important;
      }
    `;
        const style = document.createElement("style");
        style.innerHTML = css;
        document.head.appendChild(style);
    }, []);

    // Load Google script
    useEffect(() => {
        if (scriptLoadedRef.current) return;

        window.googleTranslateElementInit = () => {
            if (widgetMountedRef.current) return;

            new window.google.translate.TranslateElement(
                {
                    pageLanguage: "en",
                    autoDisplay: false,
                    includedLanguages:
                        "en,hi,bn,te,mr,ta,ur,gu,kn,ml,or,pa,as,ne,sd,sa",
                    layout:
                        window.google.translate.TranslateElement.InlineLayout.VERTICAL
                },
                "google_translate_container"
            );

            widgetMountedRef.current = true;
        };

        const script = document.createElement("script");
        script.src = GOOGLE_ELEMENT_URL;
        script.defer = true;
        document.body.appendChild(script);

        scriptLoadedRef.current = true;
    }, []);

    const changeLang = async (lang) => {
        try {
            const token = await getToken();
            const base = import.meta.env.VITE_SERVER_URL || '';
            await axios.post(`${base}/api/patient/${userId}/language`, { language: lang }, {
                headers: token ? { Authorization: `Bearer ${token}` } : undefined,
            });
        } catch (error) {
            console.error('Failed to persist language preference:', error?.response?.data || error?.message || error);
        }

        const combo = document.querySelector('.goog-te-combo');
        if (!combo) return setOpen(false);
        combo.value = lang;
        combo.dispatchEvent(new Event('change'));
        setOpen(false);
    };

    return (
        <div ref={wrapperRef} className="relative flex items-center">
            <button
                onClick={() => setOpen(!open)}
                className="cursor-pointer inline-flex items-center gap-2 text-sm font-semibold text-light-primary-text dark:text-dark-primary-text"
            >
                <span>Language</span>
                <Languages className="w-4 h-4" />
            </button>

            {open && (
                <div className="absolute right-0 top-full mt-2 p-3 bg-light-surface dark:bg-dark-surface rounded-2xl shadow-lg min-w-[220px] max-h-72 overflow-y-auto z-[60] border border-light-primary/15 dark:border-dark-primary/15">
                    <div className="text-xs mb-2 text-light-secondary-text dark:text-dark-secondary-text">
                        Choose language
                    </div>

                    <div className="grid grid-cols-2 gap-1">
                        {LANGS.map((l) => (
                            <button
                                key={l.code}
                                onClick={() => changeLang(l.code)}
                                className="px-2 py-1 text-sm rounded text-light-primary-text dark:text-dark-primary-text hover:bg-light-bg dark:hover:bg-dark-bg"
                            >
                                {l.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Hidden official Google widget required for translation engine */}
            <div id="google_translate_container" className="hidden"></div>
        </div>
    );
}
