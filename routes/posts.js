const express = require('express');
const router = express.Router();
const { getAllPosts, getPostById, createPost, updatePost, deletePost, getPostCreator } = require('../models/postModel');

const isLoggedIn = (req, res, next) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Nicht angemeldet' });
  next();
};

/**
 * @api {get} /posts Liste aller Posts
 * @apiName GetAllPosts
 * @apiGroup Post
 *
 * @apiSuccess {Object[]} posts Liste aller Posts.
 * @apiSuccess {Number} posts.postId ID des Posts.
 * @apiSuccess {String} posts.text Inhalt des Posts.
 * @apiSuccess {String} posts.creationDate Erstellungsdatum.
 * @apiSuccess {Number} posts.creator Benutzer-ID des Erstellers.
 * @apiSuccess {String} posts.username Benutzername des Erstellers.
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     [
 *       {
 *         "postId": 1,
 *         "text": "Hallo Welt!",
 *         "creationDate": "2026-05-24T12:00:00.000Z",
 *         "creator": 1,
 *         "username": "maxm"
 *       }
 *     ]
 *
 * @apiError (500) InternalServerError Datenbankfehler.
 */
router.get('/', async (req, res) => {
  try {
    const posts = await getAllPosts();
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @api {get} /posts/:id Post nach ID
 * @apiName GetPostById
 * @apiGroup Post
 *
 * @apiParam {Number} id Post-ID.
 *
 * @apiSuccess {Number} postId ID des Posts.
 * @apiSuccess {String} text Inhalt des Posts.
 * @apiSuccess {String} creationDate Erstellungsdatum.
 * @apiSuccess {Number} creator Benutzer-ID des Erstellers.
 * @apiSuccess {String} username Benutzername des Erstellers.
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "postId": 1,
 *       "text": "Hallo Welt!",
 *       "creationDate": "2026-05-24T12:00:00.000Z",
 *       "creator": 1,
 *       "username": "maxm"
 *     }
 *
 * @apiError (404) NotFound Post nicht gefunden.
 * @apiErrorExample {json} Error-Response:
 *     HTTP/1.1 404 Not Found
 *     { "error": "Post nicht gefunden" }
 */
router.get('/:id', async (req, res) => {
  try {
    const post = await getPostById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post nicht gefunden' });
    res.json(post);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @api {post} /posts Neuen Post erstellen
 * @apiName CreatePost
 * @apiGroup Post
 *
 * @apiBody {String} text Inhalt des Posts.
 *
 * @apiSuccess (201) {Number} postId ID des erstellten Posts.
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 201 Created
 *     { "postId": 5 }
 *
 * @apiError (400) BadRequest Text fehlt.
 * @apiError (401) Unauthorized Nicht angemeldet.
 * @apiErrorExample {json} Error-Response:
 *     HTTP/1.1 400 Bad Request
 *     { "error": "Text ist erforderlich" }
 */
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

/**
 * @api {put} /posts/:id Post aktualisieren
 * @apiName UpdatePost
 * @apiGroup Post
 *
 * @apiParam {Number} id Post-ID.
 * @apiBody {String} text Neuer Inhalt des Posts.
 *
 * @apiSuccess {String} message Erfolgsmeldung.
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     { "message": "Post aktualisiert" }
 *
 * @apiError (400) BadRequest Text fehlt.
 * @apiError (401) Unauthorized Nicht angemeldet.
 * @apiError (403) Forbidden Keine Berechtigung.
 * @apiError (404) NotFound Post nicht gefunden.
 */
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

/**
 * @api {delete} /posts/:id Post löschen
 * @apiName DeletePost
 * @apiGroup Post
 *
 * @apiParam {Number} id Post-ID.
 *
 * @apiSuccess {String} message Erfolgsmeldung.
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     { "message": "Post gelöscht" }
 *
 * @apiError (401) Unauthorized Nicht angemeldet.
 * @apiError (403) Forbidden Keine Berechtigung.
 * @apiError (404) NotFound Post nicht gefunden.
 * @apiErrorExample {json} Error-Response:
 *     HTTP/1.1 403 Forbidden
 *     { "error": "Keine Berechtigung" }
 */
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
