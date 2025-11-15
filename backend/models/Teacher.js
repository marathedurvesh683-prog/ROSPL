const mongoose = require('mongoose');

const TeacherSchema = new mongoose.Schema({
  googleId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  picture: { type: String },
  subjects: [
    {
      subjectName: { type: String, required: true },
      academicYear: String,
      semester: String,
      status: { type: String, default: 'active', enum: ['active', 'archived'] }
    }
  ],
  createdAt: { type: Date, default: Date.now },
  lastLogin: { type: Date, default: Date.now }
});

// Method to add a subject
TeacherSchema.methods.addSubject = function(subjectName, academicYear, semester) {
  // Check if subject already exists
  const exists = this.subjects.some(
    sub => sub.subjectName === subjectName && sub.status === 'active'
  );
  
  if (exists) {
    throw new Error('Subject already exists');
  }
  
  this.subjects.push({
    subjectName,
    academicYear,
    semester,
    status: 'active'
  });
  
  return this.save();
};

// Method to archive a subject
TeacherSchema.methods.archiveSubject = function(subjectName) {
  const subject = this.subjects.find(
    sub => sub.subjectName === subjectName && sub.status === 'active'
  );
  
  if (!subject) {
    throw new Error('Subject not found');
  }
  
  subject.status = 'archived';
  return this.save();
};

module.exports = mongoose.model('Teacher', TeacherSchema);
