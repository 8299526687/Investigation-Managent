const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  pno: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['SI', 'Inspector'], required: true },
  district: { type: String, required: true },
  policeStation: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
