const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Ler configuração do arquivo
const configPath = path.join(__dirname, 'config.json');
let config;

try {
  if (fs.existsSync(configPath)) {
    config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  } else {
    console.error('Arquivo de configuração não encontrado. Execute o setup primeiro.');
    process.exit(1);
  }
} catch (error) {
  console.error('Erro ao ler arquivo de configuração:', error);
  process.exit(1);
}

const pool = mysql.createPool({
  host: config.DB_HOST,
  user: config.DB_USER,
  password: config.DB_PASSWORD,
  database: config.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = pool;
