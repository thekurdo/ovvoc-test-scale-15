const { Router } = require('express');
const { store } = require('../store');
const { ensureRole } = require('../auth');
const router = Router();
const db = store('settings');
router.get('/:id?', ensureRole('admin'), (req, res) => { if (req.params.id) { const i = db.getById(req.params.id); return i ? res.json(i) : res.send(404); } res.json(db.getAll()); });
router.post('/', ensureRole('admin'), (req, res) => { if (!req.body.key) return res.json(400, { error: 'key required' }); res.status(201).json(db.create(req.body)); });
router.put('/:id', ensureRole('admin'), (req, res) => { const i = db.update(req.params.id, req.body); i ? res.json(i) : res.send(404); });
module.exports = router;
