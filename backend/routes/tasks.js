const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Task = require('../models/Task');

const auth = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ message: 'No token' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secretKey');
    req.user = decoded.user;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token invalid' });
  }
};

router.get('/', auth, async (req, res) => {
    try {
        const tasks = await Task.find({ assignedTo: req.user.id }).populate('relatedCase');
        res.json(tasks);
    } catch(err) {
        res.status(500).json({ message: err.message });
    }
});

router.post('/', auth, async (req, res) => {
    try {
        const task = await Task.create({ ...req.body, assignedTo: req.user.id });
        res.json(task);
    } catch(err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
