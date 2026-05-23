const db = require('../db/connection');
const bcrypt = require('bcryptjs');

const getAllUsers = async () => {
  const [rows] = await db.query('SELECT userId, firstname, lastname, username, email FROM User');
  return rows;
};

const getUserById = async (id) => {
  const [rows] = await db.query(
    'SELECT userId, firstname, lastname, username, email FROM User WHERE userId = ?',
    [id]
  );
  return rows[0];
};

const createUser = async (firstname, lastname, username, email, password) => {
  const hashed = await bcrypt.hash(password, 10);
  const [result] = await db.query(
    'INSERT INTO User (firstname, lastname, username, email, password) VALUES (?, ?, ?, ?, ?)',
    [firstname, lastname, username, email, hashed]
  );
  return result.insertId;
};

const updateUser = async (id, firstname, lastname, username, email, password) => {
  const hashed = await bcrypt.hash(password, 10);
  const [result] = await db.query(
    'UPDATE User SET firstname=?, lastname=?, username=?, email=?, password=? WHERE userId=?',
    [firstname, lastname, username, email, hashed, id]
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

module.exports = { getAllUsers, getUserById, createUser, updateUser, deleteUser, getUserByUsername };
