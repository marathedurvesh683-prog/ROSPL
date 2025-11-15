const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const Teacher = require('../models/Teacher');

// Configure Google OAuth Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      // Extract email from Google profile
      const email = profile.emails[0].value;
      
      // ⚠️ CRITICAL: Validate college domain
      const domain = email.split('@')[1];
      if (domain.toLowerCase() !== process.env.COLLEGE_DOMAIN.toLowerCase()) {
        return done(null, false, { 
          message: 'Only @slrtce.in email addresses are allowed' 
        });
      }
      
      // Find or create teacher
      let teacher = await Teacher.findOne({ googleId: profile.id });
      
      if (teacher) {
        // Update existing teacher
        teacher.lastLogin = new Date();
        teacher.name = profile.displayName;
        teacher.picture = profile.photos[0]?.value;
        await teacher.save();
      } else {
        // Create new teacher
        teacher = await Teacher.create({
          googleId: profile.id,
          name: profile.displayName,
          email: email,
          picture: profile.photos[0]?.value
        });
      }
      
      return done(null, teacher);
      
    } catch (error) {
      console.error('Error in Google Strategy:', error);
      return done(error, null);
    }
  }
));

// Serialize user for session (store teacher ID in session)
passport.serializeUser((teacher, done) => {
  done(null, teacher.id);
});

// Deserialize user from session (get teacher from ID)
passport.deserializeUser(async (id, done) => {
  try {
    const teacher = await Teacher.findById(id);
    done(null, teacher);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;
