const express = require('express');
const router = express.Router();
const { getCommentsByPost, getCommentById, createComment, updateComment, deleteComment, getCommentCreator } = require('../models/commentModel');

const isLoggedIn = (req, res, next) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Nicht angemeldet' });
  next();
};

router.get('/', async (req, res) => {
  try {
    const { postId } = req.query;
    if (!postId) return res.status(400).json({ error: 'postId erforderlich' });
    const comments = await getCommentsByPost(postId);
    res.json(comments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const comment = await getCommentById(req.params.id);
    if (!comment) return res.status(404).json({ error: 'Kommentar nicht gefunden' });
    res.json(comment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', isLoggedIn, async (req, res) => {
  try {
    const { text, origin } = req.body;
    if (!text || !origin) return res.status(400).json({ error: 'Text und origin erforderlich' });
    const id = await createComment(text, origin, req.session.userId);
    res.status(201).json({ commentId: id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', isLoggedIn, async (req, res) => {
  try {
    const creator = await getCommentCreator(req.params.id);
    if (!creator) return res.status(404).json({ error: 'Kommentar nicht gefunden' });
    if (creator !== req.session.userId) return res.status(403).json({ error: 'Keine Berechtigung' });
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'Text ist erforderlich' });
    await updateComment(req.params.id, text);
    res.json({ message: 'Kommentar aktualisiert' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', isLoggedIn, async (req, res) => {
  try {
    const creator = await getCommentCreator(req.params.id);
    if (!creator) return res.status(404).json({ error: 'Kommentar nicht gefunden' });
    if (creator !== req.session.userId) return res.status(403).json({ error: 'Keine Berechtigung' });
    await deleteComment(req.params.id);
    res.json({ message: 'Kommentar gelöscht' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
