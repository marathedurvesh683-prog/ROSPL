// Middleware to check if teacher is authenticated
function isAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ 
    authenticated: false, 
    error: 'Please log in to access this resource' 
  });
}

// Middleware to attach teacher info to request
function attachTeacher(req, res, next) {
  if (req.isAuthenticated()) {
    req.teacherId = req.user._id;
    next();
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
}

module.exports = { isAuthenticated, attachTeacher };
