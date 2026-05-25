const db = require('../db/connection');
const bcrypt = require('bcryptjs');

const getAllUsers = async () => {
  const [rows] = await db.query('SELECT userId, firstname, lastname, username, email, bio FROM User');
  return rows;
};

const getUserById = async (id) => {
  const [rows] = await db.query(
    'SELECT userId, firstname, lastname, username, email, bio FROM User WHERE userId = ?',
    [id]
  );
  return rows[0];
};

const getUserPasswordById = async (id) => {
  const [rows] = await db.query('SELECT password FROM User WHERE userId = ?', [id]);
  return rows[0]?.password;
};

const createUser = async (firstname, lastname, username, email, password) => {
  const hashed = await bcrypt.hash(password, 10);
  const [result] = await db.query(
    'INSERT INTO User (firstname, lastname, username, email, password) VALUES (?, ?, ?, ?, ?)',
    [firstname, lastname, username, email, hashed]
  );
  return result.insertId;
};

const updateUser = async (id, firstname, lastname, username, email, bio) => {
  const [result] = await db.query(
    'UPDATE User SET firstname=?, lastname=?, username=?, email=?, bio=? WHERE userId=?',
    [firstname, lastname, username, email, bio, id]
  );
  return result.affectedRows;
};

const updatePassword = async (id, oldPassword, newPassword) => {
  const currentHash = await getUserPasswordById(id);
  const isSame = await bcrypt.compare(oldPassword, currentHash);
  if (!isSame) throw new Error('WRONG_PASSWORD');
  const hashed = await bcrypt.hash(newPassword, 10);
  const [result] = await db.query(
    'UPDATE User SET password=? WHERE userId=?',
    [hashed, id]
  );
  return result.affectedRows;
};

const deleteUser = async (id) => {
  const [result] = await db.query('DELETE FROM User WHERE userId = ?', [id]);
  return result.affectedRows;
};

const getUserByUsername = async (username) => {
  const [rows] = await db.query('SELECT * FROM User WHERE username = ?', [username]);
  return rows[0];
};

module.exports = { getAllUsers, getUserById, createUser, updateUser, updatePassword, deleteUser, getUserByUsername };