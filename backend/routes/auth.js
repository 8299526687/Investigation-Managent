const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Register Officer (For simplicity, we leave registration open, though in real life it would be restricted)
router.post('/register', async (req, res) => {
  try {
    const { name, pno, password, role, district, policeStation } = req.body;
    
    // Check if PNO exists
    let user = await User.findOne({ pno });
    if (user) return res.status(400).json({ message: 'User already exists' });

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user = new User({
      name, pno, password: hashedPassword, role, district, policeStation
    });

    await user.save();
    res.status(201).json({ message: 'Officer registered successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { pno, password } = req.body;

    const user = await User.findOne({ pno });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const payload = { user: { id: user.id } };
    const token = jwt.sign(payload, process.env.JWT_SECRET || 'secretKey', { expiresIn: '1d' });

    res.json({ token, user: { id: user.id, name: user.name, role: user.role, district: user.district, policeStation: user.policeStation } });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get user profile
router.get('/profile', async (req, res) => {
  try {
    const token = req.header('Authorization').replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secretKey');
    const user = await User.findById(decoded.user.id).select('-password');
    res.json(user);
  } catch (error) {
    res.status(401).json({ message: 'Unauthorized' });
  }
});

module.exports = router;
