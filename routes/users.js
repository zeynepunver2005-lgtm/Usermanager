const express = require('express');
const router = express.Router();

router.get('/', (req, res) => res.sendStatus(501));
router.get('/:id', (req, res) => res.sendStatus(501));
router.post('/', (req, res) => res.sendStatus(501));
router.put('/:id', (req, res) => res.sendStatus(501));
router.delete('/:id', (req, res) => res.sendStatus(501));

router.post('/login', (req, res) => res.sendStatus(501));
router.post('/logout', (req, res) => res.sendStatus(501));

module.exports = router;