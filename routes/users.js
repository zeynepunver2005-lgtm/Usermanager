const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { getAllUsers, getUserById, createUser, updateUser, updatePassword, deleteUser, getUserByUsername } = require('../models/userModel');

const isLoggedIn = (req, res, next) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Nicht angemeldet' });
  next();
};

const isOwner = (req, res, next) => {
  if (req.session.userId !== parseInt(req.params.id)) {
    return res.status(403).json({ error: 'Keine Berechtigung' });
  }
  next();
};

/**
 * @api {get} /users Liste aller Benutzer
 * @apiName GetAllUsers
 * @apiGroup User
 *
 * @apiSuccess {Object[]} users Liste der Benutzer.
 * @apiSuccess {Number} users.userId ID des Benutzers.
 * @apiSuccess {String} users.firstname Vorname.
 * @apiSuccess {String} users.lastname Nachname.
 * @apiSuccess {String} users.username Benutzername.
 * @apiSuccess {String} users.email E-Mail-Adresse.
 * @apiSuccess {String} users.bio Biografie.
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     [
 *       {
 *         "userId": 1,
 *         "firstname": "Max",
 *         "lastname": "Mustermann",
 *         "username": "maxm",
 *         "email": "max@example.com",
 *         "bio": "Hallo, ich bin Max."
 *       }
 *     ]
 *
 * @apiError (500) InternalServerError Datenbankfehler.
 * @apiErrorExample {json} Error-Response:
 *     HTTP/1.1 500 Internal Server Error
 *     { "error": "Datenbankfehler" }
 */
router.get('/me', (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Nicht angemeldet' });
  res.json({ userId: req.session.userId, username: req.session.username });
});

/**
 * @api {get} /users/me Aktiver Benutzer
 * @apiName GetMe
 * @apiGroup User
 *
 * @apiSuccess {Number} userId ID des eingeloggten Benutzers.
 * @apiSuccess {String} username Benutzername des eingeloggten Benutzers.
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     { "userId": 1, "username": "maxm" }
 *
 * @apiError (401) Unauthorized Nicht angemeldet.
 * @apiErrorExample {json} Error-Response:
 *     HTTP/1.1 401 Unauthorized
 *     { "error": "Nicht angemeldet" }
 */
router.get('/mycomments/:id', isLoggedIn, async (req, res) => {
  try {
    const { getAllCommentsByUser } = require('../models/commentModel');
    const comments = await getAllCommentsByUser(req.params.id);
    res.json(comments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @api {get} /users/mycomments/:id Eigene Kommentare
 * @apiName GetMyComments
 * @apiGroup User
 *
 * @apiParam {Number} id Benutzer-ID.
 *
 * @apiSuccess {Object[]} comments Liste der eigenen Kommentare.
 * @apiSuccess {Number} comments.commentId ID des Kommentars.
 * @apiSuccess {String} comments.text Kommentartext.
 * @apiSuccess {Number} comments.origin Post-ID.
 * @apiSuccess {String} comments.postText Text des zugehörigen Posts.
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     [
 *       {
 *         "commentId": 3,
 *         "text": "Toller Post!",
 *         "origin": 1,
 *         "postText": "Hallo Welt"
 *       }
 *     ]
 *
 * @apiError (401) Unauthorized Nicht angemeldet.
 * @apiError (500) InternalServerError Datenbankfehler.
 */

/**
 * @api {post} /users/login Anmelden
 * @apiName LoginUser
 * @apiGroup User
 *
 * @apiBody {String} username Benutzername.
 * @apiBody {String} password Passwort.
 *
 * @apiSuccess {String} message Erfolgsmeldung.
 * @apiSuccess {Number} userId ID des angemeldeten Benutzers.
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     { "message": "Angemeldet", "userId": 1 }
 *
 * @apiError (400) BadRequest Fehlende Felder oder ungültige Anmeldedaten.
 * @apiErrorExample {json} Error-Response:
 *     HTTP/1.1 400 Bad Request
 *     { "error": "Ungültige Anmeldedaten" }
 */
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username und Passwort erforderlich' });
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

/**
 * @api {post} /users/logout Abmelden
 * @apiName LogoutUser
 * @apiGroup User
 *
 * @apiSuccess {String} message Erfolgsmeldung.
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     { "message": "Abgemeldet" }
 *
 * @apiError (401) Unauthorized Nicht angemeldet.
 */
router.post('/logout', isLoggedIn, (req, res) => {
  req.session.destroy();
  res.json({ message: 'Abgemeldet' });
});

/**
 * @api {get} /users Liste aller Benutzer
 * @apiName GetUsers
 * @apiGroup User
 *
 * @apiSuccess {Object[]} users Liste der Benutzer.
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     [{ "userId": 1, "username": "maxm", "email": "max@example.com" }]
 *
 * @apiError (500) InternalServerError Datenbankfehler.
 */
router.get('/', async (req, res) => {
  try {
    const users = await getAllUsers();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @api {post} /users Neuen Benutzer registrieren
 * @apiName CreateUser
 * @apiGroup User
 *
 * @apiBody {String} firstname Vorname.
 * @apiBody {String} lastname Nachname.
 * @apiBody {String} username Benutzername (eindeutig).
 * @apiBody {String} email E-Mail-Adresse (eindeutig).
 * @apiBody {String} password Passwort (wird gehasht gespeichert).
 *
 * @apiSuccess (201) {Number} userId ID des neu erstellten Benutzers.
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 201 Created
 *     { "userId": 5 }
 *
 * @apiError (400) BadRequest Fehlende Felder oder doppelter Username/E-Mail.
 * @apiErrorExample {json} Error-Response:
 *     HTTP/1.1 400 Bad Request
 *     { "error": "Username oder Email bereits vergeben" }
 */
router.post('/', async (req, res) => {
  try {
    const { firstname, lastname, username, email, password } = req.body;
    if (!firstname || !lastname || !username || !email || !password) {
      return res.status(400).json({ error: 'Alle Felder sind erforderlich' });
    }
    const id = await createUser(firstname, lastname, username, email, password);
    res.status(201).json({ userId: id });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: 'Username oder Email bereits vergeben' });
    res.status(500).json({ error: err.message });
  }
});

/**
 * @api {get} /users/:id Benutzer nach ID
 * @apiName GetUserById
 * @apiGroup User
 *
 * @apiParam {Number} id Benutzer-ID.
 *
 * @apiSuccess {Number} userId ID des Benutzers.
 * @apiSuccess {String} firstname Vorname.
 * @apiSuccess {String} lastname Nachname.
 * @apiSuccess {String} username Benutzername.
 * @apiSuccess {String} email E-Mail-Adresse.
 * @apiSuccess {String} bio Biografie.
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "userId": 1,
 *       "firstname": "Max",
 *       "lastname": "Mustermann",
 *       "username": "maxm",
 *       "email": "max@example.com",
 *       "bio": "Hallo!"
 *     }
 *
 * @apiError (404) NotFound Benutzer nicht gefunden.
 * @apiErrorExample {json} Error-Response:
 *     HTTP/1.1 404 Not Found
 *     { "error": "User nicht gefunden" }
 */
router.get('/:id', async (req, res) => {
  try {
    const user = await getUserById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User nicht gefunden' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @api {put} /users/:id Benutzer aktualisieren
 * @apiName UpdateUser
 * @apiGroup User
 *
 * @apiParam {Number} id Benutzer-ID.
 * @apiBody {String} firstname Vorname.
 * @apiBody {String} lastname Nachname.
 * @apiBody {String} username Benutzername.
 * @apiBody {String} email E-Mail-Adresse.
 * @apiBody {String} [bio] Biografie (optional).
 *
 * @apiSuccess {String} message Erfolgsmeldung.
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     { "message": "User aktualisiert" }
 *
 * @apiError (400) BadRequest Fehlende Felder oder doppelter Username/E-Mail.
 * @apiError (401) Unauthorized Nicht angemeldet.
 * @apiError (403) Forbidden Keine Berechtigung.
 * @apiError (404) NotFound Benutzer nicht gefunden.
 */
router.put('/:id', isLoggedIn, isOwner, async (req, res) => {
  try {
    const { firstname, lastname, username, email, bio } = req.body;
    if (!firstname || !lastname || !username || !email) {
      return res.status(400).json({ error: 'Alle Felder sind erforderlich' });
    }
    const affected = await updateUser(req.params.id, firstname, lastname, username, email, bio || '');
    if (affected === 0) return res.status(404).json({ error: 'User nicht gefunden' });
    req.session.username = username;
    res.json({ message: 'User aktualisiert' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: 'Username oder Email bereits vergeben' });
    res.status(500).json({ error: err.message });
  }
});

/**
 * @api {put} /users/:id/password Passwort ändern
 * @apiName UpdatePassword
 * @apiGroup User
 *
 * @apiParam {Number} id Benutzer-ID.
 * @apiBody {String} oldPassword Aktuelles Passwort.
 * @apiBody {String} newPassword Neues Passwort (min. 6 Zeichen).
 *
 * @apiSuccess {String} message Erfolgsmeldung.
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     { "message": "Passwort aktualisiert" }
 *
 * @apiError (400) BadRequest Falsches Passwort oder zu kurzes neues Passwort.
 * @apiError (401) Unauthorized Nicht angemeldet.
 * @apiError (403) Forbidden Keine Berechtigung.
 * @apiErrorExample {json} Error-Response:
 *     HTTP/1.1 400 Bad Request
 *     { "error": "Aktuelles Passwort ist falsch" }
 */
router.put('/:id/password', isLoggedIn, isOwner, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ error: 'Altes und neues Passwort erforderlich' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Neues Passwort muss mindestens 6 Zeichen lang sein' });
    }
    await updatePassword(req.params.id, oldPassword, newPassword);
    res.json({ message: 'Passwort aktualisiert' });
  } catch (err) {
    if (err.message === 'WRONG_PASSWORD') {
      return res.status(400).json({ error: 'Aktuelles Passwort ist falsch' });
    }
    res.status(500).json({ error: err.message });
  }
});

/**
 * @api {delete} /users/:id Benutzer löschen
 * @apiName DeleteUser
 * @apiGroup User
 *
 * @apiParam {Number} id Benutzer-ID.
 *
 * @apiSuccess {String} message Erfolgsmeldung.
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     { "message": "User gelöscht" }
 *
 * @apiError (401) Unauthorized Nicht angemeldet.
 * @apiError (403) Forbidden Keine Berechtigung.
 * @apiError (404) NotFound Benutzer nicht gefunden.
 */
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

module.exports = router;
