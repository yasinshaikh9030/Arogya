const features = [
    {
        name: "AI Symptom Checker",
        description:
            "Quickly analyze your symptoms and get instant, AI-powered health insights.",
    },
    {
        name: "Instant Doctor Consultation",
        description:
            "Connect with certified doctors via chat or video call, anytime, anywhere.",
    },
    {
        name: "Digital Prescriptions",
        description:
            "Receive secure, digital prescriptions after your consultation.",
    },
    {
        name: "Health Records Management",
        description:
            "Store, access, and share your medical history and reports securely.",
    },
    {
        name: "Appointment Scheduling",
        description: "Book appointments with specialists at your convenience.",
    },
    {
        name: "Medication Reminders",
        description: "Get notified for your medication schedules and refills.",
    },
];

export default function FeatureSection() {
    return (
        <div className="bg-ligh-bg">
            <div className="mx-auto max-w-2xl lg:max-w-7xl px-4 py-16 sm:px-6 sm:py-24 flex flex-col-reverse lg:flex-row items-center gap-10 lg:gap-20">
                <div>
                    <div className="max-w-5xl">
                        <h2 className="text-base/7 font-semibold text-light-primary dark:text-dark-primary">
                            Features
                        </h2>
                        <p className="mt-2 max-w-2xl text-2xl font-semibold tracking-tight text-balance text-light-primary-text dark:text-dark-primary-text sm:text-4xl">
                            Discover the unique features that set our product apart.
                        </p>
                    </div>

                    <dl className="mt-10 sm:mt-16 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2 sm:gap-y-10 lg:gap-x-8">
                        {features.map((feature) => (
                            <div
                                key={feature.name}
                                className="border-t border-light-bg dark:border-dark-secondary-text pt-4">
                                <dt className="font-medium text-light-primary-text dark:text-dark-primary-text">
                                    {feature.name}
                                </dt>
                                <dd className="mt-2 text-sm text-light-secondary-text dark:text-dark-secondary-text">
                                    {feature.description}
                                </dd>
                            </div>
                        ))}
                    </dl>
                </div>
                <div className="flex items-center justify-center w-full">
                    <div className="bg-light-surface dark:bg-dark-surface rounded-[2rem] p-4 shadow-lg border border-gray-200 dark:border-gray-700 w-full max-w-[360px] aspect-[9/16] flex items-center justify-center">
                        <img
                            src="/mobileImage.jpeg" // Replace with your actual prototype image path
                            alt="App Prototype"
                            className="rounded-[1.4rem] w-full h-full object-cover"
                            draggable={false}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
