// Script para popular o banco com dados de teste para o chat
// Execute: node scripts/seed-chat-data.ts
const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('render') ? { rejectUnauthorized: false } : false,
});

async function seed() {
  await client.connect();
  // Limpar dados antigos
  await client.query('DELETE FROM messages');
  await client.query('DELETE FROM memberships');
  await client.query('DELETE FROM chats');
  await client.query('DELETE FROM users');

  // Criar usuários
  const users = [
    { email: 'maria@example.com', password_hash: 'hash1', name: 'Maria Silva' },
    { email: 'joao@example.com', password_hash: 'hash2', name: 'João Souza' },
  ];
  const userIds = [];
  for (const u of users) {
    const res = await client.query(
      'INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id',
      [u.email, u.password_hash, u.name]
    );
    userIds.push(res.rows[0].id);
  }

  // Criar chats
  const chats = [
    { is_group: false, name: null },
    { is_group: true, name: 'Grupo Devs' },
  ];
  const chatIds = [];
  for (const c of chats) {
    const res = await client.query(
      'INSERT INTO chats (is_group, name) VALUES ($1, $2) RETURNING id',
      [c.is_group, c.name]
    );
    chatIds.push(res.rows[0].id);
  }

  // Criar memberships
  await client.query('INSERT INTO memberships (user_id, chat_id) VALUES ($1, $2)', [userIds[0], chatIds[0]]);
  await client.query('INSERT INTO memberships (user_id, chat_id) VALUES ($1, $2)', [userIds[1], chatIds[0]]);
  await client.query('INSERT INTO memberships (user_id, chat_id) VALUES ($1, $2)', [userIds[0], chatIds[1]]);
  await client.query('INSERT INTO memberships (user_id, chat_id) VALUES ($1, $2)', [userIds[1], chatIds[1]]);

  // Criar mensagens
  await client.query('INSERT INTO messages (chat_id, user_id, content) VALUES ($1, $2, $3)', [chatIds[0], userIds[0], 'Oi João!']);
  await client.query('INSERT INTO messages (chat_id, user_id, content) VALUES ($1, $2, $3)', [chatIds[0], userIds[1], 'Oi Maria! Tudo bem?']);
  await client.query('INSERT INTO messages (chat_id, user_id, content) VALUES ($1, $2, $3)', [chatIds[1], userIds[0], 'Bom dia, grupo!']);
  await client.query('INSERT INTO messages (chat_id, user_id, content) VALUES ($1, $2, $3)', [chatIds[1], userIds[1], 'Bom dia! Prontos para a reunião?']);

  await client.end();
  console.log('Seed de dados do chat concluído!');
}

seed().catch(e => { console.error(e); client.end(); }); 