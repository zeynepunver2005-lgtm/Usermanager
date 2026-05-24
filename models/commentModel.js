const db = require('../db/connection');

const getCommentsByPost = async (postId) => {
  const [rows] = await db.query(
    `SELECT c.commentId, c.text, c.origin, c.creator, c.parentId, u.username
     FROM Comment c
     JOIN User u ON c.creator = u.userId
     WHERE c.origin = ?
     ORDER BY c.commentId ASC`,
    [postId]
  );
  return rows;
};

const getCommentById = async (id) => {
  const [rows] = await db.query(
    `SELECT c.commentId, c.text, c.origin, c.creator, c.parentId, u.username
     FROM Comment c
     JOIN User u ON c.creator = u.userId
     WHERE c.commentId = ?`,
    [id]
  );
  return rows[0];
};

const createComment = async (text, origin, creator, parentId = null) => {
  const [result] = await db.query(
    'INSERT INTO Comment (text, origin, creator, parentId) VALUES (?, ?, ?, ?)',
    [text, origin, creator, parentId]
  );
  return result.insertId;
};

const updateComment = async (id, text) => {
  const [result] = await db.query('UPDATE Comment SET text=? WHERE commentId=?', [text, id]);
  return result.affectedRows;
};

const deleteComment = async (id) => {
  const [result] = await db.query('DELETE FROM Comment WHERE commentId = ?', [id]);
  return result.affectedRows;
};

const getCommentCreator = async (id) => {
  const [rows] = await db.query('SELECT creator FROM Comment WHERE commentId = ?', [id]);
  return rows[0]?.creator;
};

const getAllCommentsByUser = async (userId) => {
  const [rows] = await db.query(
    `SELECT c.commentId, c.text, c.origin, c.creator, c.parentId, u.username,
            p.text as postText
     FROM Comment c
     JOIN User u ON c.creator = u.userId
     JOIN Post p ON c.origin = p.postId
     WHERE c.creator = ?
     ORDER BY c.commentId DESC`,
    [userId]
  );
  return rows;
};

module.exports = { getCommentsByPost, getCommentById, createComment, updateComment, deleteComment, getCommentCreator, getAllCommentsByUser };