const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const jwt = require('jsonwebtoken');
const Case = require('../models/Case');

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

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname))
  }
});
const upload = multer({ storage: storage });

// Get all cases for the logged-in officer
router.get('/', auth, async (req, res) => {
  try {
    const cases = await Case.find({ officer: req.user.id }).sort({ createdAt: -1 });
    res.json(cases);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new case
router.post('/', auth, upload.array('documents', 5), async (req, res) => {
  try {
    const documents = req.files ? req.files.map(f => ({ fileName: f.originalname, filePath: f.path })) : [];
    
    const newCase = new Case({
      ...req.body,
      documents,
      officer: req.user.id
    });

    const caseSaved = await newCase.save();
    res.json(caseSaved);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Update a case
router.put('/:id', auth, upload.array('documents', 5), async (req, res) => {
  try {
    let caseItem = await Case.findById(req.params.id);
    if (!caseItem) return res.status(404).json({ message: 'Case not found' });
    if (caseItem.officer.toString() !== req.user.id) return res.status(401).json({ message: 'Not authorized' });

    const newDocs = req.files ? req.files.map(f => ({ fileName: f.originalname, filePath: f.path })) : [];
    const documents = [...caseItem.documents, ...newDocs];

    caseItem = await Case.findByIdAndUpdate(req.params.id, 
      { $set: { ...req.body, documents, updatedAt: Date.now() } }, 
      { new: true }
    );
    res.json(caseItem);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get case by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const caseItem = await Case.findById(req.params.id);
    if (!caseItem) return res.status(404).json({ message: 'Case not found' });
    if (caseItem.officer.toString() !== req.user.id) return res.status(401).json({ message: 'Not authorized' });
    res.json(caseItem);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
