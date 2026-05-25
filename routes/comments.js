const express = require('express');
const router = express.Router();
const { getCommentsByPost, getCommentById, createComment, updateComment, deleteComment, getCommentCreator } = require('../models/commentModel');

const isLoggedIn = (req, res, next) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Nicht angemeldet' });
  next();
};

/**
 * @api {get} /comments?postId=:postId Kommentare eines Posts
 * @apiName GetCommentsByPost
 * @apiGroup Comment
 *
 * @apiQuery {Number} postId ID des Posts.
 *
 * @apiSuccess {Object[]} comments Liste der Kommentare.
 * @apiSuccess {Number} comments.commentId ID des Kommentars.
 * @apiSuccess {String} comments.text Kommentartext.
 * @apiSuccess {Number} comments.origin Post-ID.
 * @apiSuccess {Number} comments.creator Benutzer-ID des Erstellers.
 * @apiSuccess {Number} [comments.parentId] ID des übergeordneten Kommentars (bei Antworten).
 * @apiSuccess {String} comments.username Benutzername des Erstellers.
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     [
 *       {
 *         "commentId": 1,
 *         "text": "Toller Post!",
 *         "origin": 1,
 *         "creator": 2,
 *         "parentId": null,
 *         "username": "zoe"
 *       }
 *     ]
 *
 * @apiError (400) BadRequest postId fehlt.
 * @apiErrorExample {json} Error-Response:
 *     HTTP/1.1 400 Bad Request
 *     { "error": "postId erforderlich" }
 */
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

/**
 * @api {get} /comments/:id Kommentar nach ID
 * @apiName GetCommentById
 * @apiGroup Comment
 *
 * @apiParam {Number} id Kommentar-ID.
 *
 * @apiSuccess {Number} commentId ID des Kommentars.
 * @apiSuccess {String} text Kommentartext.
 * @apiSuccess {Number} origin Post-ID.
 * @apiSuccess {Number} creator Benutzer-ID.
 * @apiSuccess {Number} [parentId] ID des übergeordneten Kommentars.
 * @apiSuccess {String} username Benutzername.
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "commentId": 1,
 *       "text": "Toller Post!",
 *       "origin": 1,
 *       "creator": 2,
 *       "parentId": null,
 *       "username": "zoe"
 *     }
 *
 * @apiError (404) NotFound Kommentar nicht gefunden.
 * @apiErrorExample {json} Error-Response:
 *     HTTP/1.1 404 Not Found
 *     { "error": "Kommentar nicht gefunden" }
 */
router.get('/:id', async (req, res) => {
  try {
    const comment = await getCommentById(req.params.id);
    if (!comment) return res.status(404).json({ error: 'Kommentar nicht gefunden' });
    res.json(comment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @api {post} /comments Neuen Kommentar erstellen
 * @apiName CreateComment
 * @apiGroup Comment
 *
 * @apiBody {String} text Kommentartext.
 * @apiBody {Number} origin Post-ID.
 * @apiBody {Number} [parentId] ID des übergeordneten Kommentars (bei Antworten).
 *
 * @apiSuccess (201) {Number} commentId ID des erstellten Kommentars.
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 201 Created
 *     { "commentId": 7 }
 *
 * @apiError (400) BadRequest Text oder origin fehlt.
 * @apiError (401) Unauthorized Nicht angemeldet.
 * @apiErrorExample {json} Error-Response:
 *     HTTP/1.1 400 Bad Request
 *     { "error": "Text und origin erforderlich" }
 */
router.post('/', isLoggedIn, async (req, res) => {
  try {
    const { text, origin, parentId } = req.body;
    if (!text || !origin) return res.status(400).json({ error: 'Text und origin erforderlich' });
    const id = await createComment(text, origin, req.session.userId, parentId || null);
    res.status(201).json({ commentId: id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @api {put} /comments/:id Kommentar aktualisieren
 * @apiName UpdateComment
 * @apiGroup Comment
 *
 * @apiParam {Number} id Kommentar-ID.
 * @apiBody {String} text Neuer Kommentartext.
 *
 * @apiSuccess {String} message Erfolgsmeldung.
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     { "message": "Kommentar aktualisiert" }
 *
 * @apiError (400) BadRequest Text fehlt.
 * @apiError (401) Unauthorized Nicht angemeldet.
 * @apiError (403) Forbidden Keine Berechtigung.
 * @apiError (404) NotFound Kommentar nicht gefunden.
 */
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

/**
 * @api {delete} /comments/:id Kommentar löschen
 * @apiName DeleteComment
 * @apiGroup Comment
 *
 * @apiParam {Number} id Kommentar-ID.
 *
 * @apiSuccess {String} message Erfolgsmeldung.
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     { "message": "Kommentar gelöscht" }
 *
 * @apiError (401) Unauthorized Nicht angemeldet.
 * @apiError (403) Forbidden Keine Berechtigung.
 * @apiError (404) NotFound Kommentar nicht gefunden.
 * @apiErrorExample {json} Error-Response:
 *     HTTP/1.1 403 Forbidden
 *     { "error": "Keine Berechtigung" }
 */
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
