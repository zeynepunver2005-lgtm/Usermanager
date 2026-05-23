const mysql = require('mysql2');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'usermanager',
  waitForConnections: true,
  connectionLimit: 10
});

module.exports = pool.promise();