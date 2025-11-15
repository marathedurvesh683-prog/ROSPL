const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const { isAuthenticated, attachTeacher } = require('../middleware/auth');
const googleDriveService = require('../services/googleDriveService');
const emailService = require('../services/emailService');
const Teacher = require('../models/Teacher');

// Protect ALL student routes - require authentication
router.use(isAuthenticated);
router.use(attachTeacher);

// CREATE: Add a new student (only for logged-in teacher)
// CREATE: Add a new student and send authorization email
router.post('/', async (req, res) => {
  try {
    const { name, email, subjectName } = req.body;
    const teacherId = req.teacherId; // From middleware
    
    // Validate email domain
    const domain = email.split('@')[1];
    if (domain.toLowerCase() !== process.env.COLLEGE_DOMAIN.toLowerCase()) {
      return res.status(400).json({ 
        error: `Email must be from @${process.env.COLLEGE_DOMAIN} domain` 
      });
    }
    
    // Check if student already exists for this teacher and subject
    const existing = await Student.findOne({ 
      email, 
      teacherId, 
      subjectName 
    });
    
    if (existing) {
      return res.status(400).json({ 
        error: 'Student already exists in your class for this subject' 
      });
    }
    
    // Get teacher info for email
    const teacher = await Teacher.findById(teacherId);
    
    // Create new student
    const student = await Student.create({
      name,
      email,
      teacherId,
      subjectName
    });
    
    // Generate authorization URL
    const authUrl = googleDriveService.generateAuthUrl(student._id.toString());
    student.authorizationLink = authUrl;
    await student.save();
    
    // 🔥 Send authorization email automatically
    const emailResult = await emailService.sendAuthorizationEmail(
      student.email,
      student.name,
      authUrl,
      teacher.name,
      subjectName
    );
    
    res.status(201).json({
      success: true,
      message: 'Student added successfully. Authorization email sent.',
      student: {
        id: student._id,
        name: student.name,
        email: student.email,
        subjectName: student.subjectName,
        googleDriveConnected: student.googleDriveConnected,
        authorizationLink: authUrl
      },
      emailSent: emailResult.success
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// READ: Get all students for logged-in teacher
router.get('/', async (req, res) => {
  try {
    const teacherId = req.teacherId; // From middleware
    const { subjectName } = req.query; // Optional filter by subject
    
    const filter = { teacherId };
    if (subjectName) {
      filter.subjectName = subjectName;
    }
    
    const students = await Student.find(filter)
      .select('name email subjectName googleDriveConnected authorizedAt createdAt')
      .sort({ name: 1 });
    
    res.json({
      success: true,
      count: students.length,
      students
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// READ: Get single student (only if belongs to logged-in teacher)
router.get('/:id', async (req, res) => {
  try {
    const teacherId = req.teacherId;
    
    const student = await Student.findOne({
      _id: req.params.id,
      teacherId // Ensure student belongs to this teacher
    });
    
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    
    res.json(student);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// UPDATE: Update student info (only if belongs to logged-in teacher)
router.put('/:id', async (req, res) => {
  try {
    const { name, subjectName } = req.body;
    const teacherId = req.teacherId;
    
    const student = await Student.findOneAndUpdate(
      { _id: req.params.id, teacherId }, // Find by ID AND teacherId
      { name, subjectName },
      { new: true }
    );
    
    if (!student) {
      return res.status(404).json({ 
        error: 'Student not found or does not belong to you' 
      });
    }
    
    res.json({
      success: true,
      message: 'Student updated successfully',
      student
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE: Remove student (only if belongs to logged-in teacher)
router.delete('/:id', async (req, res) => {
  try {
    const teacherId = req.teacherId;
    
    const student = await Student.findOneAndDelete({
      _id: req.params.id,
      teacherId
    });
    
    if (!student) {
      return res.status(404).json({ 
        error: 'Student not found or does not belong to you' 
      });
    }
    
    res.json({ 
      success: true,
      message: 'Student removed successfully' 
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Resend authorization email
router.post('/resend-auth/:id', async (req, res) => {
  try {
    const teacherId = req.teacherId;
    
    const student = await Student.findOne({
      _id: req.params.id,
      teacherId
    });
    
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    
    if (student.googleDriveConnected) {
      return res.status(400).json({ error: 'Student is already authorized' });
    }
    
    // Get teacher info
    const teacher = await Teacher.findById(teacherId);
    
    // Send reminder email
    const emailResult = await emailService.sendReminderEmail(
      student.email,
      student.name,
      student.authorizationLink,
      teacher.name,
      student.subjectName
    );
    
    res.json({
      success: true,
      message: 'Reminder email sent successfully',
      emailSent: emailResult.success
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});


module.exports = router;
