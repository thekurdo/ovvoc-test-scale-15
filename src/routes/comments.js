const { Router } = require('express');
const { store } = require('../store');
const { ensureAuth } = require('../auth');
const router = Router();
const db = store('comments');
router.get('{/:id}', ensureAuth, (req, res) => { if (req.params.id) { const i = db.getById(req.params.id); return i ? res.json(i) : res.sendStatus(404); } res.json(db.getAll()); });
router.post('/', ensureAuth, (req, res) => { if (!req.body.text) return res.status(400).json({ error: 'text required' }); res.status(201).json(db.create({ text: req.body.text, author: req.user.username })); });
module.exports = router;
