const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// Auto-copy uploaded images to frontend/img folder
try {
  const frontendImgDir = path.join(__dirname, '../frontend/img');
  if (!fs.existsSync(frontendImgDir)) {
    fs.mkdirSync(frontendImgDir, { recursive: true });
  }
  const logoSource = 'C:\\Users\\eThana 04\\.gemini\\antigravity-ide\\brain\\c774eb72-f7bf-4f7c-9a57-e670ae9b5f9f\\media__1783242831698.png';
  if (fs.existsSync(logoSource)) {
    fs.copyFileSync(logoSource, path.join(frontendImgDir, 'logo.png'));
  }
} catch (err) {
  console.error("Error auto-copying images:", err);
}

const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Custom routes for the uploaded logos (Must be BEFORE express.static)
app.get('/img/logo.png', (req, res) => {
  res.sendFile('C:\\Users\\eThana 04\\.gemini\\antigravity-ide\\brain\\c774eb72-f7bf-4f7c-9a57-e670ae9b5f9f\\media__1783242831698.png');
});
app.get('/img/flag.png', (req, res) => {
  res.sendFile('C:\\Users\\eThana 04\\.gemini\\antigravity-ide\\brain\\c774eb72-f7bf-4f7c-9a57-e670ae9b5f9f\\media__1783242831663.png');
});

// Serve frontend static files
app.use(express.static(path.join(__dirname, '../frontend')));

const { connectDB } = require('./db');

// Connect to Database
connectDB();

// Routes
const authRoutes = require('./routes/auth');
const casesRoutes = require('./routes/cases');
const aiRoutes = require('./routes/ai');
const tasksRoutes = require('./routes/tasks');

app.use('/api/auth', authRoutes);
app.use('/api/cases', casesRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/tasks', tasksRoutes);

// Fallback to frontend index.html for any other requests
app.use((req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
