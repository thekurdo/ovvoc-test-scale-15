const express = require('express');
const session = require('express-session');
const passport = require('passport');
require('./auth');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(session({ secret: 'scale-15-secret', resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());

app.get('/health', (req, res) => { res.json({ status: 'ok', host: req.hostname }); });

// Auth routes
app.post('/auth/login', passport.authenticate('local'), (req, res) => {
  res.json({ message: 'ok', user: { id: req.user.id, username: req.user.username, role: req.user.role } });
});

// Logout — req.logout() without callback (breaks in passport 0.6+)
app.post('/auth/logout', (req, res) => {
  req.logout();
  res.json({ message: 'Logged out' });
});

app.get('/auth/me', (req, res) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: 'Not authenticated' });
  res.json({ id: req.user.id, username: req.user.username, role: req.user.role });
});

// Mount 6 protected route modules
app.use('/api/projects', require('./routes/projects'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/teams', require('./routes/teams'));
app.use('/api/comments', require('./routes/comments'));
app.use('/api/files', require('./routes/files'));
app.use('/api/settings', require('./routes/settings'));

// Search wildcard — /api/search/* (breaks in Express 5)
app.get('/api/search/{*path}', (req, res) => {
  res.json({ query: req.url.replace('/api/search/', ''), results: [] });
});

// Docs wildcard — /docs/* (breaks in Express 5)
app.get('/docs/{*path}', (req, res) => { res.json({ topic: req.url }); });

// 404 catch-all
app.all('{*path}', (req, res) => { res.status(404).json({ error: 'Not found' }); });

if (require.main === module) { app.listen(3000, () => console.log('Server on :3000')); }
module.exports = app;
