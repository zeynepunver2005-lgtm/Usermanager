const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { getAllUsers, getUserById, createUser, updateUser, deleteUser, getUserByUsername } = require('../models/userModel');

// Middleware: giriş yapılmış mı?
const isLoggedIn = (req, res, next) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Nicht angemeldet' });
  next();
};

// Middleware: doğru kullanıcı mı?
const isOwner = (req, res, next) => {
  if (req.session.userId !== parseInt(req.params.id)) {
    return res.status(403).json({ error: 'Keine Berechtigung' });
  }
  next();
};

// GET /api/users — tüm kullanıcılar
router.get('/', async (req, res) => {
  try {
    const users = await getAllUsers();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/users/:id — tek kullanıcı
router.get('/:id', async (req, res) => {
  try {
    const user = await getUserById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User nicht gefunden' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/users — kayıt ol
router.post('/', async (req, res) => {
  try {
    const { firstname, lastname, username, email, password } = req.body;
    if (!firstname || !lastname || !username || !email || !password) {
      return res.status(400).json({ error: 'Alle Felder sind erforderlich' });
    }
    const id = await createUser(firstname, lastname, username, email, password);
    res.status(201).json({ userId: id });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Username oder Email bereits vergeben' });
    }
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/users/:id — güncelle (sadece kendisi)
router.put('/:id', isLoggedIn, isOwner, async (req, res) => {
  try {
    const { firstname, lastname, username, email, password } = req.body;
    if (!firstname || !lastname || !username || !email || !password) {
      return res.status(400).json({ error: 'Alle Felder sind erforderlich' });
    }
    const affected = await updateUser(req.params.id, firstname, lastname, username, email, password);
    if (affected === 0) return res.status(404).json({ error: 'User nicht gefunden' });
    res.json({ message: 'User aktualisiert' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/users/:id — sil (sadece kendisi)
router.delete('/:id', isLoggedIn, isOwner, async (req, res) => {
  try {
    const affected = await deleteUser(req.params.id);
    if (affected === 0) return res.status(404).json({ error: 'User nicht gefunden' });
    req.session.destroy();
    res.json({ message: 'User gelöscht' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/users/login — giriş
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username und Passwort erforderlich' });
    }
    const user = await getUserByUsername(username);
    if (!user) return res.status(400).json({ error: 'Ungültige Anmeldedaten' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ error: 'Ungültige Anmeldedaten' });

    req.session.userId = user.userId;
    req.session.username = user.username;
    res.json({ message: 'Angemeldet', userId: user.userId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/users/logout — çıkış
router.post('/logout', isLoggedIn, (req, res) => {
  req.session.destroy();
  res.json({ message: 'Abgemeldet' });
});

// GET /api/users/me — aktif kullanıcı
router.get('/me', (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Nicht angemeldet' });
  res.json({ userId: req.session.userId, username: req.session.username });
});

module.exports = router;