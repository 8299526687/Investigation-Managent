const mongoose = require('mongoose');

const caseSchema = new mongoose.Schema({
  firNumber: { type: String, required: true, unique: true },
  caseId: { type: String, required: true, unique: true },
  sections: { type: String, required: true },
  incidentDate: { type: Date, required: true },
  victimDetails: { type: String, required: true },
  accusedDetails: { type: String, required: true },
  investigationNotes: { type: String },
  status: { type: String, enum: ['Pending', 'Completed'], default: 'Pending' },
  documents: [{
    fileName: String,
    filePath: String
  }],
  officer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

caseSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Case', caseSchema);
