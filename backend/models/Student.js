const mongoose = require('mongoose');

const StudentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: true },
  subjectName: { type: String, required: true },
  googleDriveConnected: { type: Boolean, default: false },
  accessToken: String,       // For Drive upload (encrypted in production)
  refreshToken: String,      // For Drive upload (encrypted in production)
  tokenExpiry: Date,         // For tracking token expiry
  authorizationLink: String, // For tracking pending invitations
  authorizedAt: Date,        // Date of authorization
  createdAt: { type: Date, default: Date.now }
});
// Optionally, add a compound index
StudentSchema.index({ teacherId: 1, email: 1, subjectName: 1 }, { unique: true });

module.exports = mongoose.model('Student', StudentSchema);
