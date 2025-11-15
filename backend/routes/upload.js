const express = require('express');
const router = express.Router();
const multer = require('multer');
const Student = require('../models/Student');
const googleDriveService = require('../services/googleDriveService');
const { isAuthenticated, attachTeacher } = require('../middleware/auth');

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept all file types for now
    // Can add restrictions later: PDFs, images, etc.
    cb(null, true);
  }
});

// Protect all upload routes
router.use(isAuthenticated);
router.use(attachTeacher);

// Upload file to multiple students
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const { subjectName, documentType, studentIds } = req.body;
    const teacherId = req.teacherId;
    
    // Validate inputs
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    if (!subjectName || !documentType) {
      return res.status(400).json({ 
        error: 'Subject name and document type are required' 
      });
    }
    
    if (!studentIds || studentIds.length === 0) {
      return res.status(400).json({ error: 'No students selected' });
    }
    
    // Parse studentIds if it's a string
    const studentIdArray = typeof studentIds === 'string' 
      ? JSON.parse(studentIds) 
      : studentIds;
    
    // Get file details
    const fileName = req.file.originalname;
    const fileBuffer = req.file.buffer;
    const mimeType = req.file.mimetype;
    
    console.log(`📤 Uploading ${fileName} to ${studentIdArray.length} students...`);
    
    // Get all students
    const students = await Student.find({
      _id: { $in: studentIdArray },
      teacherId: teacherId,
      googleDriveConnected: true
    });
    
    if (students.length === 0) {
      return res.status(400).json({ 
        error: 'No authorized students found' 
      });
    }
    
    // Upload to each student
    const results = [];
    
    for (const student of students) {
      try {
        // Define folder path: SLRTCE Files / [Subject] ([Teacher]) / [DocumentType]
        const folderPath = [
          'SLRTCE Files',
          `${subjectName}`,
          documentType
        ];
        
        // Create folder structure
        const folderId = await googleDriveService.createFolder(student, folderPath);
        
        // Upload file
        const uploadedFile = await googleDriveService.uploadFile(
          student,
          folderId,
          fileBuffer,
          fileName,
          mimeType
        );
        
        results.push({
          studentId: student._id,
          studentName: student.name,
          studentEmail: student.email,
          status: 'success',
          fileId: uploadedFile.id,
          webViewLink: uploadedFile.webViewLink
        });
        
        console.log(`✅ Uploaded to ${student.name}`);
        
      } catch (error) {
        console.error(`❌ Failed for ${student.name}:`, error.message);
        
        results.push({
          studentId: student._id,
          studentName: student.name,
          studentEmail: student.email,
          status: 'failed',
          error: error.message
        });
      }
    }
    
    // Count successes and failures
    const successCount = results.filter(r => r.status === 'success').length;
    const failCount = results.filter(r => r.status === 'failed').length;
    
    res.json({
      success: true,
      message: `Upload complete: ${successCount} successful, ${failCount} failed`,
      fileName: fileName,
      fileSize: req.file.size,
      totalStudents: studentIdArray.length,
      successCount,
      failCount,
      results
    });
    
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ 
      error: 'Upload failed', 
      details: error.message 
    });
  }
});

// Get upload history (optional - for future)
router.get('/history', async (req, res) => {
  try {
    // This would query an UploadLog collection if you create one
    // For now, return empty array
    res.json({
      success: true,
      uploads: []
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
