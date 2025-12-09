const express = require("express");
const Groq = require("groq-sdk");

const router = express.Router();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

router.post("/health-analyze", async (req, res) => {
    try {
        const { symptoms } = req.body;

        if (!symptoms) {
            return res.status(400).json({ error: "Symptoms are required" });
        }

        const prompt = `You are a medical assistant AI. Analyze the patient's symptoms provided below:

Symptoms: "${symptoms}"

Your task:
Return ONLY JSON. No markdown, no explanations, no extra text outside JSON.

Follow this EXACT JSON structure:

{
  "health_state": "",
  "diseases": [
    {
      "name": "",
      "probability": "",
      "reason": "",
      "severity": "",
      "recommended_consultation_type": ""
    }
  ],
  "remedies": [],
  "appointment_urgency": {
    "level": "",
    "scale_1_to_5": "",
    "reason": ""
  },
  "consultation_suggestion": "",
  "urgent": "",
  "lifestyle": [],
  "disclaimer": "This is not medical advice."
}

Rules to follow:
1. Output **only top 3 possible diseases**.
2. Probabilities must be between **10%–95%** and medically realistic.
3. Include strong reasoning based on physiological and clinical patterns.
4. Always identify any **red flags** in the symptoms.
5. DO NOT recommend or mention **any medicines, drugs or OTC products**.
6. Remedies should only be **safe home measures** (hydration, rest, steam, etc.).
7. “appointment_urgency.scale_1_to_5” must be:
   - 1 = Not needed  
   - 2 = Low urgency  
   - 3 = Moderate (within a few days)  
   - 4 = High (within 24 hours)  
   - 5 = Immediate / ER  
8. “recommended_consultation_type” per disease must be either:
   - "online"
   - "offline"
9. “consultation_suggestion” must state whether the overall case is better suited for:
   - "Online consultation is sufficient"
   - "Offline consultation recommended"
   - "Immediate emergency care required"
10. Fill **every field** with detailed, medically sound information.
11. The output must be valid, clean JSON that can be parsed by an API.
12. End with: "disclaimer": "This is not medical advice."`;


        const completion = await groq.chat.completions.create({
            model: "llama-3.1-8b-instant",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.4,
        });

        const aiText = completion.choices[0].message.content;


        console.log('=================');
        console.log(aiText);

        let parsed;
        try {
            parsed = JSON.parse(aiText);
        } catch (err) {
            console.log("Groq RAW OUTPUT:", aiText);
            return res
                .status(500)
                .json({ error: "Invalid JSON returned by AI" });
        }

        const diseasesSource = parsed.diseases || parsed.possibleDiseases || [];

        const mapped = {
            healthState: parsed.health_state || parsed.healthState || null,
            possibleDiseases: Array.isArray(diseasesSource)
                ? diseasesSource.map((d) => ({
                      name: d.name,
                      probability: d.probability || d.confidence,
                      reason: d.reason,
                      severity: d.severity || null,
                      recommendedConsultationType: d.recommended_consultation_type || d.recommendedConsultationType || null,
                  }))
                : [],
            remedies: Array.isArray(parsed.remedies)
                ? parsed.remedies.map((r) => ({
                      name: r.name || (typeof r === "string" ? r : ""),
                      description: r.description || (typeof r === "string" ? "" : ""),
                  }))
                : [],
            appointmentUrgency: parsed.appointment_urgency || parsed.appointmentUrgency || null,
            consultationSuggestion: parsed.consultation_suggestion || parsed.consultationSuggestion || null,
            urgent: parsed.urgent || "",
            lifestyleAdvice: Array.isArray(parsed.lifestyle)
                ? parsed.lifestyle.map((l) => ({
                      name: l.name || (typeof l === "string" ? l : ""),
                      description: l.description || (typeof l === "string" ? "" : ""),
                  }))
                : [],
            disclaimer: parsed.disclaimer || "",
        };

        res.json(mapped);
    } catch (error) {
        console.error("Groq Health Error:", error);
        res.status(500).json({ error: "Groq AI failed" });
    }
});

module.exports = router;
