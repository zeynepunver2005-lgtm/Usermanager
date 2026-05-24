const express = require('express');
const router = express.Router();
const { getAllPosts, getPostById, createPost, updatePost, deletePost, getPostCreator } = require('../models/postModel');

const isLoggedIn = (req, res, next) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Nicht angemeldet' });
  next();
};

router.get('/', async (req, res) => {
  try {
    const posts = await getAllPosts();
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const post = await getPostById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post nicht gefunden' });
    res.json(post);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', isLoggedIn, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'Text ist erforderlich' });
    const id = await createPost(text, req.session.userId);
    res.status(201).json({ postId: id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', isLoggedIn, async (req, res) => {
  try {
    const creator = await getPostCreator(req.params.id);
    if (!creator) return res.status(404).json({ error: 'Post nicht gefunden' });
    if (creator !== req.session.userId) return res.status(403).json({ error: 'Keine Berechtigung' });
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'Text ist erforderlich' });
    await updatePost(req.params.id, text);
    res.json({ message: 'Post aktualisiert' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', isLoggedIn, async (req, res) => {
  try {
    const creator = await getPostCreator(req.params.id);
    if (!creator) return res.status(404).json({ error: 'Post nicht gefunden' });
    if (creator !== req.session.userId) return res.status(403).json({ error: 'Keine Berechtigung' });
    await deletePost(req.params.id);
    res.json({ message: 'Post gelöscht' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
