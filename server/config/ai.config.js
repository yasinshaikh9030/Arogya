const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY);

// Single model configuration
const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
});

const generatePrompt = async (prompt) => {
    try {
        const result = await model.generateContent(prompt);
        const response = result.response.candidates[0].content.parts[0].text;

        return response;
    } catch (error) {
        console.error("AI Generation Error:", error);
        throw new Error(error.message);
    }
};

module.exports = {
    generatePrompt,
};
