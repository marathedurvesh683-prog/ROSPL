# SLRTCE File Manager

A web application for SLRT College of Engineering teachers to distribute files directly to students' Google Drives.

## Features
- Teacher authentication with Google OAuth
- Student management (add/remove)
- Automatic email notifications to students
- File upload to multiple students simultaneously
- Automatic folder organization in student Drives
- Subject-wise file management

## Tech Stack
- **Frontend:** HTML5, CSS3, Vanilla JavaScript
- **Backend:** Node.js, Express.js
- **Database:** MongoDB Atlas
- **Authentication:** Passport.js with Google OAuth 2.0
- **Email:** Nodemailer with Brevo SMTP
- **File Storage:** Google Drive API

## Setup Instructions

### Prerequisites
- Node.js v18+ installed
- MongoDB Atlas account
- Google Cloud Console project with OAuth credentials
- Brevo SMTP account

### Installation
    1. Clone repository:
        git clone https://github.com/yourusername/slrtce-file-manager.git
        cd slrtce-file-manager
    2. Install backend dependencies:
        cd backend
        npm install
    3. Create `.env` file in backend folder (copy from `.env.example`)
    4. Add your credentials to `.env`
    5. Start backend server:
        npm run dev
    6. Open frontend:
        cd ../frontend
