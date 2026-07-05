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
    filePath: String,
    uploadDate: { type: Date, default: Date.now },
    uploadedBy: String,
    fileType: String,
    fileSize: String,
    description: String,
    category: { type: String, default: 'Other Documents' }
  }],
  timeline: [{
    title: String,
    date: { type: Date, default: Date.now },
    description: String,
    status: String
  }],
  witnesses: [{
    name: String,
    address: String,
    contact: String,
    statementDate: Date,
    status: String,
    attachment: String
  }],
  accused: [{
    name: String,
    photoUrl: String,
    personalDetails: String,
    arrestStatus: String,
    bailStatus: String,
    history: String,
    attachment: String
  }],
  parchas: [{
    parchaNumber: Number,
    date: { type: Date, default: Date.now },
    details: String,
    place: String,
    personsMet: String,
    witnessesExamined: String,
    evidenceCollected: String,
    nextStep: String,
    isFinal: { type: Boolean, default: false }
  }],
  evidence: [{
    evidenceNumber: String,
    type: String,
    description: String,
    recoveryDate: Date,
    recoveryPlace: String,
    fslStatus: String,
    status: String
  }],
  notices: [{
    type: String,
    personName: String,
    serviceStatus: String,
    date: Date
  }],
  medical: [{
    type: String, // MLC, Postmortem, etc.
    hospital: String,
    doctorOpinion: String,
    date: Date
  }],
  fsl: [{
    sampleSent: String,
    forwardingLetter: String,
    status: String,
    reportReceivedDate: Date
  }],
  court: [{
    type: String, // Charge Sheet, Final Report
    courtName: String,
    caseNumber: String,
    nextDate: Date,
    orders: String
  }],
  officer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

module.exports = mongoose.model('Case', caseSchema);
