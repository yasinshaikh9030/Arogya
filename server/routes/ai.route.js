const { Router } = require("express");
const { getResultController } = require("../controllers/ai.controller");
const { geminiBookingController } = require("../controllers/gemini.controller");

const router = Router();

router.get("/generate-questions", getResultController);
router.post("/gemini-booking", geminiBookingController);

module.exports = router;
