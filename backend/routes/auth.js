const express = require('express');
const router = express.Router();
const passport = require('passport');
const Student = require('../models/Student');
const googleDriveService = require('../services/googleDriveService');

// Frontend URL - for redirects
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://127.0.0.1:5500/frontend';

// Initiate Google OAuth login
router.get('/google', 
  passport.authenticate('google', { 
    scope: ['profile', 'email']
  })
);

// Google OAuth callback
router.get('/google/callback',
  passport.authenticate('google', { 
    failureRedirect: 'http://localhost:8000/login.html?error=unauthorized',
    successRedirect: 'http://localhost:8000/dashboard.html'
  })
);

// Get current logged-in user info
router.get('/me', (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ authenticated: false });
  }
  
  res.json({
    authenticated: true,
    teacher: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      picture: req.user.picture
    }
  });
});

// Logout
router.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' });
    }
    req.session.destroy();
    res.json({ success: true, message: 'Logged out successfully' });
  });
});

// OAuth callback for STUDENTS (different from teacher login)
router.get('/student/callback', async (req, res) => {
  try {
    const { code, state } = req.query;
    const studentId = state; // Student ID passed in state parameter

    if (!code || !studentId) {
      return res.status(400).send('Missing authorization code or student ID');
    }

    // Exchange code for tokens
    const tokens = await googleDriveService.getTokensFromCode(code);

    // Update student record
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).send('Student not found');
    }

    student.accessToken = tokens.access_token;
    student.refreshToken = tokens.refresh_token;
    student.tokenExpiry = new Date(Date.now() + (tokens.expiry_date || 3600000));
    student.googleDriveConnected = true;
    student.authorizedAt = new Date();
    await student.save();

    // Success page
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Authorization Successful</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background: #f5f5f0;
          }
          .container {
            background: white;
            padding: 40px;
            border-radius: 12px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.08);
            text-align: center;
            max-width: 500px;
          }
          .success-icon {
            font-size: 60px;
            margin-bottom: 20px;
          }
          h1 {
            color: #333;
            margin-bottom: 10px;
          }
          p {
            color: #666;
            line-height: 1.6;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="success-icon">✓</div>
          <h1>Authorization Successful!</h1>
          <p><strong>${student.name}</strong> (${student.email})</p>
          <p>Your Google Drive has been connected successfully.</p>
          <p>Your teacher can now send files directly to your Google Drive.</p>
          <p>You can close this window now.</p>
        </div>
      </body>
      </html>
    `);

  } catch (error) {
    console.error('Student OAuth callback error:', error);
    res.status(500).send('Authorization failed. Please try again.');
  }
});

module.exports = router;
