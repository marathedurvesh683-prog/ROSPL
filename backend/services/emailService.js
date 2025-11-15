const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    // Create transporter with Brevo SMTP
    this.transporter = nodemailer.createTransport({  // ← FIXED: removed "er"
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: false, // Use TLS
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });
    
    // Verify connection on startup
    // this.transporter.verify((error, success) => {
    //   if (error) {
    //     console.error('❌ Email service error:', error);
    //   } else {
    //     console.log('✅ Email service ready');
    //   }
    // });
    console.log('⚠️ Email service initialized (verification disabled for now)');
  }

  /**
   * Send authorization request email to student
   * @param {string} studentEmail - Student's email
   * @param {string} studentName - Student's name
   * @param {string} authorizationLink - OAuth authorization URL
   * @param {string} teacherName - Teacher's name
   * @param {string} subjectName - Subject name
   */
  async sendAuthorizationEmail(studentEmail, studentName, authorizationLink, teacherName, subjectName) {
    try {
      const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: studentEmail,
        subject: '🔑 Action Required: Authorize SLRTCE File Manager',
        html: this.getAuthorizationEmailTemplate(studentName, authorizationLink, teacherName, subjectName)
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log(`✅ Authorization email sent to ${studentEmail}`);
      return { success: true, messageId: info.messageId };
      
    } catch (error) {
      console.error(`❌ Failed to send email to ${studentEmail}:`, error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send reminder email for pending authorization
   */
  async sendReminderEmail(studentEmail, studentName, authorizationLink, teacherName, subjectName) {
    try {
      const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: studentEmail,
        subject: '⏰ Reminder: Authorize SLRTCE File Manager',
        html: this.getReminderEmailTemplate(studentName, authorizationLink, teacherName, subjectName)
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log(`✅ Reminder email sent to ${studentEmail}`);
      return { success: true, messageId: info.messageId };
      
    } catch (error) {
      console.error(`❌ Failed to send reminder to ${studentEmail}:`, error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Email template for authorization request
   */
  getAuthorizationEmailTemplate(studentName, authorizationLink, teacherName, subjectName) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f5f5f5;
          }
          .container {
            max-width: 600px;
            margin: 40px auto;
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
          }
          .content {
            padding: 40px 30px;
          }
          .content h2 {
            color: #333;
            font-size: 20px;
            margin-top: 0;
          }
          .content p {
            color: #666;
            font-size: 16px;
            margin: 15px 0;
          }
          .button {
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white !important;
            text-decoration: none;
            padding: 15px 40px;
            border-radius: 5px;
            font-weight: 600;
            margin: 20px 0;
            text-align: center;
          }
          .steps {
            background: #f9f9f9;
            padding: 20px;
            border-radius: 5px;
            margin: 20px 0;
          }
          .steps ol {
            margin: 0;
            padding-left: 20px;
          }
          .steps li {
            margin: 10px 0;
            color: #666;
          }
          .footer {
            background: #f5f5f5;
            padding: 20px 30px;
            text-align: center;
            font-size: 14px;
            color: #999;
          }
          .warning {
            background: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .warning p {
            margin: 0;
            color: #856404;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎓 SLRTCE File Manager</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Authorization Request</p>
          </div>
          
          <div class="content">
            <h2>Hello ${studentName},</h2>
            
            <p><strong>${teacherName}</strong> has added you to the <strong>${subjectName}</strong> class in the SLRTCE File Management System.</p>
            
            <p>To receive assignments, experiments, and study materials directly in your Google Drive, you need to authorize this application <strong>just once</strong>.</p>
            
            <div class="steps">
              <strong>What happens next:</strong>
              <ol>
                <li>Click the authorization button below</li>
                <li>Log in with your SLRTCE Google account</li>
                <li>Click "Allow" on the permission screen</li>
                <li>You're done! (Takes only 30 seconds)</li>
              </ol>
            </div>
            
            <div style="text-align: center;">
              <a href="${authorizationLink}" class="button">
                🔐 Authorize Google Drive Access
              </a>
            </div>
            
            <div class="warning">
              <p><strong>⚠️ Important:</strong> You must use your <strong>@slrtce.in</strong> college email to authorize. Personal Gmail accounts won't work.</p>
            </div>
            
            <p style="margin-top: 30px; font-size: 14px; color: #999;">
              <strong>Why is this needed?</strong><br>
              This authorization allows your teacher to upload files directly to a folder in your Google Drive. You'll receive files automatically without manual downloads.
            </p>
            
            <p style="font-size: 14px; color: #999;">
              <strong>Privacy:</strong> The application can only create and manage files it uploads. It cannot access, read, or delete your existing Drive files.
            </p>
          </div>
          
          <div class="footer">
            <p><strong>SLRT College of Engineering</strong></p>
            <p>Mira Road, Maharashtra</p>
            <p style="margin-top: 10px;">This is an automated message from the SLRTCE File Management System.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Email template for reminder
   */
  getReminderEmailTemplate(studentName, authorizationLink, teacherName, subjectName) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { 
            font-family: Arial, sans-serif; 
            line-height: 1.6; 
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f5f5f5;
          }
          .container { 
            max-width: 600px; 
            margin: 40px auto; 
            background: white; 
            padding: 30px; 
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          .header { 
            background: #ff9800; 
            color: white; 
            padding: 20px; 
            text-align: center; 
            border-radius: 5px;
            margin-bottom: 20px;
          }
          .button { 
            display: inline-block; 
            background: #667eea; 
            color: white !important; 
            text-decoration: none; 
            padding: 12px 30px; 
            border-radius: 5px; 
            margin: 20px 0;
            font-weight: 600;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2 style="margin: 0;">⏰ Pending Authorization</h2>
          </div>
          
          <p>Hi ${studentName},</p>
          
          <p>You haven't authorized the SLRTCE File Manager yet for <strong>${subjectName}</strong>. Your teacher <strong>${teacherName}</strong> cannot send you files until you complete this step.</p>
          
          <p><strong>This takes only 30 seconds!</strong></p>
          
          <div style="text-align: center;">
            <a href="${authorizationLink}" class="button">
              Authorize Now
            </a>
          </div>
          
          <p style="font-size: 14px; color: #666; margin-top: 30px;">
            If you have any questions, please contact your teacher.
          </p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          
          <p style="font-size: 12px; color: #999; text-align: center;">
            SLRT College of Engineering - File Management System
          </p>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Send file upload notification (optional - for future use)
   */
  async sendFileUploadNotification(studentEmail, studentName, fileName, subjectName) {
    try {
      const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: studentEmail,
        subject: `📁 New ${subjectName} File: ${fileName}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 20px auto; background: white; padding: 30px; border-radius: 8px; }
              .header { background: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 5px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h2>📚 New File Uploaded</h2>
              </div>
              
              <p>Hi ${studentName},</p>
              
              <p>Your teacher has uploaded a new file to your Google Drive:</p>
              
              <p><strong>File:</strong> ${fileName}</p>
              <p><strong>Subject:</strong> ${subjectName}</p>
              
              <p>Check your Google Drive under the "<strong>SLRTCE Files / ${subjectName}</strong>" folder to access it.</p>
              
              <p style="margin-top: 30px; font-size: 14px; color: #666;">
                SLRTCE File Management System
              </p>
            </div>
          </body>
          </html>
        `
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`✅ Upload notification sent to ${studentEmail}`);
      
    } catch (error) {
      console.error(`❌ Failed to send notification to ${studentEmail}:`, error.message);
    }
  }
}

module.exports = new EmailService();
