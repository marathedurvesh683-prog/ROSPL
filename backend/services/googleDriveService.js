const { google } = require('googleapis');

class GoogleDriveService {
  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.STUDENT_CLIENT_ID,
      process.env.STUDENT_CLIENT_SECRET,
      process.env.STUDENT_CALLBACK_URL
    );
  }

  /**
   * Generate authorization URL for student
   * @param {string} studentId - MongoDB student ID
   * @returns {string} Authorization URL
   */
  generateAuthUrl(studentId) {
    const authUrl = this.oauth2Client.generateAuthUrl({
      access_type: 'offline', // Get refresh token
      scope: ['https://www.googleapis.com/auth/drive.file'],
      state: studentId, // Pass student ID for identification
      prompt: 'consent' // Force consent screen to get refresh token
    });
    
    return authUrl;
  }

  /**
   * Exchange authorization code for tokens
   * @param {string} code - Authorization code from Google
   * @returns {Promise<Object>} Tokens object
   */
  async getTokensFromCode(code) {
    const { tokens } = await this.oauth2Client.getToken(code);
    return tokens;
  }

  /**
   * Get Drive client with valid tokens for a student
   * @param {Object} student - Student document with tokens
   * @returns {Promise<google.drive_v3.Drive>} Drive client
   */
  async getDriveClient(student) {
    if (!student.refreshToken) {
      throw new Error('Student not authorized');
    }

    // Set credentials
    this.oauth2Client.setCredentials({
      access_token: student.accessToken,
      refresh_token: student.refreshToken
    });

    // Check if token is expired and refresh if needed
    if (new Date() >= student.tokenExpiry) {
      const { credentials } = await this.oauth2Client.refreshAccessToken();
      
      // Update tokens (caller should save to DB)
      student.accessToken = credentials.access_token;
      student.tokenExpiry = new Date(Date.now() + (credentials.expiry_date || 3600000));
      await student.save();
      
      this.oauth2Client.setCredentials(credentials);
    }

    return google.drive({ version: 'v3', auth: this.oauth2Client });
  }

  /**
   * Create folder in student's Drive
   * @param {Object} student - Student document
   * @param {string} folderPath - Folder path array (e.g., ['SLRTCE Files', 'Data Structures', 'Assignments'])
   * @returns {Promise<string>} Folder ID
   */
  async createFolder(student, folderPath) {
    try {
      const drive = await this.getDriveClient(student);
      let parentId = 'root';

      // Create nested folders
      for (const folderName of folderPath) {
        // Check if folder exists
        const response = await drive.files.list({
          q: `name='${folderName}' and '${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
          fields: 'files(id, name)',
          spaces: 'drive'
        });

        if (response.data.files.length > 0) {
          // Folder exists, use it
          parentId = response.data.files[0].id;
        } else {
          // Create folder
          const fileMetadata = {
            name: folderName,
            mimeType: 'application/vnd.google-apps.folder',
            parents: [parentId]
          };

          const folder = await drive.files.create({
            requestBody: fileMetadata,
            fields: 'id'
          });

          parentId = folder.data.id;
        }
      }

      return parentId;
    } catch (error) {
      console.error(`Error creating folder for ${student.email}:`, error.message);
      throw error;
    }
  }

  /**
   * Upload file to student's Drive
   * @param {Object} student - Student document
   * @param {string} folderId - Target folder ID
   * @param {Buffer} fileBuffer - File buffer
   * @param {string} fileName - File name
   * @param {string} mimeType - File MIME type
   * @returns {Promise<Object>} Uploaded file info
   */
  async uploadFile(student, folderId, fileBuffer, fileName, mimeType) {
    try {
      const drive = await this.getDriveClient(student);

      const fileMetadata = {
        name: fileName,
        parents: [folderId]
      };

      const media = {
        mimeType: mimeType,
        body: require('stream').Readable.from(fileBuffer)
      };

      const file = await drive.files.create({
        requestBody: fileMetadata,
        media: media,
        fields: 'id, name, webViewLink'
      });

      return file.data;
    } catch (error) {
      console.error(`Error uploading file for ${student.email}:`, error.message);
      throw error;
    }
  }
}

module.exports = new GoogleDriveService();
