import React, { useState, useRef, useEffect } from "react";
import { PhoneOutgoing } from "lucide-react";
import axios from "axios";
import { useUser } from "@clerk/clerk-react";

// Helper: extract preferred time (in 24-hour "HH:MM") from the user's text
// Supports things like: "after 3:00 a.m.", "after 3 am", "at 4 pm", "around 9:30 p.m."
const extractPreferredTime24 = (inputText) => {
  if (!inputText) return null;
  const lower = inputText.toLowerCase();

  // Look for "after/around/at <hour>[:<minute>] <am/pm>"
  const regex =
    /(after|around|at)\s+(\d{1,2})(?::(\d{2}))?\s*(a\.?m\.?|p\.?m\.?)/i;
  const match = lower.match(regex);
  if (!match) return null;

  let hour = parseInt(match[2], 10);
  let minute = match[3] ? parseInt(match[3], 10) : 0;
  const ampm = match[4];

  const isPM = /p/.test(ampm);
  const isAM = /a/.test(ampm);

  // Convert to 24-hour
  if (isPM && hour < 12) hour += 12;
  if (isAM && hour === 12) hour = 0;

  const hh = hour.toString().padStart(2, "0");
  const mm = minute.toString().padStart(2, "0");
  return `${hh}:${mm}`;
};

const BookWithCallRightNow = () => {
  const [showModal, setShowModal] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");

  const [doctors, setDoctors] = useState([]);
  const [doctorLoading, setDoctorLoading] = useState(true);
  const [doctorError, setDoctorError] = useState(null);

  // Booking state
  const [bookingStage, setBookingStage] = useState("idle"); // idle | fetchingUser | analysingAI | gettingDoctors | searchingSlots | bookingSlot | completed | error
  const [bookingMessage, setBookingMessage] = useState("");
  const [bookingError, setBookingError] = useState("");
  const [bookedInfo, setBookedInfo] = useState(null);

  const { user } = useUser();
  const recognitionRef = useRef(null);

  const API_BASE_URL = import.meta.env.VITE_SERVER_URL;

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setDoctorLoading(true);
        const res = await axios.get(`${API_BASE_URL}/api/doctor/verified-doctors`);
        if (!mounted) return;
        setDoctors(res.data?.data || []);
        (res.data?.data || []).forEach((doc) =>
          console.log("Doctor Details:", doc)
        );
        console.log("Loaded doctors:", res.data?.data || []);
      } catch (err) {
        console.error(err);
        setDoctorError("Failed to load doctors");
      } finally {
        if (mounted) setDoctorLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [API_BASE_URL]);

  const handleMicClick = () => {
    if (!isRecording) {
      if (
        !("webkitSpeechRecognition" in window) &&
        !("SpeechRecognition" in window)
      ) {
        alert("Speech recognition not supported in this browser.");
        return;
      }
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = "en-US";
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onresult = (event) => {
        let finalTranscript = "";
        let interim = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcriptPart = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            // Add a space between chunks if needed
            finalTranscript += (finalTranscript ? " " : "") + transcriptPart;
          } else {
            interim += transcriptPart;
          }
        }
        if (finalTranscript) setTranscript((prev) => (prev ? prev + " " : "") + finalTranscript);
        setInterimTranscript(interim);
      };

      recognition.onerror = () => setIsRecording(false);
      recognition.onend = () => {
        setIsRecording(false);
        setInterimTranscript("");
      };
      recognitionRef.current = recognition;
      setIsRecording(true);
      recognition.start();
    } else {
      recognitionRef.current && recognitionRef.current.stop();
      setIsRecording(false);
    }
  };

  const clearTranscript = () => {
    setTranscript("");
    setInterimTranscript("");
  };

  const isBooking =
    bookingStage === "fetchingUser" ||
    bookingStage === "analysingAI" ||
    bookingStage === "gettingDoctors" ||
    bookingStage === "searchingSlots" ||
    bookingStage === "bookingSlot";

  const getBookButtonLabel = () => {
    switch (bookingStage) {
      case "fetchingUser":
        return "Fetching user data...";
      case "analysingAI":
        return "Analysing with AI...";
      case "gettingDoctors":
        return "Getting doctor details...";
      case "searchingSlots":
        return "Searching for slots...";
      case "bookingSlot":
        return "Booking your slot...";
      case "completed":
        return "Booked ✔";
      case "error":
        return "Try again";
      default:
        return "Book";
    }
  };

  const handleBook = async () => {
    if (!transcript.trim() || isBooking) return;

    setBookingError("");
    setBookedInfo(null);
    setBookingStage("fetchingUser");
    setBookingMessage("Fetching your profile details...");

    try {
      const patientId = user?.id;
      if (!patientId) {
        throw new Error("User not found. Please log in again.");
      }

      // Step 2: call Gemini
      setBookingStage("analysingAI");
      setBookingMessage("Analysing your request with AI...");

      const now = new Date();
      const userInput = transcript.trim();

      const prompt = `
You are an AI assistant for appointment booking. The user provided the following input for booking a doctor appointment:

---
Input: ${userInput}
Current DateTime (Asia/Kolkata, UTC+05:30): ${now.toISOString()}
---

IMPORTANT:
- Assume the user is in the Asia/Kolkata timezone (UTC+05:30).
- When the user says "today", "tomorrow", etc., interpret dates relative to this timezone.
- If the user says "3:00 a.m." interpret as morning (03:00) in 24-hour format.
- If the user says "3:00 p.m." interpret as afternoon (15:00) in 24-hour format.
- Do NOT convert the time to UTC.
- Return the appointmentDateTime in LOCAL time (Asia/Kolkata) WITHOUT any timezone suffix (no 'Z', no offset).

Extract and suggest:
- The most appropriate appointment date and time (ISO-like format in local time, as requested by the patient)
- The medium of consultation ("online" or "offline")
- An array of symptoms extracted from the input

Respond ONLY in the following JSON format:
{
  "appointmentDateTime": "YYYY-MM-DDTHH:MM:SS",
  "consultationMedium": "online | offline",
  "symptoms": ["symptom1", "symptom2", ...]
}`;

      const aiRes = await fetch(`${API_BASE_URL}/api/ai/gemini-booking`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      let data = await aiRes.json();
      console.log("Gemini AI raw response:", data);

      if (typeof data === "string") {
        try {
          data = JSON.parse(data);
        } catch (err) {
          console.error("Failed to parse Gemini JSON:", err);
        }
      }

      if (!data || !data.appointmentDateTime) {
        throw new Error("AI could not understand your request. Please rephrase.");
      }

      console.log(
        "Gemini parsed appointmentDateTime:",
        data.appointmentDateTime
      );

      const cleanedDateTime = data.appointmentDateTime.replace("Z", "").trim();
      const [datePart, timePartRaw] = cleanedDateTime.split("T");
      const geminiDate = datePart; // "YYYY-MM-DD"
      const timePart = (timePartRaw || "00:00:00").trim();
      const gemini24HrTime = timePart.slice(0, 5); // "HH:MM"

      const userPreferredTime24 = extractPreferredTime24(userInput);
      console.log("User time extracted from input:", userPreferredTime24);

      const effective24HrTime = userPreferredTime24 || gemini24HrTime;
      const symptoms = Array.isArray(data.symptoms) ? data.symptoms : [];

      console.log("Parsed from Gemini + user:", {
        cleanedDateTime,
        geminiDate,
        gemini24HrTime,
        userPreferredTime24,
        effective24HrTime,
        symptoms,
      });

      // Step 3: doctor details
      setBookingStage("gettingDoctors");
      setBookingMessage("Getting doctor details...");

      if (doctorLoading) {
        // Wait a tiny bit if doctors are still loading
        await new Promise((r) => setTimeout(r, 300));
      }

      if (doctorError) {
        throw new Error("Unable to load doctors at the moment.");
      }

      const generalDoctors = doctors.filter((doc) =>
        (doc.specialty || "").toLowerCase().includes("general")
      );

      console.log("General Practice Doctors:", generalDoctors);

      if (!generalDoctors.length) {
        throw new Error("No general practice doctors are available right now.");
      }

      // Step 4: search slots
      setBookingStage("searchingSlots");
      setBookingMessage("Searching for best matching slots...");

      let chosenDoctor = null;
      let chosenSlot = null;

      for (const doc of generalDoctors) {
        try {
          const resSlots = await fetch(
            `${API_BASE_URL}/api/doctor/${doc._id}/slots?date=${geminiDate}`
          );
          const slotData = await resSlots.json();
          const allSlots = Array.isArray(slotData.data) ? slotData.data : [];

          console.log(
            `All slots for Dr. ${doc.fullName} on ${geminiDate}:`
          );
          allSlots.forEach((slot) => console.log(`  - ${slot}`));

          const sortedSlots = [...allSlots].sort(); // ensure chronological
          const slotsAfter = sortedSlots.filter(
            (slot) => slot >= effective24HrTime
          );

          const candidateSlot = slotsAfter[0] || sortedSlots[0] || null;

          if (candidateSlot) {
            chosenDoctor = doc;
            chosenSlot = candidateSlot;
            break;
          }
        } catch (err) {
          console.error(
            `Error fetching slots for Dr. ${doc.fullName}:`,
            err
          );
        }
      }

      if (!chosenDoctor || !chosenSlot) {
        throw new Error(
          "No suitable slots available around your requested time."
        );
      }

      console.log(
        "Chosen doctor & slot:",
        chosenDoctor.fullName,
        chosenSlot
      );

      // Step 5: book slot
      setBookingStage("bookingSlot");
      setBookingMessage(
        `Booking your slot with Dr. ${chosenDoctor.fullName}...`
      );

      const formData = new FormData();
      formData.append("doctorId", chosenDoctor._id);
      formData.append("patientId", patientId);
      formData.append("scheduledAt", `${geminiDate}T${chosenSlot}`);
      formData.append("appointmentType", "online"); // or data.consultationMedium
      formData.append("symptoms", JSON.stringify(symptoms));
      formData.append("reports", "");
      formData.append("reportFile", "");
      formData.append("aiSummary", "");
      formData.append("amount", chosenDoctor.consultationFee ?? 0);

      console.log("Booking online appointment (FormData):", {
        doctorId: chosenDoctor._id,
        patientId,
        scheduledAt: `${geminiDate}T${chosenSlot}`,
      });

      const bookRes = await fetch(
        `${API_BASE_URL}/api/appointment/create-appointment`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!bookRes.ok) {
        throw new Error("Booking failed. Please try again.");
      }

      setBookingStage("completed");
      setBookingMessage("Booking completed successfully!");
      setBookedInfo({
        doctorName: chosenDoctor.fullName,
        date: geminiDate,
        slot: chosenSlot,
      });
    } catch (e) {
      console.error("Booking flow error:", e);
      setBookingStage("error");
      setBookingMessage("");
      setBookingError(
        e?.message || "Something went wrong while booking your appointment."
      );
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setTranscript("");
    setInterimTranscript("");
    setBookingStage("idle");
    setBookingMessage("");
    setBookingError("");
    setBookedInfo(null);
  };

  return (
    <>
      {/* Floating Button */}
      <button
        className="flex gap-2 items-center font-semibold fixed bottom-24 right-6 shadow-lg border border-green-400"
        style={{
          background: "#fff",
          color: "#12A594",
          borderRadius: 999,
          padding: "14px 26px",
          fontSize: 17,
          boxShadow: "0 4px 16px rgba(18,165,148,0.13)",
          border: "2px solid #12A594",
          transition: "background 0.2s, color 0.2s",
          zIndex: 1001,
        }}
        onClick={() => setShowModal(true)}
        onMouseOver={(e) => {
          e.currentTarget.style.background = "#12A594";
          e.currentTarget.style.color = "#fff";
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.background = "#fff";
          e.currentTarget.style.color = "#12A594";
        }}
      >
        <PhoneOutgoing size={22} />
        <span
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
          }}
        >
          Book with Call Right Now
        </span>
      </button>

      {/* Modal */}
      {showModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1100,
            background: "rgba(0,0,0,0.18)",
          }}
        >
          <div
            className="rounded-xl shadow-lg flex flex-col items-center animate-fade-in"
            style={{
              width: "420px",
              maxWidth: "92vw",
              background: "#fff",
              padding: "1.75rem",
              border: "1.5px solid #12A594",
              position: "relative",
              maxHeight: "80vh",
              overflowY: "auto",
            }}
          >
            {/* Close */}
            <button
              onClick={handleCloseModal}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-700"
              style={{
                fontSize: 24,
                background: "none",
                border: "none",
                cursor: "pointer",
              }}
            >
              ×
            </button>

            {/* Header */}
            <div className="w-full text-center mb-3">
              <h2 className="text-lg font-semibold text-gray-800">
                Book an Appointment
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                Describe your problem, preferred date/time and any special
                requests.
              </p>
            </div>

            {/* Body */}
            <div className="w-full flex flex-col items-stretch">
              <textarea
                className="w-full border rounded-lg px-3 py-3 text-sm mb-2 resize-none focus:ring-2 focus:ring-green-400 focus:outline-none"
                style={{ minHeight: 90, background: "#f8f9fa" }}
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                placeholder={
                  'e.g. "I need to book an appointment today after 3:00 a.m. for headache and back pain, prefer online."'
                }
              />
              {interimTranscript && (
                <div className="text-xs italic text-green-600 mb-2 text-center">
                  <span className="animate-pulse mr-1">🎙️</span>
                  Listening: "{interimTranscript}"
                </div>
              )}

              {/* Controls */}
              <div className="flex flex-row flex-wrap gap-2 justify-center mb-2 w-full">
                <button
                  onClick={handleMicClick}
                  className={`px-4 py-2 rounded-full text-sm font-semibold border transition flex items-center gap-2 ${
                    isRecording
                      ? "bg-green-100 border-green-400 text-green-700"
                      : "bg-white border-gray-300 text-green-600"
                  }`}
                  title={isRecording ? "Listening..." : "Click to speak"}
                >
                  {isRecording ? "⏹ Stop" : "🎤 Speak"}
                </button>
                <button
                  onClick={clearTranscript}
                  className="px-4 py-2 rounded-full text-sm border border-gray-300 text-gray-500 bg-white"
                >
                  🗑 Clear
                </button>
              </div>

              <p className="text-center text-[11px] text-gray-500 mb-3 leading-snug">
                Example:{" "}
                <span className="italic">
                  "Consult for headache and back pain, today after 3:00 a.m.,
                  prefer online."
                </span>
              </p>

              {/* Book Button */}
              <button
                className={`mt-1 px-6 py-2 rounded-full text-sm font-semibold transition w-full flex items-center justify-center ${
                  bookingStage === "completed"
                    ? "bg-emerald-600 text-white"
                    : "bg-green-600 hover:bg-green-700 text-white"
                } ${(!transcript.trim() || isBooking) && "opacity-70 cursor-not-allowed"}`}
                onClick={handleBook}
                disabled={!transcript.trim() || isBooking}
              >
                {isBooking && (
                  <span
                    className="inline-block mr-2 border-2 border-white border-t-transparent rounded-full w-4 h-4 animate-spin"
                    aria-hidden="true"
                  />
                )}
                {getBookButtonLabel()}
              </button>

              {/* Status / Messages */}
              {bookingStage !== "idle" && bookingMessage && (
                <div className="mt-2 text-[11px] text-gray-700 text-center">
                  {bookingMessage}
                </div>
              )}

              {bookingStage === "completed" && bookedInfo && (
                <div className="mt-3 text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-center">
                  Appointment booked with{" "}
                  <span className="font-semibold">
                    Dr. {bookedInfo.doctorName}
                  </span>{" "}
                  on <span className="font-medium">{bookedInfo.date}</span> at{" "}
                  <span className="font-medium">{bookedInfo.slot}</span>.
                </div>
              )}

              {bookingStage === "error" && bookingError && (
                <div className="mt-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-center">
                  {bookingError}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default BookWithCallRightNow;
