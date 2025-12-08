// client/src/pages/patientPages/MedicalHistory/PatientMedicalHistory.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useUser, useAuth } from "@clerk/clerk-react";
import Sidebar from "../../../components/Sidebar";
import Loader from "../../../components/main/Loader";
import jsPDF from "jspdf";

const emptyState = {
  medicalHistory: "",
  alergies: [],
  operations: [],
  ongoingMedications: [],
  permanentMedications: [],
  majorDiseases: [],
  disabilities: [],
  documents: [],
  summary: "",
};

const PatientMedicalHistory = ({ tabs }) => {
  const { user } = useUser();
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState(emptyState);
  const [newFiles, setNewFiles] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) return;
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const token = await getToken();
        const res = await axios.get(
          `${import.meta.env.VITE_SERVER_URL}/api/patient/${user.id}/medical-history`,
          token
            ? { headers: { Authorization: `Bearer ${token}` } }
            : undefined
        );
        if (!mounted) return;
        const d = res.data?.data || {};
        setData({
          medicalHistory: d.medicalHistory || "",
          alergies: d.alergies || [],
          operations: d.operations || [],
          ongoingMedications: d.ongoingMedications || [],
          permanentMedications: d.permanentMedications || [],
          majorDiseases: d.majorDiseases || [],
          disabilities: d.disabilities || [],
          documents: d.documents || [],
          summary: d.summary || "",
        });
      } catch (e) {
        console.error(e?.response?.data || e);
        setError("Failed to load medical history");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [user, getToken]);

  const handleDownloadSummaryPdf = () => {
    if (!data.summary) return;
    try {
      const doc = new jsPDF({ orientation: "p", unit: "mm", format: "a4" });
      const marginLeft = 15;
      const marginTop = 20;
      const maxWidth = 180; // A4 width minus margins

      doc.setFont("Helvetica", "normal");
      doc.setFontSize(14);
      doc.text("Medical history summary", marginLeft, marginTop);

      doc.setFontSize(11);
      const lines = doc.splitTextToSize(data.summary, maxWidth);
      doc.text(lines, marginLeft, marginTop + 8);

      doc.save("medical-history-summary.pdf");
    } catch (err) {
      console.error("Failed to download summary PDF", err);
    }
  };

  const handleArrayChange = (field, index, value) => {
    setData((prev) => {
      const arr = [...(prev[field] || [])];
      arr[index] = value;
      return { ...prev, [field]: arr };
    });
  };

  const handleArrayAdd = (field) => {
    setData((prev) => ({ ...prev, [field]: [...(prev[field] || []), ""] }));
  };

  const handleArrayRemove = (field, index) => {
    setData((prev) => {
      const arr = [...(prev[field] || [])];
      arr.splice(index, 1);
      return { ...prev, [field]: arr };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;
    try {
      setSaving(true);
      const formData = new FormData();
      formData.append("medicalHistory", data.medicalHistory || "");
      [
        "alergies",
        "operations",
        "ongoingMedications",
        "permanentMedications",
        "majorDiseases",
        "disabilities",
      ].forEach((field) => {
        (data[field] || []).forEach((val) => {
          if (val && val.trim()) formData.append(field, val.trim());
        });
      });
      for (const file of newFiles) {
        formData.append("documents", file);
      }
      const token = await getToken();
      const res = await axios.post(
        `${import.meta.env.VITE_SERVER_URL}/api/patient/${user.id}/medical-history`,
        formData,
        token
          ? {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "multipart/form-data",
              },
            }
          : undefined
      );
      const d = res.data?.data || {};
      setData((prev) => ({
        ...prev,
        alergies: d.alergies || prev.alergies,
        operations: d.operations || prev.operations,
        ongoingMedications: d.ongoingMedications || prev.ongoingMedications,
        permanentMedications: d.permanentMedications || prev.permanentMedications,
        majorDiseases: d.majorDiseases || prev.majorDiseases,
        disabilities: d.disabilities || prev.disabilities,
        documents: d.documents || prev.documents,
        summary: d.summary || prev.summary,
      }));
      setNewFiles([]);
    } catch (e) {
      console.error(e?.response?.data || e);
      setError("Failed to save medical history");
    } finally {
      setSaving(false);
    }
  };

  if (!user || loading) {
    return <Loader />;
  }

  return (
    <div className="flex relative">
      <Sidebar tabs={tabs} />
      <div className="min-h-screen w-full bg-light-bg dark:bg-dark-surface md:py-8 md:px-5 py-5">
        <h1 className="text-2xl font-bold mb-4 text-light-primary-text dark:text-dark-primary-text">
          Medical History
        </h1>
        {error && (
          <div className="mb-4 text-red-600 dark:text-red-400 text-sm">{error}</div>
        )}
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="rounded-2xl bg-light-surface dark:bg-dark-bg p-4 shadow-md">
              <p className="text-sm font-semibold mb-2 text-light-primary-text dark:text-dark-primary-text">General history</p>
              <textarea
                rows={4}
                value={data.medicalHistory}
                onChange={(e) => setData((p) => ({ ...p, medicalHistory: e.target.value }))}
                className="w-full rounded-lg border border-light-secondary-text/20 dark:border-dark-secondary-text/20 bg-light-background dark:bg-dark-background px-3 py-2 text-sm text-light-primary-text dark:text-dark-primary-text focus:outline-none focus:ring-2 focus:ring-light-primary dark:focus:ring-dark-primary"
                placeholder="Describe important past illnesses, hospitalisations, or other medical details."
              />
            </div>

            {[
              { field: "alergies", label: "Allergies" },
              { field: "operations", label: "Operations / Surgeries" },
              { field: "ongoingMedications", label: "Ongoing Medications" },
              { field: "permanentMedications", label: "Permanent/long-term Medications" },
              { field: "majorDiseases", label: "Major chronic diseases" },
              { field: "disabilities", label: "Disabilities" },
            ].map(({ field, label }) => (
              <div
                key={field}
                className="rounded-2xl bg-light-surface dark:bg-dark-bg p-4 shadow-md"
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-light-primary-text dark:text-dark-primary-text">
                    {label}
                  </p>
                  <button
                    type="button"
                    onClick={() => handleArrayAdd(field)}
                    className="text-xs px-2 py-1 rounded-md bg-light-primary text-white dark:bg-dark-primary"
                  >
                    Add
                  </button>
                </div>
                {(data[field] || []).length === 0 && (
                  <p className="text-xs text-light-secondary-text dark:text-dark-secondary-text">
                    No entries yet.
                  </p>
                )}
                <div className="space-y-2 mt-2">
                  {(data[field] || []).map((val, idx) => (
                    <div key={idx} className="flex gap-2">
                      <input
                        type="text"
                        value={val}
                        onChange={(e) => handleArrayChange(field, idx, e.target.value)}
                        className="flex-1 rounded-lg border border-light-secondary-text/20 dark:border-dark-secondary-text/20 bg-light-background dark:bg-dark-background px-3 py-1.5 text-sm text-light-primary-text dark:text-dark-primary-text focus:outline-none focus:ring-2 focus:ring-light-primary dark:focus:ring-dark-primary"
                      />
                      <button
                        type="button"
                        onClick={() => handleArrayRemove(field, idx)}
                        className="px-2 py-1 text-xs rounded-md bg-red-500 text-white"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <div className="rounded-2xl bg-light-surface dark:bg-dark-bg p-4 shadow-md">
              <p className="text-sm font-semibold mb-2 text-light-primary-text dark:text-dark-primary-text">
                Upload reports / certificates
              </p>

              <div className="flex flex-col gap-2">
                <div>
                  <label
                    htmlFor="medical-history-documents"
                    className="inline-flex items-center justify-center px-4 py-2 text-xs font-semibold rounded-lg bg-light-primary text-white dark:bg-dark-primary cursor-pointer hover:bg-light-primary-dark dark:hover:bg-dark-primary-dark"
                  >
                    Choose files
                  </label>
                  <input
                    id="medical-history-documents"
                    type="file"
                    multiple
                    onChange={(e) => setNewFiles(Array.from(e.target.files || []))}
                    className="hidden"
                  />
                </div>

                {newFiles.length > 0 && (
                  <div className="mt-1 text-xs text-light-secondary-text dark:text-dark-secondary-text space-y-1">
                    <p className="font-semibold">Selected (will be uploaded on save):</p>
                    {newFiles.map((file, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span>{file.name}</span>
                      </div>
                    ))}
                  </div>
                )}

                {data.documents?.length > 0 && (
                  <div className="mt-2 text-xs text-light-secondary-text dark:text-dark-secondary-text space-y-1">
                    <p className="font-semibold">Already uploaded:</p>
                    {data.documents.map((doc, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span>{doc.title || doc.fileUrl}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl bg-light-surface dark:bg-dark-bg p-4 shadow-md">
              <p className="text-sm font-semibold mb-2 text-light-primary-text dark:text-dark-primary-text">
                Doctor summary (AI-generated)
              </p>
              {data.summary ? (
                <pre className="whitespace-pre-wrap text-xs text-light-primary-text dark:text-dark-primary-text bg-light-background dark:bg-dark-background p-3 rounded-lg border border-light-secondary-text/20 dark:border-dark-secondary-text/20">
                  {data.summary}
                </pre>
              ) : (
                <p className="text-xs text-light-secondary-text dark:text-dark-secondary-text">
                  Once you save your medical history, an AI summary will be generated here for doctors.
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={handleDownloadSummaryPdf}
              disabled={!data.summary}
              className={`w-full px-4 py-2 rounded-lg text-sm font-semibold border transition ${
                data.summary
                  ? "border-light-primary text-light-primary hover:bg-light-primary/5 dark:border-dark-primary dark:text-dark-primary dark:hover:bg-dark-primary/10"
                  : "border-light-secondary-text/40 text-light-secondary-text cursor-not-allowed dark:border-dark-secondary-text/40 dark:text-dark-secondary-text"
              }`}
            >
              Download summary as PDF
            </button>

            <button
              type="submit"
              disabled={saving}
              className={`w-full px-4 py-2 rounded-lg text-sm font-semibold text-white bg-light-primary dark:bg-dark-primary hover:bg-light-primary-dark dark:hover:bg-dark-primary-dark transition ${
                saving ? "opacity-70 cursor-not-allowed" : ""
              }`}
            >
              {saving ? "Saving..." : "Save medical history"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PatientMedicalHistory;
