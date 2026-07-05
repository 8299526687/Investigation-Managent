const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { GoogleGenAI } = require('@google/genai');

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
    console.log("==> AI Chat Request Received");
    const { message, caseDetails } = req.body;
    console.log("Message:", message);
    
    // Using mock response if API key is not provided to keep the app working for learning/testing
    if (!process.env.GEMINI_API_KEY) {
        console.log("No GEMINI_API_KEY found, returning mock.");
        return res.json({ 
            reply: `[Mock AI Response]: Based on your query "${message}", I suggest checking the local CCTV footage and interviewing witnesses near the incident location. (Please add GEMINI_API_KEY to .env for real AI responses).` 
        });
    }


    
    // Construct context
    let promptContext = "You are an AI assistant helping a police officer in an investigation. ";
    if (caseDetails) {
        promptContext += `The current case involves sections: ${caseDetails.sections}. Incident date: ${caseDetails.incidentDate}. `;
    }
    promptContext += `Officer asks: ${message}`;

    // Debug: fetch available models
    try {
        const modelsRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
        const modelsData = await modelsRes.json();
        console.log("AVAILABLE MODELS:", modelsData.models?.map(m => m.name).join(', '));
    } catch(e) {
        console.log("Could not list models:", e.message);
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${process.env.GEMINI_API_KEY}`;
    console.log("Calling Gemini API...");
    
    const geminiResponse = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: promptContext }] }]
        })
    });

    console.log("Gemini API Status:", geminiResponse.status);

    if (!geminiResponse.ok) {
        const errorData = await geminiResponse.text();
        console.error("Gemini API returned error body:", errorData);
        throw new Error(`Gemini API Error: ${errorData}`);
    }

    const data = await geminiResponse.json();
    console.log("Gemini API parsing successful");
    const reply = data.candidates[0].content.parts[0].text;

    res.json({ reply: reply });
  } catch (err) {
    console.error('AI Error Stack:', err);
    res.status(500).json({ message: 'Error generating AI response', error: err.message });
  }
});

module.exports = router;
