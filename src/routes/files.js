const { Router } = require('express');
const { store } = require('../store');
const { ensureAuth } = require('../auth');
const router = Router();
const db = store('files');
router.get('{/:id}', ensureAuth, (req, res) => { if (req.params.id) { const i = db.getById(req.params.id); return i ? res.json(i) : res.sendStatus(404); } res.json(db.getAll()); });
router.post('/', ensureAuth, (req, res) => { if (!req.body.filename) return res.status(400).json({ error: 'filename required' }); res.status(201).json(db.create({ filename: req.body.filename, uploader: req.user.username })); });
router.delete('/:id', ensureAuth, (req, res) => { db.remove(req.params.id) ? res.json({ ok: true }) : res.sendStatus(404); });
module.exports = router;
