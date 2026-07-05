const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { GoogleGenerativeAI } = require('@google/genai');

// Middleware to authenticate
const auth = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ message: 'No token, authorization denied' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secretKey');
    req.user = decoded.user;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

router.post('/chat', auth, async (req, res) => {
  try {
    const { message, caseDetails } = req.body;
    
    // Using mock response if API key is not provided to keep the app working for learning/testing
    if (!process.env.GEMINI_API_KEY) {
        return res.json({ 
            reply: `[Mock AI Response]: Based on your query "${message}", I suggest checking the local CCTV footage and interviewing witnesses near the incident location. (Please add GEMINI_API_KEY to .env for real AI responses).` 
        });
    }

    const ai = new GoogleGenerativeAI({ apiKey: process.env.GEMINI_API_KEY });
    
    // Construct context
    let promptContext = "You are an AI assistant helping a police officer in an investigation. ";
    if (caseDetails) {
        promptContext += `The current case involves sections: ${caseDetails.sections}. Incident date: ${caseDetails.incidentDate}. `;
    }
    promptContext += `Officer asks: ${message}`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: promptContext,
    });

    res.json({ reply: response.text });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error generating AI response', error: err.message });
  }
});

module.exports = router;
