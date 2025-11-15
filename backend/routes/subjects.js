const express = require('express');
const router = express.Router();
const Teacher = require('../models/Teacher');
const { isAuthenticated } = require('../middleware/auth');

// Protect all subject routes
router.use(isAuthenticated);

// CREATE: Add a new subject
router.post('/', async (req, res) => {
  try {
    const { subjectName, academicYear, semester } = req.body;
    
    if (!subjectName) {
      return res.status(400).json({ error: 'Subject name is required' });
    }
    
    const teacher = await Teacher.findById(req.user._id);
    await teacher.addSubject(subjectName, academicYear, semester);
    
    res.status(201).json({
      success: true,
      message: 'Subject added successfully',
      subjects: teacher.subjects.filter(s => s.status === 'active')
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// READ: Get all active subjects for logged-in teacher
router.get('/', async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.user._id);
    const activeSubjects = teacher.subjects.filter(s => s.status === 'active');
    
    res.json({
      success: true,
      count: activeSubjects.length,
      subjects: activeSubjects
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// UPDATE: Archive a subject
router.put('/archive', async (req, res) => {
  try {
    const { subjectName } = req.body;
    
    if (!subjectName) {
      return res.status(400).json({ error: 'Subject name is required' });
    }
    
    const teacher = await Teacher.findById(req.user._id);
    await teacher.archiveSubject(subjectName);
    
    res.json({
      success: true,
      message: 'Subject archived successfully',
      subjects: teacher.subjects.filter(s => s.status === 'active')
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
