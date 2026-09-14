require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

async function main() {
  const sql = fs.readFileSync(path.join(__dirname, '..', 'db', 'seed.sql'), 'utf8');
  const common = process.env.MYSQL_URL
    ? { uri: process.env.MYSQL_URL }
    : {
        host: process.env.MYSQLHOST || '127.0.0.1',
        port: Number(process.env.MYSQLPORT || 3306),
        user: process.env.MYSQLUSER || 'root',
        password: process.env.MYSQLPASSWORD || '',
        database: process.env.MYSQLDATABASE || 'ia_envasado',
      };
  if (String(process.env.MYSQL_SSL || '').toLowerCase() === 'true') common.ssl = { rejectUnauthorized: false };
  common.multipleStatements = true;
  const conn = await mysql.createConnection(common);
  await conn.query(sql);
  await conn.end();
  console.log('Datos iniciales cargados correctamente.');
}

main().catch((err) => {
  console.error('No se pudieron cargar los datos iniciales:', err.message);
  process.exit(1);
});
