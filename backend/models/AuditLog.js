const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  action: { type: String, enum: ['DOWNLOAD', 'VIEW', 'DELETE', 'RESTORE'], required: true },
  documentId: { type: String },
  fileName: { type: String },
  caseId: { type: String },
  timestamp: { type: Date, default: Date.now },
  ipAddress: { type: String }
});

module.exports = mongoose.model('AuditLog', auditLogSchema);
