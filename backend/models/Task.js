const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  category: { type: String, enum: ['Investigation', 'Court', 'FSL', 'Witness', 'Arrest', 'General'], default: 'General' },
  dueDate: { type: Date, required: true },
  status: { type: String, enum: ['Pending', 'Completed'], default: 'Pending' },
  relatedCase: { type: mongoose.Schema.Types.ObjectId, ref: 'Case' },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

module.exports = mongoose.model('Task', taskSchema);
