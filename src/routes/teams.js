const { Router } = require('express');
const { store } = require('../store');
const { ensureAuth, ensureRole } = require('../auth');
const router = Router();
const db = store('teams');
router.get('/:id?', ensureAuth, (req, res) => { if (req.params.id) { const i = db.getById(req.params.id); return i ? res.json(i) : res.send(404); } res.json(db.getAll()); });
router.post('/', ensureRole('admin', 'manager'), (req, res) => { if (!req.body.name) return res.json(400, { error: 'name required' }); res.status(201).json(db.create(req.body)); });
module.exports = router;
