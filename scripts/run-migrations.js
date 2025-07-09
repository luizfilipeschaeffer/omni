require('dotenv').config();
console.log('DATABASE_URL:', process.env.DATABASE_URL);
// Script para rodar migrations SQL em ordem, executando apenas as pendentes
// Uso: node scripts/run-migrations.js

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const MIGRATIONS_DIR = path.join(__dirname, '../migrations');
const DATABASE_URL = process.env.DATABASE_URL;

async function getAppliedMigrations(client) {
  await client.query(`CREATE TABLE IF NOT EXISTS migrations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    executed_at TIMESTAMP DEFAULT NOW()
  );`);
  const res = await client.query('SELECT name FROM migrations ORDER BY name');
  return res.rows.map(r => r.name);
}

async function applyMigration(client, filename, sql) {
  console.log(`Aplicando migration: ${filename}`);
  await client.query('BEGIN');
  try {
    await client.query(sql);
    await client.query('INSERT INTO migrations (name) VALUES ($1)', [filename]);
    await client.query('COMMIT');
    console.log(`Migration aplicada: ${filename}`);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  }
}

async function runMigrations() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();
  const applied = await getAppliedMigrations(client);
  const files = fs.readdirSync(MIGRATIONS_DIR)
    .filter(f => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    if (!applied.includes(file)) {
      const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
      await applyMigration(client, file, sql);
    } else {
      console.log(`Migration já aplicada: ${file}`);
    }
  }

  await client.end();
  console.log('Todas as migrations estão atualizadas.');
}

runMigrations().catch(err => {
  console.error('Erro ao rodar migrations:', err);
  process.exit(1);
}); 