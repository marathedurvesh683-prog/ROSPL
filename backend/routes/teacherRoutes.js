const express = require('express');
const router = express.Router();
const Teacher = require('../models/Teacher');
const { isAuthenticated } = require('../middleware/auth');

// Public routes (no auth needed) - for testing only
// In production, you'd remove these or protect them

// CREATE: Add a new teacher (public for now - will be handled by OAuth)
router.post('/', async (req, res) => {
  try {
    const { googleId, name, email, picture } = req.body;
    
    const existing = await Teacher.findOne({ email });
    if (existing) {
      return res.status(400).json({ error: 'Teacher with this email already exists' });
    }
    
    const teacher = await Teacher.create({
      googleId,
      name,
      email,
      picture
    });
    
    res.status(201).json({
      success: true,
      teacher
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// READ: Get all teachers (for testing - remove in production)
router.get('/', async (req, res) => {
  try {
    const teachers = await Teacher.find()
      .select('name email picture subjects createdAt lastLogin');
    
    res.json({
      success: true,
      count: teachers.length,
      teachers
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Protected routes (require authentication)

// READ: Get current teacher's own profile
router.get('/me', isAuthenticated, async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.user._id)
      .select('name email picture subjects createdAt lastLogin');
    
    res.json({
      success: true,
      teacher
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// UPDATE: Update current teacher's profile
router.put('/me', isAuthenticated, async (req, res) => {
  try {
    const { name, picture, subjects } = req.body;
    
    const teacher = await Teacher.findByIdAndUpdate(
      req.user._id,
      { name, picture, subjects },
      { new: true }
    ).select('name email picture subjects');
    
    res.json({
      success: true,
      message: 'Profile updated successfully',
      teacher
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// READ: Get single teacher by ID (for testing - remove in production)
router.get('/:id', async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id)
      .select('name email picture subjects');
    
    if (!teacher) {
      return res.status(404).json({ error: 'Teacher not found' });
    }
    
    res.json({
      success: true,
      teacher
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
