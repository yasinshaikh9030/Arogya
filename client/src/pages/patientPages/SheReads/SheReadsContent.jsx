import { Bone, Calendar, Heart, Info, Lightbulb } from "lucide-react";
import React, { useMemo, useState } from "react";

const womensInfo = [
    {
        id: 1,
        name: "Menstrual Disorders (PMS, Dysmenorrhea, Amenorrhea, Menorrhagia)",
        category: "Reproductive Health",
        prevalence:
            "Almost 9 out of 10 women have some problem with their periods at some time.",
        ageGroup: "Girls from puberty to women before menopause",
        severity: "Can be mild or can make life very hard",
        icon: "Calendar",
        color: "purple",
        description:
            "Problems with monthly bleeding. Can be period pain, heavy bleeding, no periods, or bleeding at odd times. These problems can make daily life and health worse.",
        causes: [
            "Hormonal Imbalances: Fluctuations in the levels of hormones like estrogen and progesterone, and high levels of chemicals called prostaglandins, which cause the uterus to contract and create cramps.",
            "Uterine Conditions: Non-cancerous growths in the uterus like fibroids or polyps, or conditions like endometriosis (where uterine tissue grows outside the uterus) and adenomyosis (where it grows into the uterine wall).",
            "Underlying Health Issues: Problems with the thyroid gland, Polycystic Ovary Syndrome (PCOS), and certain bleeding disorders can disrupt the menstrual cycle.",
            "Lifestyle Factors: High levels of stress, excessive exercise, significant weight loss or gain, and poor nutrition can all throw your cycle off balance.",
            "Medical and Contraceptive Factors: Some medications, as well as certain types of birth control like the IUD, can cause changes in bleeding patterns.",
        ],
        symptoms: {
            mild: [
                "Slight abdominal cramping or a feeling of heaviness",
                "Minor bloating or water retention",
                "Gentle mood shifts or feeling slightly more emotional",
                "Tender or slightly swollen breasts",
                "Mild fatigue or acne breakouts",
            ],
            moderate: [
                "Bleeding that requires changing a pad or tampon every 2-3 hours",
                "Cramps that are painful but often manageable with over-the-counter medicine",
                "Noticeable changes in period regularity (e.g., a week early or late)",
                "Significant tiredness, headaches, or lower back pain",
                "Clear mood swings, irritability, or feeling low",
            ],
            severe: [
                "Pain so intense it causes nausea, vomiting, or prevents you from doing normal activities",
                "Bleeding so heavy you soak through a pad or tampon every hour for several hours",
                "Passing large blood clots (bigger than a coin)",
                "Not having a period for three or more months in a row (when not pregnant)",
                "Extreme feelings of depression, anxiety, or anger that impact relationships and daily function",
            ],
        },
        riskFactors: [
            "Age: Being a teenager who has recently started menstruating or a woman approaching menopause.",
            "Family History: Having a mother or sister who also experiences significant period problems.",
            "Weight and Lifestyle: Being significantly overweight or underweight, smoking, or living with chronic stress.",
            "Never Having Been Pregnant: Women who have not carried a pregnancy to term may experience more painful periods.",
            "Pre-existing Medical Conditions: Having a diagnosis of PCOS, endometriosis, or a thyroid disorder.",
        ],
        shortTermEffects: [
            "Disruption of Daily Life: Pain, fatigue, or heavy bleeding can lead to missing school or work.",
            "Emotional Distress: Increased feelings of anxiety, irritability, and sadness can affect your mental well-being.",
            "Physical Discomfort: Headaches, dizziness, digestive issues like diarrhea or constipation, and trouble sleeping.",
            "Temporary Anemia: Significant blood loss can cause temporary weakness, dizziness, and shortness of breath.",
        ],
        longTermEffects: [
            "Chronic Anemia: Persistent heavy bleeding can lead to long-term iron deficiency anemia, causing constant fatigue and weakness.",
            "Infertility: Some underlying causes of menstrual disorders, like PCOS or endometriosis, can make it difficult to get pregnant.",
            "Mental Health Impact: Ongoing struggles with severe symptoms can contribute to chronic anxiety or depression.",
            "Increased Health Risks: Conditions like Amenorrhea (missed periods), if left untreated, can increase the risk of osteoporosis (weak bones) and heart disease.",
            "Reduced Quality of Life: Continuously dealing with pain and other disruptive symptoms can negatively impact social life, relationships, and overall happiness.",
        ],
        precautions: [
            "Maintain a Balanced Diet: Eat plenty of iron-rich foods (leafy greens, beans, red meat), magnesium (nuts, seeds), and calcium to support your body.",
            "Engage in Regular, Moderate Exercise: Activities like walking, swimming, or yoga can help reduce cramps and improve mood. Avoid over-exercising.",
            "Practice Stress Management: Incorporate relaxation techniques like deep breathing, meditation, or mindfulness into your daily routine.",
            "Track Your Cycle: Use a calendar or app to note your symptoms, bleeding patterns, and pain levels. This information is very helpful for your doctor.",
            "Maintain a Healthy Weight: Both being underweight and overweight can disrupt hormonal balance and affect your periods.",
        ],
        homeRemedies: [
            "Apply Heat: A heating pad or warm bath can relax the uterine muscles and relieve cramps.",
            "Herbal Teas: Teas like ginger, chamomile, and peppermint can help soothe cramps and reduce bloating.",
            "Gentle Movement: Light stretching or restorative yoga poses (like Child's Pose) can ease muscle tension.",
            "Stay Hydrated and Rest: Drinking plenty of water can reduce bloating, and getting enough sleep is crucial for managing mood and energy levels.",
            "Consider Supplements: After talking to a doctor, supplements like magnesium or vitamin B6 may help with PMS symptoms.",
        ],
        treatmentAndMedicines: [
            "Pain Relievers (NSAIDs): Over-the-counter medicines like ibuprofen or naproxen are very effective at reducing cramps because they block prostaglandins.",
            "Hormonal Birth Control: Pills, patches, rings, or hormonal IUDs can regulate the cycle, reduce bleeding, and ease cramps by controlling hormones.",
            "Iron Supplements: Prescribed for individuals who develop anemia due to heavy blood loss.",
            "Treating the Root Cause: If the disorder is caused by another issue (like a thyroid problem), treating that condition will often resolve the period problems.",
            "Surgical Options: In severe cases caused by fibroids, endometriosis, or other structural issues, surgery may be recommended to remove the problematic tissue.",
        ],
        whenToSeeDoctor: [
            "Your period pain is severe and not relieved by over-the-counter medication.",
            "You are soaking through one or more pads/tampons every hour for several consecutive hours.",
            "You have missed your period for 3 months in a row and are not pregnant.",
            "You experience bleeding between periods, after sex, or after menopause.",
            "Your symptoms of sadness, anxiety, or anger around your period are making it hard to cope with your daily life.",
            "You notice a sudden, significant change in your usual cycle pattern.",
        ],
        supportResources: [
            "Healthcare Professionals: A Gynecologist (OB/GYN) or a General Practitioner (GP) is the best starting point for diagnosis and treatment.",
            "Mental Health Counselors: Therapists can help you develop coping strategies for the emotional and psychological impact of severe menstrual symptoms.",
            "Online Health Communities: Reputable online forums and support groups can provide a sense of community and shared experience.",
            "Trusted Medical Websites: Organizations like the World Health Organization (WHO), NHS (UK), and Mayo Clinic (US) offer reliable, easy-to-understand information.",
        ],
        articles: [
            {
                title: "Menstrual Cramps (Dysmenorrhea) - An Overview",
                source: "Mayo Clinic",
                url: "https://www.mayoclinic.org/diseases-conditions/menstrual-cramps/symptoms-causes/syc-20374938",
            },
            {
                title: "Heavy Menstrual Bleeding",
                source: "Centers for Disease Control and Prevention (CDC)",
                url: "https://www.cdc.gov/ncbddd/blooddisorders/women/menorrhagia.html",
            },
            {
                title: "Premenstrual syndrome (PMS)",
                source: "Office on Women's Health (U.S. Dept. of Health)",
                url: "https://www.womenshealth.gov/menstrual-cycle/premenstrual-syndrome",
            },
        ],
    },

    {
        id: 2,
        name: "Polycystic Ovary Syndrome (PCOS / PCOD)",
        category: "Hormonal Disorder",
        prevalence: "About 1 in 10 women have PCOS.",
        ageGroup: "Young women to middle age",
        severity: "Mild to severe, can affect periods and pregnancy",
        icon: "Hormone",
        color: "blue",
        description:
            "Hormone problem that causes irregular periods, extra hair, pimples, and sometimes unable to get pregnant.",
        causes: [
            "High Androgen Levels: The body produces higher-than-normal amounts of 'male' hormones (androgens), which can stop the ovaries from releasing eggs and cause acne and excess hair growth.",
            "Insulin Resistance: The body's cells don't respond properly to insulin, a hormone that controls sugar. This causes the pancreas to produce even more insulin, which in turn signals the ovaries to produce more androgens.",
            "Genetics: PCOS often runs in families. If your mother or sister has it, your chances of having it are higher.",
            "Low-Grade Inflammation: Women with PCOS often have a type of long-term, low-level inflammation, which can stimulate the ovaries to produce androgens and contribute to heart problems.",
        ],
        symptoms: {
            mild: [
                "Slightly irregular periods (e.g., a cycle every 35-45 days)",
                "Occasional hormonal acne, especially around the chin and jawline",
                "Minor issues with oily skin or hair",
            ],
            moderate: [
                "Noticeable excess hair growth on the face, chest, or back (hirsutism)",
                "Weight gain that is difficult to lose, especially around the belly",
                "Thinning hair on the scalp, similar to male-pattern baldness",
                "Dark, velvety patches of skin in body folds like the neck or armpits (acanthosis nigricans)",
            ],
            severe: [
                "Very few periods a year or no periods at all",
                "Severe, cystic acne that may be painful and leave scars",
                "Significant fertility challenges or inability to get pregnant without medical help",
                "Development of other health conditions like Type 2 diabetes, high cholesterol, or sleep apnea",
            ],
        },
        riskFactors: [
            "Family History: Having a close female relative (mother, sister) with PCOS or Type 2 diabetes.",
            "Obesity: Being significantly overweight can worsen insulin resistance and make PCOS symptoms more severe, though lean individuals can also have PCOS.",
            "Sedentary Lifestyle: Lack of regular physical activity contributes to weight gain and poor insulin sensitivity.",
            "Poor Diet: A diet high in processed foods, sugar, and unhealthy fats can worsen insulin resistance and inflammation.",
        ],
        shortTermEffects: [
            "Unpredictable Menstrual Cycles: Makes it difficult to track ovulation or know when a period will start.",
            "Emotional Distress: The visible symptoms like acne and hair growth can lead to low self-esteem, anxiety, and depression.",
            "Skin and Hair Issues: Persistent problems with acne, oily skin, and unwanted hair growth or hair loss.",
            "Difficulty Managing Weight: Hormonal imbalances can make it easier to gain weight and much harder to lose it.",
        ],
        longTermEffects: [
            "Infertility: As the leading cause of anovulatory infertility, PCOS can make it very difficult to conceive naturally.",
            "Type 2 Diabetes: Over half of women with PCOS develop Type 2 diabetes by age 40 due to chronic insulin resistance.",
            "Heart Disease: Increased risk of high blood pressure, high cholesterol, and heart attack.",
            "Endometrial Cancer: Irregular or absent periods can cause the uterine lining to become too thick, increasing the risk of uterine cancer later in life.",
            "Sleep Apnea: A condition where breathing repeatedly stops and starts during sleep, leading to fatigue and increasing the risk for other health problems.",
        ],
        precautions: [
            "Adopt a Balanced Diet: Focus on a low-glycemic diet with whole grains, lean proteins, fruits, and vegetables to help manage blood sugar and insulin levels.",
            "Stay Active: Aim for at least 30 minutes of moderate exercise most days of the week to improve insulin sensitivity and help with weight management.",
            "Manage Your Weight: Even a small weight loss (5-10% of body weight) can significantly improve symptoms and help regulate your menstrual cycle.",
            "Regular Health Screenings: Get regular check-ups with your doctor to monitor your blood pressure, cholesterol, and blood sugar levels.",
            "Limit Processed Foods and Sugars: Avoiding sugary drinks, snacks, and highly processed carbohydrates can help control insulin levels.",
        ],
        homeRemedies: [
            "Consistent Exercise Routine: Both cardio (like brisk walking) and strength training are beneficial for improving how your body uses insulin.",
            "Stress Management: Practice stress-reducing activities like yoga, meditation, or deep breathing, as high stress can worsen hormonal imbalances.",
            "Prioritize Sleep: Aim for 7-9 hours of quality sleep per night, as poor sleep can negatively affect your hormones and insulin resistance.",
            "Consider Certain Teas: Some studies suggest that spearmint tea (two cups a day) may help reduce high androgen levels.",
        ],
        treatmentAndMedicines: [
            "Hormonal Birth Control: Pills, patches, or vaginal rings can regulate periods, reduce androgen levels, and improve acne and hair growth.",
            "Insulin-Sensitizing Drugs: Medications like Metformin help the body use insulin more effectively, which can improve ovulation and regulate cycles.",
            "Anti-Androgen Medications: Drugs like Spironolactone can be prescribed to block the effects of male hormones, reducing excess hair growth and acne.",
            "Fertility Medications: If pregnancy is the goal, medications like Clomiphene or Letrozole can be used to help induce ovulation.",
            "Lifestyle Management: For many, the most effective long-term treatment is a combination of diet, exercise, and weight management.",
        ],
        whenToSeeDoctor: [
            "Your periods are very irregular, infrequent (fewer than 8 per year), or have stopped completely.",
            "You have symptoms like excess hair growth, acne, and weight gain that are causing you distress.",
            "You have been trying to get pregnant for over a year (or 6 months if you are over 35) without success.",
            "You notice dark, velvety skin patches, which can be a sign of significant insulin resistance.",
            "You are experiencing symptoms of depression or anxiety.",
        ],
        supportResources: [
            "Medical Specialists: See a Gynecologist or an Endocrinologist (hormone doctor) for diagnosis and medical management.",
            "Registered Dietitian: A dietitian can help you create a sustainable eating plan that is tailored to managing PCOS symptoms.",
            "PCOS Awareness Association & PCOS Challenge: Organizations that provide advocacy, education, and support.",
            "Online and In-Person Support Groups: Connecting with others who have PCOS can provide emotional support and practical advice.",
        ],
        articles: [
            {
                title: "Polycystic Ovary Syndrome (PCOS)",
                source: "Office on Women's Health (WomensHealth.gov)",
                url: "https://www.womenshealth.gov/a-z-topics/polycystic-ovary-syndrome",
            },
            {
                title: "Polycystic ovary syndrome (PCOS)",
                source: "NHS (UK National Health Service)",
                url: "https://www.nhs.uk/conditions/polycystic-ovary-syndrome-pcos/",
            },
        ],
    },

    {
        id: 3,
        name: "Endometriosis",
        category: "Reproductive Health",
        prevalence: "1 in 10 women have endometriosis.",
        ageGroup: "Women from teens to menopause",
        severity: "Can be very painful and hard for pregnancy",
        icon: "Pain",
        color: "darkred",
        description:
            "Tissue that should grow in the womb grows outside, making pain and trouble getting pregnant.",
        causes: [
            "Retrograde Menstruation: The most widely accepted theory, where menstrual blood containing endometrial cells flows back through the fallopian tubes into the pelvic cavity instead of out of the body.",
            "Genetics: The condition often runs in families. If your mother or sister has endometriosis, your own risk is significantly higher.",
            "Immune System Dysfunction: A faulty immune system may fail to recognize and destroy the endometrial-like tissue that is growing outside the uterus.",
            "Surgical Scar Implantation: Endometrial cells can attach to a surgical incision after a procedure like a C-section or hysterectomy.",
            "Cell Transformation (Metaplasia): Suggests that cells in other areas of the body can transform into endometrial-like cells under certain conditions, like hormonal changes.",
        ],
        symptoms: {
            mild: [
                "Painful periods (dysmenorrhea) that are slightly worse than typical cramps",
                "Some discomfort or pain during ovulation",
                "Spotting or light bleeding between periods",
            ],
            moderate: [
                "Significantly painful periods that may not be fully relieved by over-the-counter medication",
                "Pain during or after sexual intercourse (dyspareunia)",
                "Painful bowel movements or urination, especially during the menstrual period",
                "Lower back and persistent pelvic pain",
            ],
            severe: [
                "Chronic, debilitating pelvic pain that can occur throughout the entire month",
                "Infertility or significant difficulty getting pregnant",
                "Heavy menstrual bleeding (menorrhagia) or long periods",
                "Severe digestive issues like 'endo belly' (painful bloating), nausea, constipation, or diarrhea, especially during menstruation",
                "Overwhelming fatigue that is not relieved by sleep",
            ],
        },
        riskFactors: [
            "Early Menarche: Starting your period at an early age (before 11).",
            "Genetics: Having a close relative (mother, aunt, or sister) with endometriosis.",
            "Short or Heavy Menstrual Cycles: Having cycles shorter than 27 days or periods that last longer than 7 days.",
            "Never Giving Birth: Pregnancy often temporarily suppresses endometriosis symptoms.",
            "High Estrogen Exposure: Having higher levels of the hormone estrogen in your body or a longer lifetime exposure to it.",
        ],
        shortTermEffects: [
            "Severe Pain: Acute pain episodes during menstruation, ovulation, or intercourse that can disrupt daily life.",
            "Extreme Fatigue: A feeling of exhaustion and lack of energy that is more than just being tired.",
            "Gastrointestinal Upset: Painful bloating, diarrhea, or constipation that cycles with your period.",
            "Emotional Distress: The constant pain and unpredictability of symptoms can cause significant stress and anxiety.",
        ],
        longTermEffects: [
            "Infertility: About 30-50% of people with endometriosis experience infertility due to scar tissue, inflammation, or damage to the ovaries and fallopian tubes.",
            "Ovarian Cysts: Formation of cysts called endometriomas (or 'chocolate cysts') on the ovaries, which can affect ovarian function.",
            "Chronic Pelvic Pain: The nervous system can become sensitized over time, leading to pain that is constant and no longer tied to the menstrual cycle.",
            "Adhesions and Scar Tissue: Internal scar tissue can form, sometimes causing pelvic organs to stick together, which can be a source of chronic pain and organ dysfunction.",
            "Mental Health Challenges: Living with a chronic, painful illness can lead to higher rates of depression and anxiety.",
        ],
        precautions: [
            "Seek Early Diagnosis: If you have severely painful periods, don't dismiss it as normal. Talking to a doctor early can lead to better management and potentially slow the disease's progression.",
            "Adopt an Anti-Inflammatory Diet: Some find that limiting inflammatory foods (like red meat, processed foods, and sugar) and increasing anti-inflammatory foods (like leafy greens, fish, and berries) helps manage symptoms.",
            "Engage in Gentle Exercise: Low-impact activities like walking, swimming, or yoga can help reduce pain and improve mood, though high-impact exercise might be painful for some.",
            "Manage Stress: Since stress can worsen pain perception, incorporating practices like mindfulness, meditation, or gentle stretching is beneficial.",
        ],
        homeRemedies: [
            "Heat Therapy: Using a heating pad, hot water bottle, or taking a warm bath can help relax pelvic muscles and ease cramping.",
            "Over-the-Counter Pain Relievers: NSAIDs like ibuprofen or naproxen can be effective, especially if taken a day or two before your period starts to prevent severe pain.",
            "Pelvic Floor Relaxation: Gentle stretches and relaxation techniques can help ease tension in the pelvic muscles, which often tighten up due to chronic pain.",
            "Dietary Adjustments: Increasing fiber intake can help with painful bowel movements, and avoiding caffeine and alcohol during your period may reduce discomfort for some.",
        ],
        treatmentAndMedicines: [
            "Pain Medication: Nonsteroidal anti-inflammatory drugs (NSAIDs) are often the first line of treatment for pain relief.",
            "Hormone Therapy: Aims to slow tissue growth and prevent new implants. Options include birth control pills, hormonal IUDs, and GnRH agonists (which induce a temporary menopause).",
            "Laparoscopic Excision Surgery: A minimally invasive surgery considered the 'gold standard' where a surgeon carefully cuts out and removes the endometrial implants and scar tissue.",
            "Hysterectomy: The surgical removal of the uterus (and sometimes ovaries) is considered a last resort for severe cases where other treatments have failed and childbearing is complete.",
        ],
        whenToSeeDoctor: [
            "You experience severe period pain that causes you to miss school, work, or other daily activities.",
            "You are unable to get pregnant after one year of trying (or 6 months if you are over 35).",
            "You have pain during or after sex, or with bowel movements or urination, especially during your period.",
            "Over-the-counter pain medication does not relieve your period pain.",
            "You notice blood in your urine or stool during your period.",
        ],
        supportResources: [
            "Endometriosis Specialists: Find a gynecologist or a specialized center that focuses on endometriosis for expert care.",
            "Pelvic Floor Physical Therapists: Specialists who can help with pain caused by tight pelvic muscles.",
            "Patient Advocacy Groups: Organizations like the Endometriosis Foundation of America, The Endometriosis Network, and local country-specific groups offer resources and support.",
            "Mental Health Professionals: Therapists who specialize in chronic illness can help you cope with the emotional and psychological toll of the disease.",
        ],
        articles: [
            {
                title: "Endometriosis - A Detailed Guide",
                source: "Mayo Clinic",
                url: "https://www.mayoclinic.org/diseases-conditions/endometriosis/symptoms-causes/syc-20354656",
            },
            {
                title: "Endometriosis - Fact Sheet",
                source: "World Health Organization (WHO)",
                url: "https://www.who.int/news-room/fact-sheets/detail/endometriosis",
            },
        ],
    },
];

const ICONS = {
    Calendar: <Calendar />,
    Heart: <Heart />,
    Bone: <Bone />,
    Default: <Lightbulb />,
};

const getPlaceholderImage = () => "/img.jpeg";



const getLocalImageFor = (d) => {
    const name = d.name?.toLowerCase() || "";
    if (d.id === 1) return "/images (1).jpeg"; // first blog
    if (name.includes("pcos") || name.includes("pcod")) return "/images (3).jpeg"; // PCOD/PCOS
    if (name.includes("endometriosis")) return "/img3.jpeg"; // Endometriosis
    return "/images (1).jpeg"; // remaining
};

const Section = ({ title, children }) => {
    return (
        <section className="rounded-xl bg-light-surface dark:bg-dark-bg p-4 sm:p-6 shadow-sm border border-black/5 dark:border-white/5">
            <h3 className="text-lg sm:text-xl font-semibold text-light-primary-text dark:text-dark-primary-text mb-3">
                {title}
            </h3>
            <div className="text-sm sm:text-base text-light-secondary-text dark:text-dark-secondary-text leading-relaxed">
                {children}
            </div>
        </section>
    );
};

const Pill = ({ text }) => (
    <span className="inline-flex items-center rounded-full bg-light-bg dark:bg-dark-surface text-light-secondary-text dark:text-dark-secondary-text px-3 py-1 text-xs sm:text-sm">
        {text}
    </span>
);

const SheReadsContent = () => {
    const [query, setQuery] = useState("");
    const [activeCategory, setActiveCategory] = useState("All");
    const [selectedId, setSelectedId] = useState(null);

    const dataWithImages = useMemo(
        () =>
            womensInfo.map((d) => ({
                ...d,
                image: getLocalImageFor(d),
            })),
        []
    );

    const categories = useMemo(() => {
        const set = new Set(dataWithImages.map((d) => d.category));
        return ["All", ...Array.from(set)];
    }, [dataWithImages]);

    const filtered = useMemo(() => {
        return dataWithImages.filter((d) => {
            const matchesCategory =
                activeCategory === "All" || d.category === activeCategory;
            const q = query.trim().toLowerCase();
            const matchesQuery =
                !q ||
                d.name.toLowerCase().includes(q) ||
                d.description.toLowerCase().includes(q);
            return matchesCategory && matchesQuery;
        });
    }, [activeCategory, query, dataWithImages]);

    const selected = useMemo(
        () =>
            dataWithImages.find((d) => d.id === selectedId) ||
            filtered[0] ||
            dataWithImages[0],
        [selectedId, filtered, dataWithImages]
    );

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 space-y-6 sm:space-y-8">
            <div className="rounded-2xl overflow-hidden bg-light-surface dark:bg-dark-bg border border-black/5 dark:border-white/5">
                <div className="flex flex-col md:flex-row">
                    <div className="p-5 sm:p-8 md:w-1/2">
                        <h2 className="text-2xl sm:text-3xl font-bold text-light-primary-text dark:text-dark-primary-text">
                            Women’s Health Guide
                        </h2>
                        <p className="mt-2 text-light-secondary-text dark:text-dark-secondary-text">
                            Find simple information about women’s health
                            conditions. Search and tap to learn more.
                        </p>
                        <div className="mt-4">
                            <input
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search diseases (e.g., PCOS, pain)"
                                className="w-full rounded-xl bg-light-bg dark:bg-dark-surface text-light-primary-text dark:text-dark-primary-text placeholder:text-light-secondary-text dark:placeholder:text-dark-secondary-text border border-black/5 dark:border-white/5 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-light-primary dark:focus:ring-dark-primary"
                                aria-label="Search diseases"
                            />
                        </div>
                    </div>
                    <div className="md:w-1/2 relative">
                        <img
                            src={getPlaceholderImage("womens-health-hero")}
                            alt="Women's Health"
                            className="absolute top-0 left-0 w-full h-full object-cover object-center"
                            loading="lazy"
                        />
                    </div>
                </div>
            </div>

            <div className="flex gap-2 min-w-max w-full overflow-x-auto no-scrollbar items-center">
                {categories.map((cat) => (
                    <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className={`px-3 py-2 rounded-xl text-sm whitespace-nowrap border border-black/5 dark:border-white/5 ${activeCategory === cat
                            ? "bg-light-primary dark:bg-dark-primary text-white"
                            : "bg-light-surface dark:bg-dark-bg text-light-secondary-text dark:text-dark-secondary-text"
                            }`}
                        aria-pressed={activeCategory === cat}>
                        {cat}
                    </button>
                ))}
            </div>

            <div
                className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4"
                role="listbox"
                aria-label="Disease list">
                {filtered.map((item) => {
                    const isActive = selected?.id === item.id;
                    const icon = ICONS[item.icon] || ICONS.Default;
                    return (
                        <button
                            key={item.id}
                            role="option"
                            aria-selected={isActive}
                            onClick={() => setSelectedId(item.id)}
                            className={`text-left rounded-2xl overflow-hidden flex flex-col h-full border shadow-sm transition-colors ${isActive
                                ? "bg-light-primary/30 dark:bg-dark-primary/30 text-light-primary-text dark:text-dark-primary-text border-transparent"
                                : "bg-light-surface dark:bg-dark-bg text-light-primary-text dark:text-dark-primary-text border-black/5 dark:border-white/5"
                                }`}>
                            <div className="relative w-full pt-[75%] overflow-hidden">
                                <img
                                    src={item.image}
                                    alt={item.name}
                                    className={`absolute top-0 left-0 w-full h-full object-cover object-center ${isActive ? "opacity-90" : "opacity-100"
                                        }`}
                                    loading="lazy"
                                />
                            </div>
                            <div className="flex-1 p-2 sm:p-3 flex items-start gap-2">
                                <span
                                    className="text-lg sm:text-xl"
                                    aria-hidden>
                                    {icon}
                                </span>
                                <div className="min-w-0">
                                    <div className="text-[10px] sm:text-xs text-light-primary-text/80 dark:text-dark-primary-text/80">
                                        {item.category}
                                    </div>
                                    <div className="text-xs sm:text-sm md:text-base font-medium leading-snug line-clamp-3">
                                        {item.name}
                                    </div>
                                </div>
                            </div>
                        </button>
                    );
                })}
                {filtered.length === 0 && (
                    <div className="col-span-full text-center text-light-secondary-text dark:text-dark-secondary-text">
                        No results. Try a different word.
                    </div>
                )}
            </div>

            {selected && (
                <main className="space-y-3">
                    <div className="rounded-2xl overflow-hidden bg-light-surface dark:bg-dark-bg border border-black/5 dark:border-white/5">
                        <div className="relative w-full pt-[40%] overflow-hidden">
                            <img
                                src={selected.image}
                                alt={selected.name}
                                className="absolute top-0 left-0 w-full h-full object-cover object-center"
                                loading="lazy"
                            />
                        </div>
                        <div className="p-4 sm:p-6">
                            <div className="flex items-start gap-3">
                                <div className="text-2xl sm:text-3xl">
                                    {ICONS[selected.icon] || ICONS.Default}
                                </div>
                                <div className="space-y-2">
                                    <h2 className="text-xl sm:text-2xl font-bold text-light-primary-text dark:text-dark-primary-text">
                                        {selected.name}
                                    </h2>
                                    <div className="flex flex-wrap gap-2">
                                        <Pill
                                            text={`Category: ${selected.category}`}
                                        />
                                        {selected.severity && (
                                            <Pill
                                                text={`Severity: ${selected.severity}`}
                                            />
                                        )}
                                        {selected.ageGroup && (
                                            <Pill
                                                text={`Age: ${selected.ageGroup}`}
                                            />
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <Section title="About">
                        <p>{selected.description}</p>
                        {selected.prevalence && (
                            <p className="mt-2 dark:bg-red-600/20 bg-red-600/30 text-light-primary-text dark:text-dark-primary-text px-2 py-2 w-fit rounded-md flex items-center gap-1">
                                <Info size={20} />
                                {selected.prevalence}
                            </p>
                        )}
                    </Section>

                    {selected.causes?.length > 0 && (
                        <Section title="Common Causes">
                            <ul className="list-disc pl-5 space-y-1">
                                {selected.causes.map((c, i) => (
                                    <li key={i}>{c}</li>
                                ))}
                            </ul>
                        </Section>
                    )}

                    {selected.symptoms && (
                        <Section title="Symptoms">
                            <div className="grid sm:grid-cols-3 gap-3 sm:gap-4">
                                {selected.symptoms.mild?.length > 0 && (
                                    <div className="bg-green-600/20 rounded-xl p-3">
                                        <h4 className="font-semibold text-xl text-light-primary-text dark:text-dark-primary-text mb-2 pl-3">
                                            Mild
                                        </h4>
                                        <ul className="list-disc pl-5 text-base space-y-1 text-light-primary-text/80 dark:text-dark-primary-text/80">
                                            {selected.symptoms.mild.map(
                                                (s, i) => (
                                                    <li key={i}>{s}</li>
                                                )
                                            )}
                                        </ul>
                                    </div>
                                )}
                                {selected.symptoms.moderate?.length > 0 && (
                                    <div className="bg-yellow-600/20 rounded-xl p-3">
                                        <h4 className="font-semibold text-xl text-light-primary-text dark:text-dark-primary-text mb-2 pl-3">
                                            Moderate
                                        </h4>
                                        <ul className="list-disc pl-5 text-base space-y-1 text-light-primary-text/80 dark:text-dark-primary-text/80">
                                            {selected.symptoms.moderate.map(
                                                (s, i) => (
                                                    <li key={i}>{s}</li>
                                                )
                                            )}
                                        </ul>
                                    </div>
                                )}
                                {selected.symptoms.severe?.length > 0 && (
                                    <div className="bg-red-600/20 rounded-xl p-3">
                                        <h4 className="font-semibold text-xl text-light-primary-text dark:text-dark-primary-text mb-2 pl-3">
                                            Severe
                                        </h4>
                                        <ul className="list-disc pl-5 text-base space-y-1 text-light-primary-text/80 dark:text-dark-primary-text/80">
                                            {selected.symptoms.severe.map(
                                                (s, i) => (
                                                    <li key={i}>{s}</li>
                                                )
                                            )}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </Section>
                    )}

                    {selected.riskFactors?.length > 0 && (
                        <Section title="Who Can Be At Risk?">
                            <ul className="list-disc pl-5 space-y-1">
                                {selected.riskFactors.map((r, i) => (
                                    <li key={i}>{r}</li>
                                ))}
                            </ul>
                        </Section>
                    )}

                    {selected.shortTermEffects?.length > 0 && (
                        <Section title="Short-term Effects">
                            <ul className="list-disc pl-5 space-y-1">
                                {selected.shortTermEffects.map((r, i) => (
                                    <li key={i}>{r}</li>
                                ))}
                            </ul>
                        </Section>
                    )}

                    {selected.longTermEffects?.length > 0 && (
                        <Section title="Long-term Effects">
                            <ul className="list-disc pl-5 space-y-1">
                                {selected.longTermEffects.map((r, i) => (
                                    <li key={i}>{r}</li>
                                ))}
                            </ul>
                        </Section>
                    )}

                    {selected.precautions?.length > 0 && (
                        <Section title="Precautions">
                            <ul className="list-disc pl-5 space-y-1">
                                {selected.precautions.map((r, i) => (
                                    <li key={i}>{r}</li>
                                ))}
                            </ul>
                        </Section>
                    )}

                    {selected.homeRemedies?.length > 0 && (
                        <Section title="Home Remedies">
                            <ul className="list-disc pl-5 space-y-1">
                                {selected.homeRemedies.map((r, i) => (
                                    <li key={i}>{r}</li>
                                ))}
                            </ul>
                        </Section>
                    )}

                    {selected.treatmentAndMedicines?.length > 0 && (
                        <Section title="Treatment & Medicines">
                            <ul className="list-disc pl-5 space-y-1">
                                {selected.treatmentAndMedicines.map((r, i) => (
                                    <li key={i}>{r}</li>
                                ))}
                            </ul>
                        </Section>
                    )}

                    {selected.whenToSeeDoctor?.length > 0 && (
                        <Section title="When To See A Doctor">
                            <ul className="list-disc pl-5 space-y-1">
                                {selected.whenToSeeDoctor.map((r, i) => (
                                    <li key={i}>{r}</li>
                                ))}
                            </ul>
                        </Section>
                    )}

                    {selected.supportResources?.length > 0 && (
                        <Section title="Support & Resources">
                            <ul className="list-disc pl-5 space-y-1">
                                {selected.supportResources.map((r, i) => (
                                    <li key={i}>{r}</li>
                                ))}
                            </ul>
                        </Section>
                    )}

                    {selected.articles?.length > 0 && (
                        <Section title="Helpful Articles">
                            <ul className="space-y-2">
                                {selected.articles.map((a, i) => (
                                    <li
                                        key={i}
                                        className="flex items-center justify-between gap-3">
                                        <div>
                                            <p className="font-medium text-light-primary-text dark:text-dark-primary-text">
                                                {a.title}
                                            </p>
                                            <p className="text-xs text-light-secondary-text dark:text-dark-secondary-text">
                                                {a.source} • {a.type}
                                            </p>
                                        </div>
                                        <a
                                            href={a.url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="px-3 py-2 rounded-lg text-sm bg-light-primary dark:bg-dark-primary text-white">
                                            Open
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </Section>
                    )}

                    {selected.disclaimer && (
                        <Section title="Disclaimer">
                            <p>{selected.disclaimer}</p>
                        </Section>
                    )}
                </main>
            )}
        </div>
    );
};

export default SheReadsContent;