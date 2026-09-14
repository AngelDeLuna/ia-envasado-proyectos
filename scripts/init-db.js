require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

async function main() {
  const schemaSql = fs.readFileSync(path.join(__dirname, '..', 'db', 'schema.sql'), 'utf8');
  const ssl = String(process.env.MYSQL_SSL || '').toLowerCase() === 'true'
    ? { rejectUnauthorized: false }
    : undefined;

  if (process.env.MYSQL_URL) {
    const conn = await mysql.createConnection({ uri: process.env.MYSQL_URL, ssl, multipleStatements: true });
    await conn.query(schemaSql);
    await conn.end();
  } else {
    const dbName = process.env.MYSQLDATABASE || 'ia_envasado';
    if (!/^[A-Za-z0-9_]+$/.test(dbName)) throw new Error('MYSQLDATABASE solo puede contener letras, números y guion bajo.');
    const base = {
      host: process.env.MYSQLHOST || '127.0.0.1',
      port: Number(process.env.MYSQLPORT || 3306),
      user: process.env.MYSQLUSER || 'root',
      password: process.env.MYSQLPASSWORD || '',
      ssl,
      multipleStatements: true,
    };
    const admin = await mysql.createConnection(base);
    await admin.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    await admin.end();
    const conn = await mysql.createConnection({ ...base, database: dbName });
    await conn.query(schemaSql);
    await conn.end();
  }
  console.log('Base de datos y tablas creadas/verificadas correctamente.');
}

main().catch((err) => {
  console.error('No se pudo inicializar la base de datos:', err.message);
  process.exit(1);
});
