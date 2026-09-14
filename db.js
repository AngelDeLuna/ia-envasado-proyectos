const mysql = require('mysql2/promise');

function sslConfig() {
  return String(process.env.MYSQL_SSL || '').toLowerCase() === 'true'
    ? { rejectUnauthorized: false }
    : undefined;
}

const pool = process.env.MYSQL_URL
  ? mysql.createPool({
      uri: process.env.MYSQL_URL,
      ssl: sslConfig(),
      waitForConnections: true,
      connectionLimit: 10,
      enableKeepAlive: true,
    })
  : mysql.createPool({
      host: process.env.MYSQLHOST || '127.0.0.1',
      port: Number(process.env.MYSQLPORT || 3306),
      user: process.env.MYSQLUSER || 'root',
      password: process.env.MYSQLPASSWORD || '',
      database: process.env.MYSQLDATABASE || 'ia_envasado',
      ssl: sslConfig(),
      waitForConnections: true,
      connectionLimit: 10,
      enableKeepAlive: true,
    });

module.exports = pool;
