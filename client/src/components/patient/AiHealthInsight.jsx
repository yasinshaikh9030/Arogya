import React from 'react';
import {
    Heart,
    AlertTriangle,
    Leaf,
    Pill,
    AlertCircle,
    Lightbulb,
    Shield,
    CheckCircle2,
    XCircle
} from 'lucide-react';

const AiHealthInsight = ({ aiInsight }) => {
    if (!aiInsight) return null;

    const {
        healthState,
        possibleDiseases,
        remedies,
        appointmentUrgency,
        consultationSuggestion,
        urgent,
        lifestyleAdvice,
        disclaimer
    } = aiInsight;

    // Utility: Safely convert objects → clean text
    const formatItem = (item) => {
        if (!item) return "";

        if (typeof item === "string") return item;

        if (typeof item === "object") {
            let name = item.name ? item.name : "";
            let desc = item.description ? item.description : "";
            return `${name}${desc ? ` – ${desc}` : ""}`.trim();
        }

        return String(item);
    };

    const getHealthStateColor = (state) => {
        switch (state?.toLowerCase()) {
            case 'good': return 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-300';
            case 'mild': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-300';
            case 'moderate': return 'text-orange-600 bg-orange-100 dark:bg-orange-900/30 dark:text-orange-300';
            case 'severe': return 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-300';
            default: return 'text-gray-600 bg-light-surface dark:bg-dark-surface dark:text-gray-300';
        }
    };

    const getHealthStateIcon = (state) => {
        switch (state?.toLowerCase()) {
            case 'good': return <CheckCircle2 className="w-5 h-5" />;
            case 'mild': return <AlertCircle className="w-5 h-5" />;
            case 'moderate': return <AlertTriangle className="w-5 h-5" />;
            case 'severe': return <XCircle className="w-5 h-5" />;
            default: return <Heart className="w-5 h-5" />;
        }
    };

    return (
        <div className="space-y-6 mt-8">
            {/* Health State Overview */}
            <div className="bg-light-bg dark:bg-dark-surface rounded-2xl p-6 shadow-lg">
                <div className="flex items-center gap-3 mb-4">
                    <Heart className="w-6 h-6 text-light-primary dark:text-dark-primary" />
                    <h3 className="text-xl font-bold text-light-primary-text dark:text-dark-primary-text">
                        Health Analysis
                    </h3>
                </div>

                <div className="flex items-center gap-3">
                    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-lg font-semibold ${getHealthStateColor(healthState)}`}>
                        {getHealthStateIcon(healthState)}
                        {healthState || 'Unknown'}
                    </div>
                    <p className="text-light-secondary-text dark:text-dark-secondary-text">
                        Overall health condition assessment
                    </p>
                </div>
            </div>

            {/* Possible Diseases */}
            {possibleDiseases && possibleDiseases.length > 0 && (
                <div className="bg-light-bg dark:bg-dark-surface rounded-2xl p-6 shadow-lg">
                    <div className="flex items-center gap-3 mb-4">
                        <AlertTriangle className="w-6 h-6 text-amber-500" />
                        <h3 className="text-xl font-bold text-light-primary-text dark:text-dark-primary-text">
                            Possible Conditions
                        </h3>
                    </div>

                    <div className="space-y-4 ">
                        {possibleDiseases.map((disease, index) => {
                            const diseaseName = formatItem(disease.name);
                            const probabilityText = formatItem(disease.probability || disease.confidence);
                            const reasonText = formatItem(disease.reason);
                            const severity = disease.severity;
                            const consultationType = disease.recommendedConsultationType || disease.recommended_consultation_type;

                            const getSeverityColor = (sev) => {
                                switch (sev?.toLowerCase()) {
                                    case 'mild': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
                                    case 'moderate': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300';
                                    case 'severe': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';
                                    default: return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300';
                                }
                            };

                            return (
                                <div key={index} className="bg-light-surface dark:bg-dark-bg rounded-xl p-4">
                                    <div className="flex items-start justify-between mb-2">
                                        <h4 className="font-semibold text-light-primary-text dark:text-dark-primary-text text-lg">
                                            {diseaseName}
                                        </h4>
                                        <div className="flex items-center gap-2">
                                            {severity && (
                                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getSeverityColor(severity)}`}>
                                                    {severity}
                                                </span>
                                            )}
                                            <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium">
                                                {probabilityText}
                                            </span>
                                        </div>
                                    </div>
                                    <p className="text-light-secondary-text dark:text-dark-secondary-text mb-2">
                                        {reasonText}
                                    </p>
                                    {consultationType && (
                                        <div className="flex items-center gap-2 mt-2">
                                            <span className="text-xs text-light-secondary-text dark:text-dark-secondary-text">
                                                Recommended:
                                            </span>
                                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                                                consultationType === 'online' 
                                                    ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                                                    : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300'
                                            }`}>
                                                {consultationType === 'online' ? 'Online Consultation' : 'Offline Consultation'}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Remedies */}
            {remedies && remedies.length > 0 && (
                <div className="bg-light-bg dark:bg-dark-surface rounded-2xl p-6 shadow-lg">
                    <div className="flex items-center gap-3 mb-4">
                        <Leaf className="w-6 h-6 text-green-600" />
                        <h3 className="text-xl font-bold text-light-primary-text dark:text-dark-primary-text">
                            Home Remedies
                        </h3>
                    </div>

                    <ul className="space-y-3">
                        {remedies.map((remedy, index) => {
                            const remedyName = remedy.name || (typeof remedy === "string" ? remedy : "");
                            const remedyDesc = remedy.description || (typeof remedy === "string" ? "" : "");
                            
                            return (
                                <li key={index} className="flex items-start gap-3">
                                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                                    <div>
                                        {remedyName && (
                                            <span className="font-semibold text-light-primary-text dark:text-dark-primary-text">
                                                {remedyName}
                                            </span>
                                        )}
                                        {remedyDesc && (
                                            <p className="text-light-secondary-text dark:text-dark-secondary-text text-sm mt-1">
                                                {remedyDesc}
                                            </p>
                                        )}
                                        {!remedyName && !remedyDesc && (
                                            <span className="text-light-primary-text dark:text-dark-primary-text">
                                                {formatItem(remedy)}
                                            </span>
                                        )}
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            )}

            {/* Appointment Urgency */}
            {appointmentUrgency && (
                <div className={`rounded-2xl p-6 shadow-lg ${
                    parseInt(appointmentUrgency.scale_1_to_5) >= 4
                        ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                        : parseInt(appointmentUrgency.scale_1_to_5) >= 3
                        ? 'bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800'
                        : 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                }`}>
                    <div className="flex items-center gap-3 mb-3">
                        <AlertCircle className={`w-6 h-6 ${
                            parseInt(appointmentUrgency.scale_1_to_5) >= 4
                                ? 'text-red-600'
                                : parseInt(appointmentUrgency.scale_1_to_5) >= 3
                                ? 'text-orange-600'
                                : 'text-blue-600'
                        }`} />
                        <div>
                            <h3 className={`text-xl font-bold ${
                                parseInt(appointmentUrgency.scale_1_to_5) >= 4
                                    ? 'text-red-800 dark:text-red-200'
                                    : parseInt(appointmentUrgency.scale_1_to_5) >= 3
                                    ? 'text-orange-800 dark:text-orange-200'
                                    : 'text-blue-800 dark:text-blue-200'
                            }`}>
                                Appointment Urgency: {appointmentUrgency.level || 'Unknown'}
                            </h3>
                            <p className="text-sm text-light-secondary-text dark:text-dark-secondary-text mt-1">
                                Scale: {appointmentUrgency.scale_1_to_5}/5
                            </p>
                        </div>
                    </div>
                    {appointmentUrgency.reason && (
                        <p className={`${
                            parseInt(appointmentUrgency.scale_1_to_5) >= 4
                                ? 'text-red-700 dark:text-red-300'
                                : parseInt(appointmentUrgency.scale_1_to_5) >= 3
                                ? 'text-orange-700 dark:text-orange-300'
                                : 'text-blue-700 dark:text-blue-300'
                        }`}>
                            {appointmentUrgency.reason}
                        </p>
                    )}
                </div>
            )}

            {/* Consultation Suggestion */}
            {consultationSuggestion && (
                <div className="bg-light-bg dark:bg-dark-surface rounded-2xl p-6 shadow-lg border border-light-primary/20 dark:border-dark-primary/20">
                    <div className="flex items-center gap-3 mb-2">
                        <CheckCircle2 className="w-6 h-6 text-light-primary dark:text-dark-primary" />
                        <h3 className="text-xl font-bold text-light-primary-text dark:text-dark-primary-text">
                            Consultation Recommendation
                        </h3>
                    </div>
                    <p className="text-light-primary-text dark:text-dark-primary-text">
                        {consultationSuggestion}
                    </p>
                </div>
            )}

            {/* Urgent Flag */}
            {urgent && urgent.toLowerCase() !== 'no' && (
                <div className="rounded-2xl p-6 shadow-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                    <div className="flex items-center gap-3 mb-2">
                        <AlertCircle className="w-6 h-6 text-red-600" />
                        <h3 className="text-xl font-bold text-red-800 dark:text-red-200">
                            Urgent Attention Required
                        </h3>
                    </div>
                    <p className="text-red-700 dark:text-red-300">
                        {urgent}
                    </p>
                </div>
            )}

            {/* Lifestyle Advice */}
            {lifestyleAdvice && lifestyleAdvice.length > 0 && (
                <div className="bg-light-bg dark:bg-dark-surface rounded-2xl p-6 shadow-lg">
                    <div className="flex items-center gap-3 mb-4">
                        <Lightbulb className="w-6 h-6 text-yellow-500" />
                        <h3 className="text-xl font-bold text-light-primary-text dark:text-dark-primary-text">
                            Lifestyle Tips
                        </h3>
                    </div>

                    <ul className="space-y-3">
                        {lifestyleAdvice.map((advice, index) => {
                            const adviceName = advice.name || (typeof advice === "string" ? advice : "");
                            const adviceDesc = advice.description || (typeof advice === "string" ? "" : "");
                            
                            return (
                                <li key={index} className="flex items-start gap-3">
                                    <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
                                    <div>
                                        {adviceName && (
                                            <span className="font-semibold text-light-primary-text dark:text-dark-primary-text">
                                                {adviceName}
                                            </span>
                                        )}
                                        {adviceDesc && (
                                            <p className="text-light-secondary-text dark:text-dark-secondary-text text-sm mt-1">
                                                {adviceDesc}
                                            </p>
                                        )}
                                        {!adviceName && !adviceDesc && (
                                            <span className="text-light-primary-text dark:text-dark-primary-text">
                                                {formatItem(advice)}
                                            </span>
                                        )}
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            )}

            {/* Disclaimer */}
            {disclaimer && (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-6">
                    <div className="flex items-start gap-3">
                        <Shield className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <h4 className="font-semibold text-amber-800 dark:text-amber-200 mb-2">Important Disclaimer</h4>
                            <p className="text-amber-700 dark:text-amber-300 text-sm">
                                {String(disclaimer)}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AiHealthInsight;
