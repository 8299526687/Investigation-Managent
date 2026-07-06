const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');



const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));



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
