import { useAuth, useUser } from "@clerk/clerk-react";
import { ArrowRight } from "lucide-react";
import ContactSection from "../components/LandingPage/ContactSection";
import FAQSection from "../components/LandingPage/FAQSection";
import FeatureSection from "../components/LandingPage/FeatureSection";
import Footer from "../components/LandingPage/Footer";
import Navbar from "../components/LandingPage/Navbar";
import PricingSection from "../components/LandingPage/PricingSection";
import TestimonialSection from "../components/LandingPage/TestimonialSection";
import WhyChooseUsSection from "../components/LandingPage/WhyChooseUsSection";
import Loader from "../components/main/Loader";
import { BackgroundRippleEffect } from "../components/UI/BackgroundRippleEffect";
import { ContainerScroll } from "../components/UI/ContainerScroll";
import { useEffect } from "react";
import EmergencySOSButton from "../components/SOS/EmergencySOSButton";

function LandingPage() {
    const { isLoaded } = useUser();
    const { getToken } = useAuth();

    useEffect(() => {
        fetchSessionToken();
    }, [isLoaded, getToken]); // Dependencies: re-run if isLoaded changes or getToken reference changes

    const fetchSessionToken = async () => {
        if (isLoaded) {
            // Ensure Clerk user data is loaded before attempting to get a token
            try {
                const token = await getToken();
                console.log(token);
            } catch (error) {
                console.error("Error fetching Clerk session token:", error);
            }
        }
    };

    if (!isLoaded) return <Loader />;

    return (
        <div className="overflow-hidden relative">
            <Navbar />
            <div className="absolute inset-0 -z-20 h-full">
                <BackgroundRippleEffect />
            </div>
            <div className="text-light-primary-text w-full min-h-[80vh] flex flex-col gap-6 items-center justify-center px-4 pt-24 md:h-screen md:px-0">
                <div className="flex flex-col items-center justify-center font-semibold leading-16">
                    <p className="text-3xl sm:text-4xl lg:text-[60px] text-center font-bold flex dark:text-dark-primary-text text-light-primary-text">
                        Connect, Diagnose, Treat
                    </p>
                    <p className="text-light-primary/50 dark:text-dark-primary/50 text-2xl sm:text-3xl lg:text-[60px] font-extrabold sub-heading text-center">
                        All in One App.
                    </p>
                </div>
                <div className="flex flex-col gap-4 items-center">
                    <p className="dark:text-dark-secondary-text text-light-secondary-text text-center text-sm sm:text-base">
                        Check symptoms, consult doctors—one tap.
                    </p>
                    <button className="bg-light-primary dark:bg-dark-primary text-light-bg py-3 px-6 rounded-full flex items-center gap-2 text-sm sm:text-base shadow-md">
                        <p>Get Started</p>
                        <ArrowRight />
                    </button>
                </div>
            </div>
            <div className="flex flex-col overflow-hidden bg-ligh-bg dark:bg-dark-bg">
                <ContainerScroll
                    titleComponent={
                        <>
                            <h1 className="text-2xl sm:text-3xl font-semibold text-neutral-700 ">
                                Unleash the power of <br />
                                <span className="text-4xl sm:text-[4rem] font-bold leading-none text-light-primary/80 dark:text-dark-primary/80">
                                    AI-driven Healthcare
                                </span>
                            </h1>
                        </>
                    }>
                    <img
                        src={`/patientDashboard.png`}
                        alt="hero"
                        height={720}
                        width={1400}
                        className="mx-auto h-full w-full rounded-2xl object-contain md:object-cover md:object-left-top"
                        draggable={false}
                    />
                </ContainerScroll>
            </div>

            <FeatureSection />

            <TestimonialSection />

            <WhyChooseUsSection />

            {/* <PricingSection /> */}

            <FAQSection />

            <ContactSection />

            <Footer />

            {/* Emergency SOS Button */}
            <EmergencySOSButton />
        </div>
    );
}

export default LandingPage;
