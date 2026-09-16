const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: '127.0.0.1', // Certifique-se que este IP está correto
  user: 'root',
  //password: 'root', 
  port: 3306,
  database: 'marcon',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = pool;