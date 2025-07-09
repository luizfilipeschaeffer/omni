import { NextRequest, NextResponse } from "next/server";
import { Client } from "pg";

export async function GET(req: NextRequest) {
  // Pega userId da query ou retorna erro
  const userId = req.nextUrl.searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ error: "userId obrigatório" }, { status: 400 });
  }
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();
  try {
    const chats = await client.query(
      `SELECT c.id, c.name, c.is_group,
        (SELECT content FROM messages m WHERE m.chat_id = c.id ORDER BY m.created_at DESC LIMIT 1) as last_message
       FROM chats c
       JOIN memberships m ON m.chat_id = c.id
       WHERE m.user_id = $1
       ORDER BY c.created_at DESC`,
      [userId]
    );
    // Buscar participantes para cada chat
    const chatRows = chats.rows;
    for (const chat of chatRows) {
      const usersRes = await client.query(
        `SELECT u.id, u.name, u.email FROM users u
         JOIN memberships m ON m.user_id = u.id
         WHERE m.chat_id = $1`,
        [chat.id]
      );
      chat.participants = usersRes.rows;
    }
    return NextResponse.json(chatRows);
  } finally {
    await client.end();
  }
}

export async function POST(req: NextRequest) {
  const { userIds, name } = await req.json();
  if (!userIds || !Array.isArray(userIds) || userIds.length < 2) {
    return NextResponse.json({ error: "userIds obrigatórios" }, { status: 400 });
  }
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();
  try {
    const chatRes = await client.query(
      `INSERT INTO chats (is_group, name) VALUES ($1, $2) RETURNING *`,
      [false, name || null]
    );
    const chat = chatRes.rows[0];
    for (const uid of userIds) {
      await client.query(
        `INSERT INTO memberships (user_id, chat_id) VALUES ($1, $2)`,
        [uid, chat.id]
      );
    }
    return NextResponse.json(chat);
  } finally {
    await client.end();
  }
}

export async function DELETE(req: NextRequest) {
  const chatId = req.nextUrl.searchParams.get("chatId");
  if (!chatId) {
    return NextResponse.json({ error: "chatId obrigatório" }, { status: 400 });
  }
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();
  try {
    // Remove memberships, mensagens e o chat
    await client.query(`DELETE FROM memberships WHERE chat_id = $1`, [chatId]);
    await client.query(`DELETE FROM messages WHERE chat_id = $1`, [chatId]);
    await client.query(`DELETE FROM chats WHERE id = $1`, [chatId]);
    return NextResponse.json({ ok: true });
  } finally {
    await client.end();
  }
} 