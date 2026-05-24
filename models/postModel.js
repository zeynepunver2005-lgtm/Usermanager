const db = require('../db/connection');

const getAllPosts = async () => {
  const [rows] = await db.query(
    'SELECT p.postId, p.text, p.creationDate, p.creator, u.username FROM Post p JOIN User u ON p.creator = u.userId ORDER BY p.creationDate DESC'
  );
  return rows;
};

const getPostById = async (id) => {
  const [rows] = await db.query(
    'SELECT p.postId, p.text, p.creationDate, p.creator, u.username FROM Post p JOIN User u ON p.creator = u.userId WHERE p.postId = ?',
    [id]
  );
  return rows[0];
};

const createPost = async (text, creator) => {
  const [result] = await db.query(
    'INSERT INTO Post (text, creator) VALUES (?, ?)',
    [text, creator]
  );
  return result.insertId;
};

const updatePost = async (id, text) => {
  const [result] = await db.query(
    'UPDATE Post SET text=? WHERE postId=?',
    [text, id]
  );
  return result.affectedRows;
};

const deletePost = async (id) => {
  const [result] = await db.query('DELETE FROM Post WHERE postId = ?', [id]);
  return result.affectedRows;
};

const getPostCreator = async (id) => {
  const [rows] = await db.query('SELECT creator FROM Post WHERE postId = ?', [id]);
  return rows[0]?.creator;
};

module.exports = { getAllPosts, getPostById, createPost, updatePost, deletePost, getPostCreator };
