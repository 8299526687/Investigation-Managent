const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const jwt = require('jsonwebtoken');
const { Case } = require('../db');

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
    console.log("==> Fetching cases for officer:", req.user.id);
    const cases = await Case.find({ officer: req.user.id }).sort({ createdAt: -1 });
    console.log(`Found ${cases.length} cases.`);
    res.json(cases);
  } catch (err) {
    console.error("Error fetching cases:", err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new case
router.post('/', auth, upload.array('documents', 5), async (req, res) => {
  try {
    console.log("==> Creating new case for officer:", req.user.id);
    console.log("Req Body:", req.body);
    const documents = req.files ? req.files.map(f => ({ fileName: f.originalname, filePath: f.path })) : [];
    
    const caseSaved = await Case.create({
      ...req.body,
      documents,
      officer: req.user.id
    });
    
    console.log("Case successfully saved to DB:", caseSaved._id);
    res.json(caseSaved);
  } catch (err) {
    console.error("Error saving case:", err);
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

// Upload Document/Media with metadata
router.post('/:id/documents', auth, upload.array('files', 10), async (req, res) => {
  try {
    let caseItem = await Case.findById(req.params.id);
    if (!caseItem) return res.status(404).json({ message: 'Case not found' });
    if (caseItem.officer.toString() !== req.user.id) return res.status(401).json({ message: 'Not authorized' });

    const category = req.body.category || 'Other Documents';
    const description = req.body.description || '';
    
    const newDocs = req.files ? req.files.map(f => ({ 
        fileName: f.originalname, 
        filePath: f.path,
        uploadDate: new Date(),
        uploadedBy: req.user.name || 'Officer', // req.user.name might not exist, but we store something
        fileType: f.mimetype,
        fileSize: (f.size / 1024 / 1024).toFixed(2) + ' MB',
        description: description,
        category: category
    })) : [];

    const documents = [...caseItem.documents, ...newDocs];

    caseItem = await Case.findByIdAndUpdate(req.params.id, 
      { $set: { documents, updatedAt: Date.now() } }, 
      { new: true }
    );
    res.json({ message: 'Files uploaded successfully', documents: newDocs });
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

// Add Witness
router.post('/:id/witnesses', auth, async (req, res) => {
  try {
    let caseItem = await Case.findById(req.params.id);
    if (!caseItem) return res.status(404).json({ message: 'Case not found' });
    caseItem.witnesses.push({ ...req.body, statementDate: new Date() });
    await caseItem.save();
    res.json(caseItem);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add Accused
router.post('/:id/accused', auth, async (req, res) => {
  try {
    let caseItem = await Case.findById(req.params.id);
    if (!caseItem) return res.status(404).json({ message: 'Case not found' });
    caseItem.accused.push(req.body);
    await caseItem.save();
    res.json(caseItem);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add Timeline Event
router.post('/:id/timeline', auth, async (req, res) => {
  try {
    let caseItem = await Case.findById(req.params.id);
    if (!caseItem) return res.status(404).json({ message: 'Case not found' });
    caseItem.timeline.push(req.body);
    await caseItem.save();
    res.json(caseItem);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add Parcha (Case Diary)
router.post('/:id/parchas', auth, async (req, res) => {
  try {
    let caseItem = await Case.findById(req.params.id);
    if (!caseItem) return res.status(404).json({ message: 'Case not found' });
    const parchaNumber = (caseItem.parchas?.length || 0) + 1;
    caseItem.parchas.push({ ...req.body, parchaNumber, date: new Date() });
    await caseItem.save();
    res.json(caseItem);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Add Evidence
router.post('/:id/evidence', auth, async (req, res) => {
  try {
    let caseItem = await Case.findById(req.params.id);
    if (!caseItem) return res.status(404).json({ message: 'Case not found' });
    caseItem.evidence.push(req.body);
    await caseItem.save();
    res.json(caseItem);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Add Notice
router.post('/:id/notices', auth, async (req, res) => {
  try {
    let caseItem = await Case.findById(req.params.id);
    if (!caseItem) return res.status(404).json({ message: 'Case not found' });
    caseItem.notices.push(req.body);
    await caseItem.save();
    res.json(caseItem);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Add Medical
router.post('/:id/medical', auth, async (req, res) => {
  try {
    let caseItem = await Case.findById(req.params.id);
    if (!caseItem) return res.status(404).json({ message: 'Case not found' });
    caseItem.medical.push(req.body);
    await caseItem.save();
    res.json(caseItem);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Add FSL
router.post('/:id/fsl', auth, async (req, res) => {
  try {
    let caseItem = await Case.findById(req.params.id);
    if (!caseItem) return res.status(404).json({ message: 'Case not found' });
    caseItem.fsl.push(req.body);
    await caseItem.save();
    res.json(caseItem);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Add Court Order/Date
router.post('/:id/court', auth, async (req, res) => {
  try {
    let caseItem = await Case.findById(req.params.id);
    if (!caseItem) return res.status(404).json({ message: 'Case not found' });
    caseItem.court.push(req.body);
    await caseItem.save();
    res.json(caseItem);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
