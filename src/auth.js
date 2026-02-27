const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const users = require('./users');

passport.use(new LocalStrategy(function(username, password, done) {
  const user = users.findByUsername(username);
  if (!user || !users.validate(user, password)) return done(null, false);
  return done(null, user);
}));

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser((id, done) => done(null, users.findById(id) || false));

function ensureAuth(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.status(401).json({ error: 'Not authenticated' });
}

function ensureRole(...roles) {
  return (req, res, next) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: 'Not authenticated' });
    if (!roles.includes(req.user.role)) return res.status(403).json({ error: 'Forbidden' });
    next();
  };
}

module.exports = { ensureAuth, ensureRole };
